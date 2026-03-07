import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser } = useApp();

  const from = (location.state as any)?.from?.pathname ||
    (currentUser?.role === 'student' ? '/student/dashboard' :
      currentUser?.role === 'professor' ? '/professor/dashboard' :
        currentUser?.role === 'admin' ? '/admin/dashboard' : '/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  useEffect(() => {
    if (currentUser) {
      const dashboardPath =
        currentUser.role === 'student' ? '/student/dashboard' :
          currentUser.role === 'professor' ? '/professor/dashboard' :
            '/admin/dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        const dashboardPath =
          currentUser?.role === 'student' ? '/student/dashboard' :
            currentUser?.role === 'professor' ? '/professor/dashboard' :
              '/admin/dashboard';
        navigate(dashboardPath, { replace: true });
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#0a4f5c]">
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">code_blocks</span>
              </div>
              <span className="text-2xl font-black tracking-tight">CodeQuest</span>
            </div>
            <p className="text-white/70 text-sm">University Coding Assessment Platform</p>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-black leading-tight mb-4">
                Master Your<br />
                <span className="text-white/90">Coding Skills</span>
              </h1>
              <p className="text-white/70 text-lg max-w-md">
                Practice problems, take assessments, and track your progress with real-time feedback.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: 'speed', text: 'Real-time code execution' },
                { icon: 'analytics', text: 'Detailed performance analytics' },
                { icon: 'school', text: 'University-wide leaderboards' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">{feature.icon}</span>
                  </div>
                  <span className="text-white/90">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/50 text-sm">© 2026 CodeQuest. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">code_blocks</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">CodeQuest</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="you@university.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-primary hover:text-primary-dark font-bold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
