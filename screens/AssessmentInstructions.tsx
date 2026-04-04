import React from 'react';
import { useApp } from '../store/AppContext';

interface Props {
  onStart: () => void;
  onBack: () => void;
}

const AssessmentInstructions: React.FC<Props> = ({ onStart, onBack }) => {
  const { currentAssessment, isDemoMode } = useApp();
  const [secureStartError, setSecureStartError] = React.useState('');

  const title = currentAssessment?.title || 'Assessment';
  const courseLine = [currentAssessment?.courseCode, currentAssessment?.courseName, currentAssessment?.professorName]
    .filter(Boolean)
    .join(' • ') || 'University Coding Assessment';
  const duration = currentAssessment?.duration || 90;
  const questions = currentAssessment?.questions?.length || 0;
  const passingScore = currentAssessment?.passingScore || 70;
  const secureMode = isDemoMode || !!currentAssessment?.settings?.proctoring;

  const handleEnterAssessment = async () => {
    if (secureMode && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.warn('Fullscreen request blocked:', error);
      }
    }

    if (secureMode && !document.fullscreenElement) {
      setSecureStartError('Fullscreen permission is required to start this secure assessment.');
      return;
    }

    setSecureStartError('');

    if (secureMode && document.fullscreenElement) {
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    onStart();
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center py-10 px-4">
      <div className="max-w-4xl w-full flex flex-col gap-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Instructions & System Check</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{title} • {courseLine}</p>
          </div>
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'schedule', label: 'Duration', value: `${duration} Minutes` },
            { icon: 'quiz', label: 'Questions', value: `${questions} Total` },
            { icon: 'check_circle', label: 'Passing Score', value: `${passingScore}%` },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-primary mb-2">
                <span className="material-symbols-outlined">{stat.icon}</span>
                <span className="text-sm font-bold uppercase">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {secureMode && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-300">verified_user</span>
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-200">Secure Demo Mode Enabled</p>
                <p className="text-sm text-amber-700/90 dark:text-amber-100 mt-1">
                  Fullscreen is required during this attempt. Tab switches, focus loss, copy/paste, and context menu actions are monitored for the demo walkthrough.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">gavel</span>
              Assessment Rules
            </h3>
            <div className="space-y-4">
              <details className="group bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-lg p-4 open:pb-6 cursor-pointer" open>
                <summary className="flex justify-between items-center font-medium list-none">
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">policy</span>
                    Academic Integrity Policy
                  </span>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 ml-9">
                  Students must remain in the assessment window. External help and unauthorized collaboration are not permitted. Submissions are logged and reviewed.
                </p>
              </details>
              <details className="group bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-lg p-4 cursor-pointer">
                <summary className="flex justify-between items-center font-medium list-none">
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">timer</span>
                    Time Management Tips
                  </span>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 ml-9">
                  Allocate time per problem and move forward if blocked. Use Run before Submit to validate against visible tests.
                </p>
              </details>
            </div>
          </div>

          {/* System Check */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">fact_check</span>
              System Check
            </h3>
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-6">
              {/* Webcam */}
              <div className="flex gap-4">
                <div className="relative w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">videocam</span>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-background-card rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold">Webcam Access</p>
                  <p className="text-xs text-emerald-500">Ready & Connected</p>
                  <div className="mt-2 h-16 bg-black/10 dark:bg-black/50 rounded flex items-center justify-center border border-dashed border-slate-400">
                    <span className="text-xs text-slate-500 flex flex-col items-center">
                      <span className="material-symbols-outlined">face</span> Preview
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
              {/* Network */}
              <div className="flex gap-4">
                <div className="relative w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">wifi</span>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-background-card rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-bold">Network Stability</p>
                    <span className="text-xs text-emerald-500 font-bold">Strong</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                    <div className="bg-emerald-500 h-1.5 rounded-full w-[85%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={onBack} className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </button>
          <button onClick={handleEnterAssessment} className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-2">
            Enter Assessment
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
        {secureStartError && (
          <p className="text-sm text-amber-700 text-center -mt-2">{secureStartError}</p>
        )}
      </div>
    </div>
  );
};

export default AssessmentInstructions;
