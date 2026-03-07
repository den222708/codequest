import React from 'react';

const UNIVERSITY_NAME = 'Bennett University';
const UNIVERSITY_LOGO = 'https://student.bennetterp.camu.in/camu_attachment/get/666d4c4231e3c27c3977cb3b';

const AdminSettings: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">University branding and platform information.</p>
        </div>

        {/* Branding */}
        <section className="bg-white dark:bg-background-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">school</span> University Branding
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <img
                src={UNIVERSITY_LOGO}
                alt={UNIVERSITY_NAME}
                className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 object-contain bg-white"
              />
              <div>
                <p className="text-2xl font-bold">{UNIVERSITY_NAME}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">CodeQuest Assessment Platform</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;