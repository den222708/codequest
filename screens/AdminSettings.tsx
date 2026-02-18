import React from 'react';

const AdminSettings: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight">System Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage university-wide configurations and preferences.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-lg bg-white dark:bg-background-card border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">Discard</button>
            <button className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md">Save Changes</button>
          </div>
        </div>

        {/* General Config */}
        <section className="bg-white dark:bg-background-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">tune</span> General Configuration</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-20 h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-slate-300">school</span></div>
              <div className="flex-1">
                <p className="font-semibold mb-1">University Logo</p>
                <p className="text-sm text-slate-500 mb-3">Upload a PNG or JPG to replace branding (Max 2MB).</p>
                <div className="flex gap-3">
                  <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded hover:bg-primary/20">Upload New</button>
                  <button className="text-xs font-medium text-red-500 hover:text-red-600">Remove</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">University Name</label>
                    <input type="text" className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 py-2.5 px-4" defaultValue="Tech State University"/>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Support Email</label>
                    <input type="email" className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 py-2.5 px-4" defaultValue="support@techstate.edu"/>
                </div>
            </div>
          </div>
        </section>

        {/* Authentication */}
        <section className="bg-white dark:bg-background-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">security</span> Authentication</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">SSO Provider</label>
                    <select className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 py-2.5 px-4">
                        <option>Google Workspace</option>
                        <option>Microsoft Azure AD</option>
                        <option>Okta / SAML</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">LDAP Server URL</label>
                    <input type="text" className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 py-2.5 px-4" placeholder="ldap://server.university.edu"/>
                </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <div>
                    <p className="font-semibold text-sm">Allow Guest Access</p>
                    <p className="text-xs text-slate-500">Enable read-only access for public courses.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white dark:bg-background-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">shield_lock</span> Security</h2>
          </div>
          <div className="p-6 space-y-8">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium">Plagiarism Detection Sensitivity</label>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">High (Strict)</span>
                </div>
                <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary" min="1" max="100" defaultValue="75"/>
                <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                    <span>Lenient</span><span>Moderate</span><span>Strict</span>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium mb-2">Allowed IP Ranges (Exam Labs)</label>
                <textarea className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 py-2.5 px-4 font-mono text-sm" rows={3} placeholder="192.168.1.0/24, 10.0.0.5"></textarea>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;