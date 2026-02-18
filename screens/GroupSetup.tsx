import React from 'react';

interface Props {
  onBack: () => void;
}

const GroupSetup: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-background-card shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Setup: Graph Theory Final</h1>
          <p className="text-slate-500">Configure collaboration rules and teams.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Save Draft</button>
          <button className="px-6 py-2 bg-primary text-white font-bold rounded-lg flex items-center gap-2 shadow-sm"><span className="material-symbols-outlined text-lg">publish</span> Save & Publish</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Left Config */}
        <div className="w-1/3 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-white dark:bg-background-card rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">tune</span> Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Grouping Strategy</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 rounded-lg border border-primary bg-primary/5 cursor-pointer">
                    <input type="radio" name="strat" defaultChecked className="text-primary focus:ring-primary"/>
                    <div className="ml-3">
                      <span className="block text-sm font-bold">Manual Assignment</span>
                      <span className="block text-xs text-slate-500">Professor drags and drops.</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input type="radio" name="strat" className="text-primary focus:ring-primary"/>
                    <div className="ml-3">
                      <span className="block text-sm font-bold">Auto-Assign (Random)</span>
                      <span className="block text-xs text-slate-500">System distributes evenly.</span>
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Group Size</label>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs text-slate-500">Min</label><input type="number" defaultValue={3} className="w-full rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"/></div>
                  <div className="flex-1"><label className="text-xs text-slate-500">Max</label><input type="number" defaultValue={5} className="w-full rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"/></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Drag Drop Area */}
        <div className="flex-1 bg-white dark:bg-background-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <input type="text" placeholder="Search students..." className="rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-sm"/>
            <div className="flex gap-2">
              <button className="text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded"><span className="material-symbols-outlined text-sm">shuffle</span> Randomize</button>
              <button className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded shadow flex items-center gap-1"><span className="material-symbols-outlined text-sm">add</span> Add Group</button>
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* Unassigned */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121f22] p-4 overflow-y-auto">
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Unassigned (4)</h4>
              <div className="space-y-2">
                {['Sarah Jenkins', 'Marcus Chen', 'Priya Patel', 'David Kim'].map((name, i) => (
                  <div key={i} className="bg-white dark:bg-[#1e3236] p-3 rounded shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 cursor-grab hover:border-primary">
                    <span className="material-symbols-outlined text-slate-300">drag_indicator</span>
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">{name.charAt(0)}</div>
                    <div>
                      <span className="block text-sm font-bold">{name}</span>
                      <span className="block text-xs text-slate-500">ID: 88291{i}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Groups */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 gap-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#121f22] h-fit">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between bg-white dark:bg-[#1a2c30] rounded-t-xl">
                  <h4 className="font-bold text-sm">Group Alpha <span className="bg-green-100 text-green-700 text-[10px] px-1.5 rounded ml-2">FULL</span></h4>
                  <span className="text-xs font-mono">4/4</span>
                </div>
                <div className="p-3 space-y-2">
                  {['Jessica Lee', 'Mike Ross', 'Alex Smith', 'Kevin Tran'].map((n, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-white dark:bg-[#1e3236] border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{n.charAt(0)}</div><span className="text-xs font-medium">{n}</span></div>
                      <button className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">close</span></button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-2 border-dashed border-primary bg-primary/5 rounded-xl h-fit">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between bg-white dark:bg-[#1a2c30] rounded-t-lg">
                  <h4 className="font-bold text-sm">Group Beta</h4>
                  <span className="text-xs font-mono">2/4</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center p-2 rounded bg-white dark:bg-[#1e3236] border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">LM</div><span className="text-xs font-medium">Lisa Mondavi</span></div>
                      <button className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">close</span></button>
                  </div>
                  <div className="h-10 border border-dashed border-primary/40 rounded bg-primary/5 flex items-center justify-center text-xs text-primary font-medium">Drop here</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSetup;