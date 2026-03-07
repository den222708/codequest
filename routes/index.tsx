import React from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import Layout from '../components/Layout';

// Public Screens
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import ForgotPassword from '../screens/ForgotPassword';
import RoleSelection from '../screens/RoleSelection';

// Student Screens
import StudentDashboard from '../screens/StudentDashboard';
import StudentProfile from '../screens/StudentProfile';
import AllAssessments from '../screens/AllAssessments';
import SubmissionHistory from '../screens/SubmissionHistory';
import AssessmentInstructions from '../screens/AssessmentInstructions';
import CodeEditor from '../screens/CodeEditor';
import AssessmentResults from '../screens/AssessmentResults';
import Leaderboard from '../screens/Leaderboard';

// Professor Screens
import ProfessorDashboard from '../screens/ProfessorDashboard';
import ProfessorAssessmentHub from '../screens/ProfessorAssessmentHub';
import LiveMonitor from '../screens/LiveMonitor';
import CreateAssessment from '../screens/CreateAssessment';
import QuestionBank from '../screens/QuestionBank';
import CreateQuestion from '../screens/CreateQuestion';
import GroupSetup from '../screens/GroupSetup';
import PlagiarismReport from '../screens/PlagiarismReport';
import Analytics from '../screens/Analytics';

// Admin Screens
import AdminSettings from '../screens/AdminSettings';
import UserManagement from '../screens/UserManagement';
import AdminManagement from '../screens/AdminManagement';
import SystemLogs from '../screens/SystemLogs';
import SystemHealth from '../screens/SystemHealth';
import CourseManagement from '../screens/CourseManagement';

// Shared Screens
import Notifications from '../screens/Notifications';

