import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, ShieldCheck, AlertTriangle, AlertOctagon, Terminal, Tag } from 'lucide-react';
import { QuerySnippet, RiskLevel } from '../types';
import { searchQueries } from '../utils/searchEngine';
import { ALL_QUERIES } from '../data/queriesIndex';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: QuerySnippet) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    return searchQueries(ALL_QUERIES, searchTerm).slice(0, 15);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectQuery(results[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getRiskIcon = (risk: RiskLevel) => {
    switch (risk) {
      case 'safe':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'caution':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'destructive':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#111522] border border-emerald-200 dark:border-sql-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-emerald-100 dark:border-sql-border bg-slate-50 dark:bg-[#0e121d]">
          <Search className="w-5 h-5 text-emerald-600 dark:text-sky-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search queries, guidelines, procedures, partitions, DMVs, tags..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center ml-2 space-x-1">
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
              <p>No queries found matching &quot;{searchTerm}&quot;</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                Try searching for &quot;guidelines&quot;, &quot;partition&quot;, &quot;index&quot;, &quot;active&quot;, &quot;job&quot;, or &quot;lock&quot;.
              </p>
            </div>
          ) : (
            results.map((query, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={query.id}
                  onClick={() => {
                    onSelectQuery(query);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 border border-emerald-300 dark:bg-sky-950/40 dark:border-sky-500/30 text-slate-900 dark:text-slate-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3 overflow-hidden">
                    <div className="mt-1 shrink-0">
                      {getRiskIcon(query.risk)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-700 dark:text-sky-300' : 'text-slate-900 dark:text-slate-200'}`}>
                          {query.title}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-800 dark:text-slate-400 bg-emerald-100/80 dark:bg-slate-800/80 px-1.5 py-0.2 rounded shrink-0">
                          {query.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {query.description}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        {query.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center space-x-0.5 text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0d101a] px-1 py-0.2 rounded border border-slate-200 dark:border-slate-800"
                          >
                            <Tag className="w-2.5 h-2.5 mr-0.5 text-slate-400 dark:text-slate-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0 ml-3 text-slate-400 dark:text-slate-500">
                    <span className="text-[10px] hidden sm:inline mr-2 font-mono">
                      {query.sqlServerVersion}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Search Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-emerald-100 dark:border-sql-border bg-slate-50 dark:bg-[#0e121d] text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono border border-slate-300 dark:border-slate-700">↑</kbd>
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono border border-slate-300 dark:border-slate-700">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono border border-slate-300 dark:border-slate-700">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px]">
            {results.length} results
          </span>
        </div>
      </div>
    </div>
  );
};
