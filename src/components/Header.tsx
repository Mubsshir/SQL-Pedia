import React from 'react';
import { Search, Star, Terminal, CheckSquare, HelpCircle, Menu, FileSpreadsheet, Sun, Moon, FileCode2, GitCompare, FileJson } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  onToggleSidebar?: () => void;
  favoritesCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenShortcuts,
  onNavigate,
  currentView,
  onToggleSidebar,
  favoritesCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-2.5 bg-white/95 dark:bg-[#0a0d14]/90 backdrop-blur-md border-b border-emerald-100 dark:border-sql-border shadow-xs dark:shadow-none transition-colors">
      {/* Brand & Mobile Menu */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Company Enterprise SQL Developer Toolkit"
        >
          <CompanyLogo size="md" showWordmark={true} />
        </div>
      </div>

      {/* Global Search Bar (Trigger for Ctrl+K modal) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-sql-border bg-slate-50 dark:bg-sql-surface/80 hover:bg-white dark:hover:bg-sql-card hover:border-emerald-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 text-xs transition-all shadow-inner group"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
              Search queries, procs, guidelines, partitions, DMVs...
            </span>
          </div>
          <kbd className="flex items-center space-x-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <span>Ctrl</span>
            <span>+</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Search queries"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* DB Guidelines Official Document */}
        <button
          onClick={() => onNavigate('guidelines')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'guidelines'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30'
          }`}
          title="Official DB Guidelines Document"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DB Guidelines</span>
        </button>

        {/* Boilerplate SPs Link */}
        <button
          onClick={() => onNavigate('boilerplate-sp')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'boilerplate-sp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30'
          }`}
          title="Standard Stored Procedure Boilerplates & Generator"
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Boilerplate SPs</span>
        </button>

        {/* Playground Link */}
        <button
          onClick={() => onNavigate('playground')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'playground'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800/80 border border-transparent'
          }`}
          title="Open client-side SQL playground & formatter"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Playground</span>
        </button>

        {/* Checklist Link */}
        <button
          onClick={() => onNavigate('checklist')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'checklist'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800/80 border border-transparent'
          }`}
          title="Pre-deployment SQL review checklist"
        >
          <CheckSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="hidden sm:inline">Checklist</span>
        </button>

        {/* Favorites Link */}
        <button
          onClick={() => onNavigate('favorites')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentView === 'favorites'
              ? 'bg-amber-50 text-slate-900 border border-amber-300 shadow-xs dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800/80 border border-transparent'
          }`}
          title="My Favorite Queries"
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="hidden sm:inline">Favorites</span>
          {favoritesCount > 0 && (
            <span className="text-[10px] bg-amber-500 text-white dark:bg-amber-400/20 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-mono font-bold shadow-xs">
              {favoritesCount}
            </span>
          )}
        </button>

        {/* Theme Toggle (Green & White / Dark Mode) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-transparent transition-colors"
          title={theme === 'light' ? "Switch to Emerald Dark mode" : "Switch to Green & White mode"}
          aria-label="Toggle color theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-emerald-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Keyboard Help */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

