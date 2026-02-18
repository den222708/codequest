import React from 'react';

interface Props {
  onBack: () => void;
}

const PlagiarismReport: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-card px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-primary"><span className="material-symbols-outlined">arrow_back</span></button>
          <div>
            <h2 className="text-lg font-bold">Plagiarism Analysis Report</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Arjun Sharma</span>
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span>Data Structures Final</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Similarity Score</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">warning</span> 85% High Risk
              </span>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined">download</span> Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#101f22]">
          {/* Header for Code View */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-card flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
            <div className="flex-1 px-4 border-r border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-gray-400">person</span> Arjun's Submission (Source A)</span>
            </div>
            <div className="flex-1 px-4">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">school</span> Matched: Priya Patel (Source B)</span>
            </div>
          </div>

          {/* Diff View */}
          <div className="flex-1 flex overflow-hidden font-mono text-sm leading-6">
            {/* Left Pane */}
            <div className="flex-1 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-card p-4">
                <div className="text-gray-400">1 package com.sorting.algos;</div>
                <div className="text-gray-400">2 </div>
                <div className="text-gray-800 dark:text-gray-200">3 public class QuickSort {'{'}</div>
                <div className="text-gray-800 dark:text-gray-200">4     /* This function takes last element as pivot */</div>
                <div className="text-gray-800 dark:text-gray-200">5     int partition(int arr[], int low, int high) {'{'}</div>
                {/* Highlighted Match */}
                <div className="bg-red-50 dark:bg-red-900/20 -mx-4 px-4 border-l-4 border-red-500 my-1">
                    <div className="text-gray-900 dark:text-gray-100 font-bold">20        // swap arr[i+1] and arr[high] (or pivot)</div>
                    <div className="text-gray-900 dark:text-gray-100 font-bold">21        int temp = arr[i+1];</div>
                    <div className="text-gray-900 dark:text-gray-100 font-bold">22        arr[i+1] = arr[high];</div>
                    <div className="text-gray-900 dark:text-gray-100 font-bold">23        arr[high] = temp;</div>
                </div>
                <div className="text-gray-800 dark:text-gray-200">24 </div>
                <div className="text-gray-800 dark:text-gray-200">25        return i + 1;</div>
                <div className="text-gray-800 dark:text-gray-200">26    {'}'}</div>
            </div>
            {/* Right Pane */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#1a2c30] p-4">
                <div className="text-gray-400">1 package com.utils.sort;</div>
                <div className="text-gray-400">2 </div>
                <div className="text-gray-800 dark:text-gray-200">3 public class Sorter {'{'}</div>
                <div className="text-gray-800 dark:text-gray-200">4     /* Helper for partitioning the array */</div>
                <div className="text-gray-800 dark:text-gray-200">5     private int part(int a[], int l, int h) {'{'}</div>
                {/* Highlighted Match */}
                <div className="bg-red-50 dark:bg-red-900/20 -mx-4 px-4 border-l-4 border-red-500 my-1">
                    <div className="text-gray-900 dark:text-gray-100 font-bold">20        // swap arr[idx+1] and arr[high]</div>
                    <div className="text-gray-900 dark:text-gray-100 font-bold">21        int tmp = a[idx+1];</div>
                    <div className="text-gray-900 dark:text-gray-100 font-bold">22        a[idx+1] = a[h];</div>
                    <div className="text-gray-900 dark:text-gray-100 font-bold">23        a[h] = tmp;</div>
                </div>
                <div className="text-gray-800 dark:text-gray-200">24 </div>
                <div className="text-gray-800 dark:text-gray-200">25        return idx + 1;</div>
                <div className="text-gray-800 dark:text-gray-200">26    {'}'}</div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-background-card">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">PM</div>
                    <div>
                        <h4 className="text-sm font-bold">Internal Notes</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1"><span className="font-semibold text-primary">Prof. Miller:</span> Note the identical logic error in the partitioning step. Even though variable names were changed, the flawed swap logic is exactly preserved.</p>
                    </div>
                </div>
            </div>
          </div>
        </main>

        {/* Sidebar Info */}
        <aside className="w-80 bg-white dark:bg-background-card border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-5 flex flex-col gap-6 shrink-0">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Match Details</h3>
                <div className="space-y-3">
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg relative overflow-hidden group cursor-pointer hover:bg-primary/10">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-bold">Priya Patel</p>
                            <span className="text-xs font-bold text-primary bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm">92%</span>
                        </div>
                        <p className="text-xs text-slate-500">Student Submission • ID: 2024045</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-background-card border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-medium">GeeksForGeeks</p>
                            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">45%</span>
                        </div>
                        <p className="text-xs text-slate-500">Public Web Source</p>
                    </div>
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Professor's Action</h3>
                <div className="flex flex-col gap-3">
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-background-card border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 font-semibold shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">gavel</span> Mark as Plagiarism
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark font-semibold shadow-md">
                        <span className="material-symbols-outlined text-[20px]">flag</span> Request Manual Review
                    </button>
                    <button className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium">Dismiss Flag</button>
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
};

export default PlagiarismReport;