const DemoEntryPage: React.FC = () => {
  const { startDemoMode } = useApp();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState('Preparing secure demo environment...');
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    let progressInterval: number | null = null;
    const DEMO_BOOTSTRAP_TIMEOUT_MS = 12000;

    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number) =>
      new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error('Demo bootstrap timed out.'));
        }, timeoutMs);

        promise
          .then((value) => {
            window.clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((error) => {
            window.clearTimeout(timeoutId);
            reject(error);
          });
      });

    const animateProgress = (start: number, end: number, durationMs: number) =>
      new Promise<void>((resolve) => {
        const totalSteps = Math.max(1, Math.floor(durationMs / 80));
        const step = (end - start) / totalSteps;
        let current = start;

        progressInterval = window.setInterval(() => {
          current += step;
          if (!mounted) {
            if (progressInterval) window.clearInterval(progressInterval);
            return;
          }

          if (current >= end) {
            setProgress(end);
            if (progressInterval) window.clearInterval(progressInterval);
            progressInterval = null;
            resolve();
            return;
          }

          setProgress(Math.round(current));
        }, 80);
      });

    (async () => {
      try {
        setStatus('Starting demo student session...');
        setProgress(5);
        await Promise.all([
          withTimeout(startDemoMode(), DEMO_BOOTSTRAP_TIMEOUT_MS),
          animateProgress(5, 28, 850),
        ]);

        if (!mounted) return;

        setStatus('Loading demo data...');
        await animateProgress(28, 60, 900);
        if (!mounted) return;

        setStatus('Running pre-assessment checks...');
        await animateProgress(60, 86, 950);
        if (!mounted) return;

        setStatus('Finalizing secure environment...');
        await animateProgress(86, 100, 700);
        if (!mounted) return;

        await new Promise((r) => setTimeout(r, 320));
        navigate('/student/assessments/demo-assessment-1/instructions', { replace: true });
      } catch (error) {
        console.error('Failed to start demo mode:', error);
        if (!mounted) return;
        setStatus('Unable to start demo right now. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    })();

    return () => {
      mounted = false;
      if (progressInterval) window.clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-lg font-black tracking-wide">
          DQ
        </div>
        <h2 className="text-2xl font-bold mb-2">CodeQuest Demo</h2>
        <p className="text-slate-600 mb-5">{status}</p>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-xs text-slate-500">{progress}%</p>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
    users,
    questions,
    assessments,
    currentAssessment,
    notifications,
    submissions,
    systemLogs,
    systemHealth,
    leaderboard,", "oldString": "    systemLogs,
    systemHealth,
    backups,
    leaderboard,
    plagiarismResults,
    editingAssessment,
    editingQuestion,
    login,
    signup,
    logout,
    setRole,
    darkMode,
    toggleDarkMode,
    addUser,
    updateUser,
    deleteUser,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    setEditingQuestion,
    addAssessment,
    updateAssessment,
    deleteAssessment,
    cloneAssessment,
    startAssessment,
    submitAssessment,
    setEditingAssessment,
    markNotificationRead,
    clearNotifications,
    reviewPlagiarism,
    refreshSystemHealth,
  } = useApp();

  const navigate = useNavigate();
  const StudentInstructionsPage: React.FC = () => {
    const { assessmentId } = useParams();

    React.useEffect(() => {
      if (assessmentId && (!currentAssessment || currentAssessment.id !== assessmentId)) {
        startAssessment(assessmentId);
      }
    }, [assessmentId, currentAssessment?.id]);

    return (
      <AssessmentInstructions
        onStart={() => navigate(`/student/assessments/${assessmentId || currentAssessment?.id || ''}/editor`)}
        onBack={() => navigate('/student/assessments')}
      />
    );
  };

  const StudentEditorPage: React.FC = () => {
    const { assessmentId } = useParams();

    React.useEffect(() => {
      if (assessmentId && (!currentAssessment || currentAssessment.id !== assessmentId)) {
        startAssessment(assessmentId);
      }
    }, [assessmentId, currentAssessment?.id]);

    return (
      <CodeEditor
        onSubmit={() => {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => undefined);
          }
          submitAssessment();
          navigate(`/student/assessments/${assessmentId || currentAssessment?.id || ''}/results`);
        }}
        onExit={() => navigate('/student/assessments')}
      />
    );
  };

  const StudentResultsPage: React.FC = () => (
    <AssessmentResults onBack={() => navigate('/student/assessments')} />
  );

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Handle role selection (demo mode)
  const handleRoleSelect = (selectedRole: 'student' | 'professor' | 'admin') => {
    setRole(selectedRole);
  };

  const loginOrDashboard = isAuthenticated ? (
    <Navigate
      to={
        currentUser?.role === 'student'
          ? '/student/dashboard'
          : currentUser?.role === 'professor'
            ? '/professor/dashboard'
            : '/admin/dashboard'
      }
      replace
    />
  ) : (
    <Login />
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={loginOrDashboard} />
      <Route path="/login" element={loginOrDashboard} />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate
              to={
                currentUser?.role === 'student'
                  ? '/student/dashboard'
                  : currentUser?.role === 'professor'
                    ? '/professor/dashboard'
                    : '/admin/dashboard'
              }
              replace
            />
          ) : (
            <Signup />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/demo" element={<DemoEntryPage />} />
      <Route
        path="/role-selection"
        element={
          isAuthenticated ? (
            <Navigate
              to={
                currentUser?.role === 'student'
                  ? '/student/dashboard'
                  : currentUser?.role === 'professor'
                    ? '/professor/dashboard'
                    : '/admin/dashboard'
              }
              replace
            />
          ) : (
            <RoleSelection />
          )
        }
      />

      {/* Protected Routes - Student */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <Layout
              role="student"
              onLogout={handleLogout}
              darkMode={darkMode}
              toggleTheme={toggleDarkMode}
              notifications={notifications}
              userName={currentUser?.name}
            >
              <Routes>
                <Route
                  path="dashboard"
                  element={
                    <StudentDashboard
                      assessments={assessments}
                      onNavigate={(view, assessmentId) => {
                        if (view === 'all-assessments') {
                          navigate('/student/assessments');
                          return;
                        }

                        if (view === 'submission-history') {
                          navigate('/student/submissions');
                          return;
                        }

                        if (view === 'instructions') {
                          const target = assessmentId
                            ? assessments.find(a => a.id === assessmentId)
                            : (assessments.find(a => a.status !== 'draft') || assessments[0]);

                          if (target) {
                            startAssessment(target.id);
                            navigate(`/student/assessments/${target.id}/instructions`);
                          }
                        }
                      }}
                    />
                  }
                />
                <Route path="profile" element={<StudentProfile />} />
                <Route
                  path="assessments"
                  element={
                    <AllAssessments
                      assessments={assessments}
                      onNavigate={(view, assessmentId) => {
                        if (view === 'instructions' && assessmentId) {
                          navigate(`/student/assessments/${assessmentId}/instructions`);
                        }
                      }}
                      onStartAssessment={startAssessment}
                      userRole="student"
                    />
                  }
                />
                <Route
                  path="submissions"
                  element={
                    <SubmissionHistory
                      submissions={submissions}
                      questions={questions}
                      onViewSubmission={(submission) => console.log('View submission:', submission)}
                      onResubmit={(questionId) => {
                        // Navigate handled by component
                      }}
                    />
                  }
                />
                <Route
                  path="leaderboard"
                  element={
                    <Leaderboard
                      entries={leaderboard}
                      currentUserId={currentUser?.id}
                      timeRange="month"
                      onTimeRangeChange={() => { }}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/assessments/:assessmentId/instructions"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentInstructionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessments/:assessmentId/editor"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessments/:assessmentId/results"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentResultsPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Professor */}
      <Route
        path="/professor/*"
        element={
          <ProtectedRoute requiredRole="professor">
            <Layout
              role="professor"
              onLogout={handleLogout}
              darkMode={darkMode}
              toggleTheme={toggleDarkMode}
              notifications={notifications}
              userName={currentUser?.name}
            >
              <Routes>
                <Route
                  path="dashboard"
                  element={<ProfessorDashboard onNavigate={() => { }} />}
                />
                <Route
                  path="assessments"
                  element={
                    <ProfessorAssessmentHub
                      assessments={assessments}
                      questions={questions}
                      onCreateAssessment={() => navigate('/professor/assessments/create')}
                      onEditAssessment={(id) => {
                        const assessment = assessments.find(a => a.id === id);
                        if (assessment) {
                          setEditingAssessment(assessment);
                          navigate(`/professor/assessments/${id}/edit`);
                        }
                      }}
                      onDeleteAssessment={deleteAssessment}
                      onCreateQuestion={() => navigate('/professor/questions/create')}
                      onEditQuestion={(id) => {
                        const question = questions.find(q => q.id === id);
                        if (question) {
                          setEditingQuestion(question);
                          navigate(`/professor/questions/${id}/edit`);
                        }
                      }}
                      onDeleteQuestion={deleteQuestion}
                      onToggleQuestionVisibility={(id, visible) => updateQuestion(id, { isVisible: visible })}
                    />
                  }
                />
                <Route
                  path="assessments/create"
                  element={
                    <CreateAssessment
                      onBack={() => { }}
                      onSave={addAssessment}
                      questions={questions}
                      editingAssessment={editingAssessment}
                      onUpdate={(id, updates) => {
                        updateAssessment(id, updates);
                        setEditingAssessment(null);
                      }}
                    />
                  }
                />
                <Route
                  path="assessments/:assessmentId/edit"
                  element={
                    <CreateAssessment
                      onBack={() => {
                        setEditingAssessment(null);
                      }}
                      onSave={addAssessment}
                      questions={questions}
                      editingAssessment={editingAssessment}
                      onUpdate={(id, updates) => {
                        updateAssessment(id, updates);
                        setEditingAssessment(null);
                      }}
                    />
                  }
                />
                <Route
                  path="questions"
                  element={
                    <QuestionBank
                      questions={questions}
                      onNavigate={(view) => {
                        if (view === 'create-question') {
                          navigate('/professor/questions/create');
                        }
                      }}
                      onDeleteQuestion={deleteQuestion}
                      onToggleVisibility={(id, visible) => updateQuestion(id, { isVisible: visible })}
                    />
                  }
                />
                <Route
                  path="questions/create"
                  element={<CreateQuestion onBack={() => { }} onSave={addQuestion} />}
                />
                <Route
                  path="questions/:questionId/edit"
                  element={
                    <CreateQuestion
                      onBack={() => {
                        setEditingQuestion(null);
                      }}
                      onSave={addQuestion}
                      editingQuestion={editingQuestion}
                      onUpdate={(id, updates) => {
                        updateQuestion(id, updates);
                        setEditingQuestion(null);
                      }}
                    />
                  }
                />
                <Route path="live-monitor" element={<LiveMonitor onBack={() => { }} />} />
                <Route
                  path="analytics"
                  element={<Analytics role="professor" />}
                />
                <Route
                  path="leaderboard"
                  element={
                    <Leaderboard
                      entries={leaderboard}
                      currentUserId={currentUser?.id}
                      timeRange="month"
                      onTimeRangeChange={() => { }}
                    />
                  }
                />
                <Route path="group-setup" element={<GroupSetup onBack={() => { }} />} />
                <Route path="plagiarism" element={<PlagiarismReport onBack={() => { }} />} />
                <Route path="*" element={<Navigate to="/professor/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Admin, Sub Admin, Super Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin', 'subadmin', 'superadmin']}>
            <Layout
              role={currentUser?.role || 'admin'}
              onLogout={handleLogout}
              darkMode={darkMode}
              toggleTheme={toggleDarkMode}
              notifications={notifications}              userName={currentUser?.name}            >
              <Routes>
                <Route path="dashboard" element={<Navigate to="/admin/courses" replace />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route
                  path="users"
                  element={
                    <UserManagement
                      users={users}
                      onAddUser={addUser}
                      onUpdateUser={updateUser}
                      onDeleteUser={deleteUser}
                    />
                  }
                />
                <Route
                  path="admins"
                  element={
                    <AdminManagement
                      users={users}
                      onAddUser={addUser}
                      onUpdateUser={updateUser}
                      onDeleteUser={deleteUser}
                    />
                  }
                />
                <Route
                  path="analytics"
                  element={<Analytics role="admin" />}
                />
                <Route
                  path="system/health"
                  element={
                    <SystemHealth
                      health={systemHealth}
                      onRefresh={refreshSystemHealth}
                      onServiceRestart={(serviceName) => {
                        console.log('Restarting service:', serviceName);
                      }}
                    />
                  }
                />
                <Route
                  path="system/logs"
                  element={
                    <SystemLogs
                      logs={systemLogs}
                      users={users}
                      onExport={(format) => {
                        console.log('Exporting logs as:', format);
                      }}
                    />
                  }
                />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="*" element={<Navigate to="/admin/courses" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Shared Protected Routes */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onClearAll={clearNotifications}
            />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
