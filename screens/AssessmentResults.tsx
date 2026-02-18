import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';

interface Props {
  onBack: () => void;
}

const AssessmentResults: React.FC<Props> = ({ onBack }) => {
  const { assessmentId } = useParams();
  const { assessments, submissions, attempts, currentUser } = useApp();

  const assessment = assessments.find(a => a.id === assessmentId);

  const userSubmissions = useMemo(() => {
    return submissions
      .filter(s => s.assessmentId === assessmentId && (!currentUser || s.studentId === currentUser.id))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [submissions, assessmentId, currentUser?.id]);

  const latestByQuestion = useMemo(() => {
    const map = new Map<string, typeof userSubmissions[number]>();
    for (const submission of userSubmissions) {
      if (!map.has(submission.questionId)) {
        map.set(submission.questionId, submission);
      }
    }
    return map;
  }, [userSubmissions]);

  const rows = (assessment?.questions || []).map((question, index) => {
    const submission = latestByQuestion.get(question.id);
    const score = submission?.score || 0;
    const maxScore = submission?.maxScore || question.points || 100;
    const status = submission?.status || 'pending';

    return {
      index: index + 1,
      title: question.title,
      status,
      score,
      maxScore,
      language: submission?.language,
      submittedAt: submission?.submittedAt,
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.score += row.score;
      acc.maxScore += row.maxScore;
      return acc;
    },
    { score: 0, maxScore: 0 },
  );

  const percentage = totals.maxScore > 0 ? Math.round((totals.score / totals.maxScore) * 100) : 0;

  const latestAttempt = attempts
    .filter(a => a.assessmentId === assessmentId && (!currentUser || a.studentId === currentUser.id))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

  const submittedAt = latestAttempt?.submittedAt || userSubmissions[0]?.submittedAt;
  const timeSpentSeconds = latestAttempt?.timeSpent || 0;
  const timeSpentLabel = timeSpentSeconds
    ? `${Math.floor(timeSpentSeconds / 60)}m ${timeSpentSeconds % 60}s`
    : '-';

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 md:p-10 flex flex-col items-center">
      <div className="max-w-5xl w-full">
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-2">
              <span className="material-symbols-outlined text-sm">check_circle</span> SUBMITTED
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Assessment Completed</h1>
            <p className="text-slate-500">{assessment?.title || 'Assessment'}{assessment?.courseCode ? ` (${assessment.courseCode})` : ''}</p>
          </div>
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span> Back to Assessments
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Final Score</h3>
            <div className="relative w-40 h-40 flex items-center justify-center mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" strokeWidth="3"/>
              </svg>
              <span className="absolute text-4xl font-black">{percentage}%</span>
            </div>
            <p className="text-2xl font-bold mb-1">{totals.score} / {totals.maxScore}</p>
            <p className={`font-bold text-sm ${percentage >= (assessment?.passingScore || 60) ? 'text-emerald-500' : 'text-amber-500'}`}>
              {percentage >= (assessment?.passingScore || 60) ? 'Great job! You passed.' : 'Keep going! Try improving weak areas.'}
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><span className="material-symbols-outlined">timer</span></div>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Limit: {assessment?.duration || 0}m</span>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Time Spent</p>
                <p className="text-3xl font-bold">{timeSpentLabel}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><span className="material-symbols-outlined">calendar_today</span></div>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Submitted On</p>
                <p className="text-xl font-bold">{submittedAt ? new Date(submittedAt).toLocaleDateString() : '-'}</p>
                <p className="text-sm text-slate-400">{submittedAt ? new Date(submittedAt).toLocaleTimeString() : ''}</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-lg font-bold">Overall Performance</p>
                  <p className="text-slate-500 text-sm">{rows.filter(r => r.status === 'passed').length} of {rows.length} problems passed.</p>
                </div>
                <span className="text-xl font-bold text-primary">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full">
                <div className="bg-primary h-3 rounded-full" style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-4">Problem Breakdown</h3>
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="p-4 w-16">#</th>
                <th className="p-4">Problem Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score</th>
                <th className="p-4">Language</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-slate-500">{row.index}</td>
                  <td className="p-4 font-bold">{row.title}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                      row.status === 'passed'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : row.status === 'partial'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{row.status === 'passed' ? 'check_circle' : row.status === 'partial' ? 'warning' : 'cancel'}</span>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{row.score}/{row.maxScore}</td>
                  <td className="p-4 text-slate-500 capitalize">{row.language || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;
