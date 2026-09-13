import React, { useState, useEffect, useMemo } from 'react';
import { QuerySnippet, QueryCategory } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SearchModal } from './components/SearchModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { DashboardPage } from './pages/DashboardPage';
import { BrowsePage } from './pages/BrowsePage';
import { QueryDetailPage } from './pages/QueryDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RecentlyViewedPage } from './pages/RecentlyViewedPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { TipsPage } from './pages/TipsPage';
import { StandardsPage } from './pages/StandardsPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { BoilerplateSpPage } from './pages/BoilerplateSpPage';
import { SqlComparePage } from './pages/SqlComparePage';
import { JsonFormatterPage } from './pages/JsonFormatterPage';
import { SqlKnowledgePage } from './pages/SqlKnowledgePage';
import { MeterJourneyKtPage } from './pages/MeterJourneyKtPage';
import { BugReportModal } from './components/BugReportModal';
import { Bug } from 'lucide-react';
import { useFavorites } from './hooks/useFavorites';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';
import { useChecklist } from './hooks/useChecklist';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useHashRouter } from './hooks/useHashRouter';
import { getQueryById } from './data/queriesIndex';

export function App() {
  // Client-side URL Hash Router: enables deep-linking, back/forward history & refresh retention
  const { route, navigateQuery, navigateCategory, navigateView } = useHashRouter();

  const currentView = route.view;
  const selectedCategory = route.category;

  const activeQuery: QuerySnippet | null = useMemo(() => {
    if (route.view === 'query' && route.queryId) {
      return getQueryById(route.queryId) || null;
    }
    return null;
  }, [route.view, route.queryId]);

  // Theme state: defaults to 'light' (Green & White theme), with toggle to 'dark' (Emerald Dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tsql_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tsql_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Persistent storage hooks
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { recent, addRecent, clearRecent } = useRecentlyViewed();
  const { checkedIds, toggleItem, resetChecklist } = useChecklist();

  // Keyboard shortcut listener
  useKeyboardShortcuts({
    onOpenSearch: () => setIsSearchOpen(true),
    onCloseModal: () => {
      setIsSearchOpen(false);
      setIsShortcutsOpen(false);
    },
    onOpenShortcuts: () => setIsShortcutsOpen(true),
  });

  // Automatically record recently viewed queries when navigating
  useEffect(() => {
    if (activeQuery) {
      addRecent(activeQuery.id);
    }
  }, [activeQuery?.id]);

  // Smooth scroll to top on route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route.view, route.queryId, route.category]);

  const handleSelectQuery = (query: QuerySnippet) => {
    navigateQuery(query.id);
  };

  const handleSelectCategory = (categoryName: string) => {
    navigateCategory(categoryName);
  };

  const handleSelectView = (view: string, category?: QueryCategory) => {
    navigateView(view, category);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardPage
            onSelectQuery={handleSelectQuery}
            onSelectCategory={handleSelectCategory}
            onNavigate={handleSelectView}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            recentItems={recent}
          />
        );
      case 'browse':
        return (
          <BrowsePage
            onSelectQuery={handleSelectQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'category':
        return (
          <BrowsePage
            key={selectedCategory}
            onSelectQuery={handleSelectQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            initialCategory={selectedCategory}
          />
        );
      case 'query':
        if (!activeQuery) {
          return (
            <div className="rounded-2xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm my-12">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Bug className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Query Not Found</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The requested query could not be located in our catalog. It may have been renamed or moved.
              </p>
              <button
                onClick={() => handleSelectView('browse')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Browse All Queries</span>
              </button>
            </div>
          );
        }
        return (
          <QueryDetailPage
            query={activeQuery}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else if (selectedCategory) {
                handleSelectCategory(selectedCategory);
              } else {
                handleSelectView('browse');
              }
            }}
            onSelectQuery={handleSelectQuery}
            isFavorite={isFavorite(activeQuery.id)}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'favorites':
        return (
          <FavoritesPage
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectQuery={handleSelectQuery}
            onNavigate={handleSelectView}
          />
        );
      case 'recent':
        return (
          <RecentlyViewedPage
            recentItems={recent}
            onClearRecent={clearRecent}
            onSelectQuery={handleSelectQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onNavigate={handleSelectView}
          />
        );
      case 'playground':
        return <PlaygroundPage />;
      case 'tips':
        return <TipsPage />;
      case 'standards':
        return <StandardsPage />;
      case 'checklist':
        return (
          <ChecklistPage
            checkedIds={checkedIds}
            onToggleItem={toggleItem}
            onReset={resetChecklist}
          />
        );
      case 'guidelines':
        return <GuidelinesPage />;
      case 'boilerplate-sp':
        return <BoilerplateSpPage />;
      case 'sql-compare':
        return <SqlComparePage />;
      case 'json-formatter':
        return <JsonFormatterPage />;
      case 'knowledge':
      case 'sql-knowledge':
        return <SqlKnowledgePage />;
      case 'meter-journey':
      case 'kt':
        return <MeterJourneyKtPage />;
      default:
        return (
          <DashboardPage
            onSelectQuery={handleSelectQuery}
            onSelectCategory={handleSelectCategory}
            onNavigate={handleSelectView}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            recentItems={recent}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080d0b] text-slate-800 dark:text-slate-200 flex flex-col font-sans selection:bg-emerald-500/25 selection:text-emerald-900 dark:selection:bg-emerald-500/30 dark:selection:text-emerald-200 transition-colors duration-150">
      {/* Global Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onNavigate={handleSelectView}
        currentView={currentView}
        onToggleSidebar={() => setIsSidebarOpenMobile(true)}
        favoritesCount={favorites.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          selectedCategory={selectedCategory}
          onSelectView={handleSelectView}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          favoritesCount={favorites.length}
          onOpenBugReport={() => setIsBugReportOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <div className="flex-1 px-4 sm:px-8 lg:px-12 py-8 max-w-7xl w-full mx-auto">
            {renderCurrentView()}
          </div>

          {/* Minimalist Developer Footer */}
          <footer className="border-t border-emerald-100 dark:border-sql-border py-4 px-6 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-[#090b12] transition-colors">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Company</span>
              <span className="text-slate-500 dark:text-slate-400">— Enterprise SQL Platform</span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <button
                onClick={() => setIsBugReportOpen(true)}
                className="inline-flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-colors"
                title="Bug Report / Developer: Mubasshir Khan"
              >
                <Bug className="w-3.5 h-3.5 text-amber-500" />
                <span>Bug Report: <strong className="font-semibold underline decoration-emerald-500/40">Mubasshir Khan</strong></span>
              </button>
            </div>
            <div className="flex items-center space-x-3 font-mono text-[11px] flex-wrap justify-center">
              <button
                onClick={() => handleSelectView('boilerplate-sp')}
                className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                Boilerplate SPs
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('sql-compare')}
                className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                SQL Compare
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('json-formatter')}
                className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                JSON Formatter
              </button>
              <span>•</span>
              <button
                onClick={() => handleSelectView('guidelines')}
                className="hover:text-emerald-700 dark:hover:text-slate-300 transition-colors text-emerald-700 dark:text-emerald-400 font-semibold"
              >
                DB Guidelines
              </button>
              <span>•</span>
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="hover:text-emerald-700 dark:hover:text-slate-300 transition-colors"
              >
                Shortcuts (Ctrl+K, ?)
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectQuery={handleSelectQuery}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onOpenBugReport={() => setIsBugReportOpen(true)}
      />

      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
      />
    </div>
  );
}
export default App;
