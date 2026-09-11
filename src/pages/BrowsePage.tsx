import React, { useState, useMemo } from 'react';
import { Filter, Search, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { QuerySnippet, QueryCategory, RiskLevel, DifficultyLevel } from '../types';
import { QueryCard } from '../components/QueryCard';
import { ALL_QUERIES } from '../data/queriesIndex';
import { CATEGORIES } from '../data/categories';
import { searchQueries } from '../utils/searchEngine';

interface BrowsePageProps {
  onSelectQuery: (query: QuerySnippet) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  initialCategory?: QueryCategory;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  onSelectQuery,
  favorites,
  onToggleFavorite,
  initialCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filteredQueries = useMemo(() => {
    let result = ALL_QUERIES;

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      result = result.filter((q) => q.category === selectedCategory);
    }

    // Filter by Risk
    if (selectedRisk !== 'ALL') {
      result = result.filter((q) => q.risk === selectedRisk);
    }

    // Filter by Difficulty
    if (selectedDifficulty !== 'ALL') {
      result = result.filter((q) => q.difficulty === selectedDifficulty);
    }

    // Filter by Search
    if (searchFilter.trim()) {
      result = searchQueries(result, searchFilter);
    }

    return result;
  }, [selectedCategory, selectedRisk, selectedDifficulty, searchFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-sql-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {selectedCategory === 'ALL' ? 'All T-SQL Queries' : selectedCategory}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Browse, filter, and inspect {filteredQueries.length} production-grade queries.
          </p>
        </div>

        {/* Search input in page */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter list..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-surface text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-sky-500 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 mr-2">
          <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white dark:bg-sql-surface border border-slate-200 dark:border-sql-border rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Risk Filter */}
        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="bg-white dark:bg-sql-surface border border-slate-200 dark:border-sql-border rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="safe">🟢 Safe / Read-Only</option>
          <option value="caution">🟡 Caution</option>
          <option value="destructive">🔴 Destructive</option>
        </select>

        {/* Difficulty Filter */}
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="bg-white dark:bg-sql-surface border border-slate-200 dark:border-sql-border rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
        >
          <option value="ALL">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        {(selectedCategory !== 'ALL' || selectedRisk !== 'ALL' || selectedDifficulty !== 'ALL' || searchFilter) && (
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedRisk('ALL');
              setSelectedDifficulty('ALL');
              setSearchFilter('');
            }}
            className="text-[11px] text-emerald-700 dark:text-sky-400 hover:text-emerald-800 dark:hover:text-sky-300 underline ml-2 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Query Cards Grid */}
      {filteredQueries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/40 p-12 text-center text-slate-500 space-y-2 shadow-xs">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400">No queries match the selected filters.</p>
          <p className="text-xs text-slate-500">Try clearing category or risk filters to see more results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueries.map((query) => (
            <QueryCard
              key={query.id}
              query={query}
              isFavorite={favorites.includes(query.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

