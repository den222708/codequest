import React, { useState, useMemo } from 'react';
import { LeaderboardEntry } from '../types';
import { formatDuration, getInitials } from '../utils/formatters';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  timeRange?: 'week' | 'month' | 'semester' | 'all';
  onTimeRangeChange?: (range: 'week' | 'month' | 'semester' | 'all') => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  currentUserId,
  timeRange: timeRangeProp,
  onTimeRangeChange,
}) => {
  const [localTimeRange, setLocalTimeRange] = useState<'week' | 'month' | 'semester' | 'all'>(timeRangeProp || 'month');
  const timeRange = timeRangeProp ?? localTimeRange;
  const handleTimeRangeChange = (range: 'week' | 'month' | 'semester' | 'all') => {
    setLocalTimeRange(range);
    onTimeRangeChange?.(range);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [view, setView] = useState<'table' | 'cards'>('table');

  const departments = useMemo(() => {
    const depts = new Set(entries.map(e => e.department));
    return ['all', ...Array.from(depts)];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (searchQuery) {
      result = result.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      result = result.filter(e => e.department === departmentFilter);
    }

    return result;
  }, [entries, searchQuery, departmentFilter]);

  const currentUserEntry = useMemo(() => {
    return entries.find(e => e.id === currentUserId);
  }, [entries, currentUserId]);

  const topThree = filteredEntries.slice(0, 3);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-amber-500';
      case 2: return 'bg-slate-400';
      case 3: return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 2: return 'bg-slate-50 dark:bg-slate-400/10 border-slate-200 dark:border-slate-400/20';
      case 3: return 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';
      default: return 'bg-white dark:bg-background-card border-slate-200 dark:border-slate-800';
    }
  };

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return <span className="material-symbols-outlined text-4xl text-amber-500">military_tech</span>;
      case 2: return <span className="material-symbols-outlined text-4xl text-slate-400">military_tech</span>;
      case 3: return <span className="material-symbols-outlined text-4xl text-orange-500">military_tech</span>;
      default: return null;
    }
  };

  const formatTime = formatDuration;

  const badgeIconMap: Record<string, string> = {
    top_scorer: 'star',
    fast_solver: 'bolt',
    streak_master: 'local_fire_department',
    problem_crusher: 'fitness_center',
    consistent: 'trending_up',
    early_bird: 'wb_sunny',
  };

  const BadgeDisplay: React.FC<{ badges: string[] }> = ({ badges }) => (
    <div className="flex gap-1">
      {badges.slice(0, 3).map((badge, i) => (
        <span key={i} className="material-symbols-outlined text-lg text-primary" title={badge}>
          {badgeIconMap[badge] || 'emoji_events'}
        </span>
      ))}
      {badges.length > 3 && (
        <span className="text-slate-400 text-xs">+{badges.length - 3}</span>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Top performers across all assessments</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'semester', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeChange(range)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${timeRange === range
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-background-card text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
            >
              {range === 'all' ? 'All Time' : `This ${range}`}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Position (if logged in) */}
      {currentUserEntry && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-primary">#{currentUserEntry.rank}</div>
              <div>
                <h3 className="font-medium">Your Position</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {currentUserEntry.totalScore} points • {currentUserEntry.problemsSolved} problems solved
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-primary font-medium">
                {currentUserEntry.streak > 0 && (
                  <span><span className="material-symbols-outlined text-sm align-middle">local_fire_department</span> {currentUserEntry.streak} day streak</span>
                )}
              </div>
              <BadgeDisplay badges={currentUserEntry.badges} />
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="flex justify-center gap-4 py-8">
        {/* 2nd Place */}
        {topThree[1] && (
          <div className="flex flex-col items-center mt-8">
            <div className={`w-20 h-20 rounded-full ${getRankColor(2)} flex items-center justify-center text-3xl font-bold text-white`}>
              {topThree[1].avatar || topThree[1].name.charAt(0)}
            </div>
            <div className="text-4xl mt-2">{getMedal(2)}</div>
            <h3 className="font-medium mt-2 text-center">{topThree[1].name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{topThree[1].totalScore} pts</p>
            <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-t-lg mt-2 flex items-end justify-center pb-2">
              <span className="text-2xl font-bold text-slate-400">2</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full ${getRankColor(1)} flex items-center justify-center text-4xl font-bold text-white ring-4 ring-amber-200 dark:ring-amber-400/30`}>
                {topThree[0].avatar || topThree[0].name.charAt(0)}
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="material-symbols-outlined text-3xl text-amber-400">workspace_premium</span>
              </div>
            </div>
            <div className="text-4xl mt-2">{getMedal(1)}</div>
            <h3 className="font-medium mt-2 text-center">{topThree[0].name}</h3>
            <p className="text-amber-500 font-semibold">{topThree[0].totalScore} pts</p>
            <div className="h-32 w-28 bg-amber-50 dark:bg-amber-500/10 rounded-t-lg mt-2 flex items-end justify-center pb-2">
              <span className="text-3xl font-bold text-amber-500">1</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div className="flex flex-col items-center mt-12">
            <div className={`w-[4.5rem] h-[4.5rem] rounded-full ${getRankColor(3)} flex items-center justify-center text-2xl font-bold text-white`}>
              {topThree[2].avatar || topThree[2].name.charAt(0)}
            </div>
            <div className="text-4xl mt-2">{getMedal(3)}</div>
            <h3 className="font-medium mt-2 text-center">{topThree[2].name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{topThree[2].totalScore} pts</p>
            <div className="h-20 w-24 bg-orange-50 dark:bg-orange-500/10 rounded-t-lg mt-2 flex items-end justify-center pb-2">
              <span className="text-2xl font-bold text-orange-500">3</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('table')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${view === 'table'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
            >
              <span className="material-symbols-outlined text-lg">table_rows</span>
              Table
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${view === 'cards'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      {view === 'table' ? (
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm font-medium border-b border-slate-200 dark:border-slate-700">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-3">Student</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-1 text-center">Solved</div>
            <div className="col-span-2 text-center">Avg Time</div>
            <div className="col-span-2">Badges</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredEntries.slice(3).map((entry) => (
              <div
                key={entry.id}
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${entry.id === currentUserId
                    ? 'bg-primary/5 border-l-4 border-primary'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                <div className="col-span-1 text-center">
                  <span className={`text-lg font-bold ${entry.rank <= 10 ? 'text-primary' : 'text-slate-400'
                    }`}>
                    #{entry.rank}
                  </span>
                </div>
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center text-white font-medium">
                    {entry.avatar || entry.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{entry.name}</div>
                    {entry.streak > 0 && (
                      <div className="text-xs text-amber-500"><span className="material-symbols-outlined text-xs align-middle">local_fire_department</span> {entry.streak} day streak</div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-slate-500 dark:text-slate-400 text-sm">{entry.department}</div>
                <div className="col-span-1 text-center">
                  <span className="font-semibold">{entry.totalScore}</span>
                </div>
                <div className="col-span-1 text-center text-slate-500 dark:text-slate-400">{entry.problemsSolved}</div>
                <div className="col-span-2 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {formatTime(entry.averageTime)}
                </div>
                <div className="col-span-2">
                  <BadgeDisplay badges={entry.badges} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.slice(3).map((entry) => (
            <div
              key={entry.id}
              className={`rounded-xl p-4 border transition-all hover:shadow-md ${entry.id === currentUserId
                  ? 'bg-primary/5 border-primary/50'
                  : getRankBg(entry.rank)
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${getRankColor(entry.rank)} flex items-center justify-center text-white font-bold`}>
                    {entry.avatar || entry.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium">{entry.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{entry.department}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-400">#{entry.rank}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                  <div className="font-bold">{entry.totalScore}</div>
                  <div className="text-slate-500 text-xs">Points</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                  <div className="font-bold">{entry.problemsSolved}</div>
                  <div className="text-slate-500 text-xs">Solved</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                  <div className="font-bold">{entry.streak}</div>
                  <div className="text-slate-500 text-xs">Streak</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <BadgeDisplay badges={entry.badges} />
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  Avg: {formatTime(entry.averageTime)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
