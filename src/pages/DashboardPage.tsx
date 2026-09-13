import React from 'react';
import { 
  Zap, 
  Activity, 
  Layers, 
  Bug, 
  Clock, 
  Hammer, 
  Search, 
  TrendingUp, 
  Lightbulb, 
  Users, 
  BookOpen, 
  FolderTree, 
  Sparkles,
  ArrowRight,
  Database,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { QuerySnippet } from '../types';
import { QueryCard } from '../components/QueryCard';
import { getFeaturedQueries, getQueryById, ALL_QUERIES } from '../data/queriesIndex';
import { RecentItem } from '../hooks/useRecentlyViewed';
import { formatRelativeTime } from '../utils/dateUtils';

interface DashboardPageProps {
  onSelectQuery: (query: QuerySnippet) => void;
  onSelectCategory: (category: string) => void;
  onNavigate: (view: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  recentItems: RecentItem[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectQuery,
  onSelectCategory,
  onNavigate,
  favorites,
  onToggleFavorite,
  recentItems,
}) => {
  const featuredQueries = getFeaturedQueries().slice(0, 6);

  // Quick Action cards definition
  const quickActions = [
    { id: 'guidelines', title: '📋 DB Guidelines', icon: '📋', desc: '17 SP rules, table naming & deploy', isView: true },
    { id: 'meter-journey', title: '⚡ Meter Journey (3D KT)', icon: '⚡', desc: 'Step-by-step 3D walkthrough of MDMS', isView: true },
    { id: 'knowledge', title: '🎓 SQL Knowledge', icon: '🎓', desc: 'Running, Suspended, Waits & Internals', isView: true },
    { id: 'boilerplate-sp', title: '📜 Boilerplate SPs', icon: '📜', desc: 'Report & Import SPs with error logging', isView: true },
    { id: 'sql-compare', title: '⚖️ SQL Compare', icon: '⚖️', desc: 'Side-by-side script diff & regression', isView: true },
    { id: 'json-formatter', title: '🔧 JSON Formatter', icon: '🔧', desc: 'Beautify, validate & OPENJSON query', isView: true },
    { id: 'active-queries', title: 'Active Queries', icon: '🔥', desc: 'Currently executing requests & DMVs', category: 'Performance' },
    { id: 'database-sizes-and-free-space', title: 'Database Health', icon: '❤️', desc: 'File sizes, free space & VLFs', category: 'Database' },
    { id: 'blocking-sessions', title: 'Blocking / Deadlocks', icon: '⚡', desc: 'Lock wait trees & root blockers', category: 'Performance' },
    { id: 'index-fragmentation', title: 'Index Fragmentation', icon: '📊', desc: 'Physical stats, rebuild vs reorganize', category: 'Performance' },
    { id: 'partition-information', title: 'Partition Toolkit', icon: '🧩', desc: 'Boundaries, filegroups, identities', category: 'Partitioning' },
    { id: 'create-table-complete', title: 'Create Table', icon: '🏗️', desc: 'Named constraints & team standards', category: 'Tables & Schema' },
    { id: 'alter-table-add-column-safe', title: 'Alter Table', icon: '🔧', desc: 'Safe idempotent column & constraint DDL', category: 'Tables & Schema' },
    { id: 'find-procedure-by-text', title: 'Debug Stored Proc', icon: '🐞', desc: 'Search modules, parameters & errors', category: 'Stored Procedures' },
    { id: 'find-agent-job-by-step-name', title: 'SQL Agent Jobs', icon: '⏱️', desc: 'Search jobs by procedure & history', category: 'SQL Server Agent' },
    { id: 'find-tables-with-column', title: 'Find Object / Col', icon: '🔎', desc: 'Locate columns across all schemas', category: 'Developer Utilities' },
    { id: 'generate-data-insert-script', title: 'Data INSERT Gen', icon: '📝', desc: 'Copy master data (<1000 rows)', category: 'Developer Utilities' },
    { id: 'tips', title: 'SQL Tips', icon: '💡', desc: 'SARGability, NOLOCK & anti-patterns', isView: true },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.isView) {
      onNavigate(action.id);
      return;
    }
    const query = getQueryById(action.id);
    if (query) {
      onSelectQuery(query);
    } else if (action.category) {
      onSelectCategory(action.category);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Official DB Guidelines Document Banner */}
      <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-[#0c1410] dark:to-emerald-950/20 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[11px] font-bold tracking-wide uppercase border border-emerald-200 dark:border-transparent">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Official Team Master Reference</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Team DB Guidelines & Standards Document
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Directly loaded from our master Excel document: 17 Stored Procedure rules (standard header, <code>t_job_error</code> logging, <code>(NOLOCK)</code>), Table Nomenclature (<code>M_</code>, <code>L_</code>, <code>T_</code>, <code>S_</code>, <code>R_</code>), Standard Table Aliases Directory, Annual Partition Archival runbook, and New DB Deploy sync scripts.
          </p>
        </div>

        <button
          onClick={() => onNavigate('guidelines')}
          className="shrink-0 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:scale-[1.02] transition-all"
        >
          <span>Open Guidelines</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hero / Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-sql-border bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-[#14192b] dark:to-[#0d101a] p-8 sm:p-10 shadow-sm dark:shadow-2xl transition-colors">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-teal-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-sky-500/10 border border-emerald-200 dark:border-sky-500/20 text-emerald-800 dark:text-sky-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Central SQL Server Knowledge Hub</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            T-SQL Developer Toolkit
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Centralized SQL engineering hub built for everyone across Company (DBAs, Developers, Analysts, QA, and Operations). Find production-tested queries, compare SQL scripts, generate standard SP boilerplates, and format smart meter payloads in seconds.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="rounded-xl border border-emerald-100 dark:border-sql-border/80 bg-white/80 dark:bg-[#0c0f18]/80 p-3.5 shadow-xs">
              <div className="text-2xl font-black text-emerald-700 dark:text-sky-400 font-mono">
                {ALL_QUERIES.length}+
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">SQL Snippets</div>
            </div>

            <div className="rounded-xl border border-emerald-100 dark:border-sql-border/80 bg-white/80 dark:bg-[#0c0f18]/80 p-3.5 shadow-xs">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                All Teams
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Company-Wide</div>
            </div>

            <div className="rounded-xl border border-emerald-100 dark:border-sql-border/80 bg-white/80 dark:bg-[#0c0f18]/80 p-3.5 shadow-xs">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">10</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Categories</div>
            </div>

            <div className="rounded-xl border border-emerald-100 dark:border-sql-border/80 bg-white/80 dark:bg-[#0c0f18]/80 p-3.5 shadow-xs">
              <div className="text-2xl font-black text-emerald-700 dark:text-amber-400 font-mono">35+</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Developer Tips</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid (Section 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick Actions & Commands</h3>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Instant Jump</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAction(action)}
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 hover:bg-emerald-50/50 dark:hover:bg-sql-cardHover hover:border-emerald-300 dark:hover:border-sky-500/40 text-left transition-all group shadow-xs hover:shadow-md"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-sky-300 transition-colors">
                {action.title}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {action.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Two Column Layout: Featured Queries & Recently Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Frequently Used Production Queries */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-sky-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Frequently Used Queries</h3>
            </div>
            <button
              onClick={() => onNavigate('browse')}
              className="text-xs font-semibold text-emerald-700 dark:text-sky-400 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>View All ({ALL_QUERIES.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredQueries.map((query) => (
              <QueryCard
                key={query.id}
                query={query}
                isFavorite={favorites.includes(query.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectQuery}
              />
            ))}
          </div>
        </section>

        {/* Right 1 Col: Recently Viewed & Shortcuts */}
        <section className="space-y-6">
          {/* Recently Viewed Panel */}
          <div className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/50 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-sql-border/60 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400">
                <History className="w-4 h-4" />
                <span>Recently Viewed</span>
              </div>
              <button
                onClick={() => onNavigate('recent')}
                className="text-[11px] text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
              >
                View all
              </button>
            </div>

            {recentItems.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No recently viewed queries yet. Open any snippet to track it here.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-sql-border/40">
                {recentItems.slice(0, 5).map((item) => {
                  const query = getQueryById(item.id);
                  if (!query) return null;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectQuery(query)}
                      className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                    >
                      <div className="overflow-hidden pr-2">
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-sky-300 transition-colors truncate block">
                          {query.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {query.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Team Standards Callout */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/20 p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Team Coding Standards</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-emerald-200/80 leading-relaxed">
              Always follow the official <strong>DB Guidelines Document</strong>: 2-part object names (<code>dbo.Table</code>), standard nomenclature (<code>M_</code>, <code>L_</code>, <code>T_</code>, <code>S_</code>, <code>R_</code>), standard table aliases (<code>LNL1</code>, <code>LNML</code>), and log errors with <code>t_job_error</code>.
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <button
                onClick={() => onNavigate('guidelines')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 inline-flex items-center space-x-1"
              >
                <span>DB Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <button
                onClick={() => onNavigate('standards')}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700"
              >
                <span>More Rules</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
