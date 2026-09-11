import React from 'react';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { QuerySnippet } from '../types';
import { QueryCard } from '../components/QueryCard';
import { getQueryById } from '../data/queriesIndex';
import { RecentItem } from '../hooks/useRecentlyViewed';
import { formatRelativeTime } from '../utils/dateUtils';

interface RecentlyViewedPageProps {
  recentItems: RecentItem[];
  onClearRecent: () => void;
  onSelectQuery: (query: QuerySnippet) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onNavigate: (view: string) => void;
}

export const RecentlyViewedPage: React.FC<RecentlyViewedPageProps> = ({
  recentItems,
  onClearRecent,
  onSelectQuery,
  favorites,
  onToggleFavorite,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-emerald-100 dark:border-sql-border pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 dark:text-cyan-400 mb-1">
            <History className="w-5 h-5" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Recently Viewed Queries
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            A chronological timeline of queries you recently inspected on this workstation.
          </p>
        </div>

        {recentItems.length > 0 && (
          <button
            onClick={onClearRecent}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {recentItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/30 p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No recently opened queries</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              As you browse and inspect queries, they will automatically be tracked here.
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <span>Explore Queries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map((item) => {
              const query = getQueryById(item.id);
              if (!query) return null;
              return (
                <div key={item.id} className="relative group">
                  <div className="absolute top-2 right-12 z-10 text-[10px] text-slate-400 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded font-mono">
                    {formatRelativeTime(item.timestamp)}
                  </div>
                  <QueryCard
                    query={query}
                    isFavorite={favorites.includes(query.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={onSelectQuery}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
