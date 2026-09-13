import React from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Layers, 
  Bug, 
  Clock, 
  Hammer, 
  Database, 
  Server, 
  Search, 
  AlertTriangle, 
  Lightbulb, 
  Star, 
  History, 
  CheckSquare, 
  Terminal, 
  BookOpen, 
  FileSpreadsheet,
  FileCode2,
  GitCompare,
  FileJson,
  GraduationCap,
  Sparkles,
  X 
} from 'lucide-react';
import { QueryCategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { ALL_QUERIES } from '../data/queriesIndex';

interface SidebarProps {
  currentView: string;
  selectedCategory?: QueryCategory;
  onSelectView: (view: string, category?: QueryCategory) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  favoritesCount: number;
  onOpenBugReport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedCategory,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  favoritesCount,
  onOpenBugReport,
}) => {
  // Map category icons to Lucide components
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Layers': return <Layers className="w-4 h-4 text-emerald-600 dark:text-sky-400" />;
      case 'Bug': return <Bug className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Clock': return <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'Hammer': return <Hammer className="w-4 h-4 text-emerald-700 dark:text-cyan-400" />;
      case 'Database': return <Database className="w-4 h-4 text-emerald-600 dark:text-blue-400" />;
      case 'Server': return <Server className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'Search': return <Search className="w-4 h-4 text-emerald-700 dark:text-indigo-400" />;
      case 'AlertTriangle': return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-rose-400" />;
      case 'Lightbulb': return <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-yellow-400" />;
      default: return <Database className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryCount = (categoryName: QueryCategory) => {
    return ALL_QUERIES.filter(q => q.category === categoryName).length;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#0d101a] border-r border-emerald-100 dark:border-sql-border flex flex-col shadow-xs dark:shadow-none transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header (Mobile close button) */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-100 dark:border-sql-border lg:hidden">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Navigation</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Views */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectView('dashboard');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-sky-400" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* DB Guidelines Official Document */}
            <button
              onClick={() => {
                onSelectView('guidelines');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'guidelines'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50/60 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className={`w-4 h-4 ${currentView === 'guidelines' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>DB Guidelines</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                currentView === 'guidelines'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
              }`}>
                Official
              </span>
            </button>

            <button
              onClick={() => {
                onSelectView('browse');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'browse' && !selectedCategory
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Search className="w-4 h-4 text-emerald-600 dark:text-indigo-400" />
                <span>All Queries</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
                {ALL_QUERIES.length}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectView('favorites');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'favorites'
                  ? 'bg-amber-50 text-slate-900 border border-amber-300 shadow-xs dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>My Favorites</span>
              </div>
              {favoritesCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-white bg-amber-600 dark:text-amber-300 dark:bg-amber-400/20 px-1.5 py-0.5 rounded shadow-xs">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectView('recent');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'recent'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <History className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                <span>Recently Viewed</span>
              </div>
            </button>
          </div>

          {/* Categories Section */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Query Categories
            </div>
            {CATEGORIES.map((cat) => {
              const isSelected = currentView === 'category' && selectedCategory === cat.id;
              const count = getCategoryCount(cat.id);

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectView('category', cat.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {getCategoryIcon(cat.icon)}
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-2">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Developer Tools Section */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Developer Tools
            </div>

            <button
              onClick={() => {
                onSelectView('boilerplate-sp');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'boilerplate-sp'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileCode2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Boilerplate SPs</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                PROCS
              </span>
            </button>

            <button
              onClick={() => {
                onSelectView('sql-compare');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'sql-compare'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <GitCompare className="w-4 h-4 text-emerald-600 dark:text-sky-400" />
              <span>SQL Code Compare</span>
            </button>

            <button
              onClick={() => {
                onSelectView('json-formatter');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'json-formatter'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <FileJson className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
              <span>JSON Formatter & OPENJSON</span>
            </button>

            <button
              onClick={() => {
                onSelectView('playground');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'playground'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-cyan-400" />
              <span>SQL Playground</span>
            </button>
          </div>

          {/* Team Knowledge */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Team Knowledge
            </div>

            <button
              onClick={() => {
                onSelectView('meter-journey');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'meter-journey' || currentView === 'kt'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>⚡ Meter Journey in MDMS</span>
            </button>

            <button
              onClick={() => {
                onSelectView('knowledge');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'knowledge' || currentView === 'sql-knowledge'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>SQL Knowledge & Internals</span>
            </button>

            <button
              onClick={() => {
                onSelectView('tips');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'tips'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
              <span>SQL Tips & Anti-Patterns</span>
            </button>

            <button
              onClick={() => {
                onSelectView('standards');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'standards'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Team SQL Standards</span>
            </button>

            <button
              onClick={() => {
                onSelectView('checklist');
                onCloseMobile();
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'checklist'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Review Checklist</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-emerald-100 dark:border-sql-border text-xs text-slate-500 dark:text-slate-400 space-y-2 bg-slate-50/60 dark:bg-transparent">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Company Enterprise</span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">All Teams</span>
          </div>

          {onOpenBugReport && (
            <button
              onClick={onOpenBugReport}
              className="w-full flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-sql-border/40 text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group text-left"
              title="Report bug / Developer Info: Mubasshir Khan"
            >
              <div className="flex items-center space-x-1.5">
                <Bug className="w-3.5 h-3.5 text-amber-500 group-hover:text-emerald-600 transition-colors" />
                <span>Bug Report:</span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:underline">Mubasshir Khan</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

