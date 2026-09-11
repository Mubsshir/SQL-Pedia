import React, { useState } from 'react';
import { Star, Copy, Check, ChevronRight, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { QuerySnippet, RiskLevel } from '../types';

interface QueryCardProps {
  query: QuerySnippet;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (query: QuerySnippet) => void;
}

export const QueryCard: React.FC<QueryCardProps> = ({
  query,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(query.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(query.id);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'safe':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Safe</span>
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Caution</span>
          </span>
        );
      case 'destructive':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 px-2 py-0.5 rounded">
            <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Destructive</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(query)}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/80 p-5 hover:bg-emerald-50/30 dark:hover:bg-sql-cardHover hover:border-emerald-300 dark:hover:border-sql-borderLight hover:shadow-md transition-all duration-200 cursor-pointer shadow-xs"
    >
      <div>
        {/* Top Badges & Favorite */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-emerald-800 dark:text-sky-400 bg-emerald-50 dark:bg-sky-950/50 border border-emerald-200 dark:border-sky-500/20 px-2 py-0.5 rounded">
              {query.category}
            </span>
            {getRiskBadge(query.risk)}
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 font-mono">
              {query.sqlServerVersion}
            </span>
          </div>

          <button
            onClick={handleFavorite}
            title={isFavorite ? "Remove from favorites" : "Save to favorites"}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-400/10'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-sky-300 transition-colors line-clamp-1 mb-1.5">
          {query.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {query.description}
        </p>
      </div>

      <div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {query.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0d101a] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
            >
              #{tag}
            </span>
          ))}
          {query.tags.length > 4 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 py-0.5">
              +{query.tags.length - 4} more
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-sql-border/60">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy SQL</span>
              </>
            )}
          </button>

          <span className="inline-flex items-center text-xs font-medium text-slate-500 group-hover:text-emerald-700 dark:text-slate-400 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all">
            <span>View details</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
