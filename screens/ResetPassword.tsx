import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import { validatePassword, isPasswordValid } from '../utils/formatters';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Supabase sends recovery tokens in the URL hash:
    // /reset-password#access_token=xxx&type=recovery&refresh_token=yyy
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      setToken(accessToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid(password)) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Invalid or expired reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        access_token: token,
        new_password: password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">code_blocks</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CodeQuest</span>
        </div>

        <div className="bg-white dark:bg-background-card rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {!success ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-primary">password</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Set New Password</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Choose a strong password for your account.
                </p>
              </div>

              {!token && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  Invalid or expired reset link. Please request a new one from the login page.
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    New Password
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
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {password && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { check: validatePassword(password).length, label: '8+ characters' },
                        { check: validatePassword(password).uppercase, label: 'Uppercase letter' },
                        { check: validatePassword(password).number, label: 'Number' },
                        { check: validatePassword(password).special, label: 'Special character' },
                      ].map((req, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-xs ${req.check ? 'text-green-500' : 'text-slate-400'}`}>
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">
                            {req.check ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          {req.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-xl">lock</span>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <span className="material-symbols-outlined text-xl">check</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Password Reset!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-xl">login</span>
                Sign In
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
