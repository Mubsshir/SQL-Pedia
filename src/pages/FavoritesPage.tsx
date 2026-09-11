import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { QuerySnippet } from '../types';
import { QueryCard } from '../components/QueryCard';
import { getQueryById } from '../data/queriesIndex';

interface FavoritesPageProps {
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectQuery: (query: QuerySnippet) => void;
  onNavigate: (view: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favorites,
  onToggleFavorite,
  onSelectQuery,
  onNavigate,
}) => {
  const favoriteQueries = favorites
    .map((id) => getQueryById(id))
    .filter((q): q is QuerySnippet => q !== undefined);

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-emerald-100 dark:border-sql-border pb-5">
        <div className="flex items-center space-x-2 text-amber-500 mb-1">
          <Star className="w-5 h-5 fill-amber-400" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Favorite Queries
          </h1>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Your personal quick-access list of frequently used SQL Server diagnostic and management commands.
        </p>
      </div>

      {favoriteQueries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/30 p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No favorites saved yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click the star icon on any query card to save it here for instant one-click access.
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <span>Browse All Queries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteQueries.map((query) => (
            <QueryCard
              key={query.id}
              query={query}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};
