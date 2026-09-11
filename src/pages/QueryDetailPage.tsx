import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Star, Tag, Check, Copy, Sliders, ExternalLink, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { QuerySnippet, RiskLevel } from '../types';
import { CodeBlock } from '../components/CodeBlock';
import { WarningBanner } from '../components/WarningBanner';
import { ParameterEditor } from '../components/ParameterEditor';
import { getRelatedQueries, getQueryById } from '../data/queriesIndex';

interface QueryDetailPageProps {
  query: QuerySnippet;
  onBack: () => void;
  onSelectQuery: (query: QuerySnippet) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const QueryDetailPage: React.FC<QueryDetailPageProps> = ({
  query,
  onBack,
  onSelectQuery,
  isFavorite,
  onToggleFavorite,
}) => {
  // Store customized parameter values
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  // Reset parameters when query changes
  useEffect(() => {
    const defaults: Record<string, string> = {};
    if (query.parameters) {
      query.parameters.forEach(p => {
        defaults[p.name] = p.defaultValue;
      });
    }
    setParamValues(defaults);
  }, [query]);

  // Compute live customized SQL string based on parameter substitutions
  const customizedSql = useMemo(() => {
    let result = query.sql;
    if (query.parameters) {
      query.parameters.forEach(p => {
        const val = paramValues[p.name] ?? p.defaultValue;
        // Replace default value occurrences with customized value
        if (p.defaultValue && val !== p.defaultValue) {
          result = result.split(p.defaultValue).join(val);
        }
      });
    }
    return result;
  }, [query.sql, query.parameters, paramValues]);

  const handleParamChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
  };

  const handleResetParams = () => {
    const defaults: Record<string, string> = {};
    if (query.parameters) {
      query.parameters.forEach(p => {
        defaults[p.name] = p.defaultValue;
      });
    }
    setParamValues(defaults);
  };

  const relatedQueries = getRelatedQueries(query);

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to queries</span>
        </button>

        <button
          onClick={() => onToggleFavorite(query.id)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-xs ${
            isFavorite
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
          <span>{isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}</span>
        </button>
      </div>

      {/* Query Title & Metadata Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-emerald-800 dark:text-sky-400 bg-emerald-100/80 dark:bg-sky-950/60 border border-emerald-200 dark:border-sky-500/30 px-2.5 py-0.5 rounded">
            {query.category}
          </span>
          {query.subcategory && (
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {query.subcategory}
            </span>
          )}
          <span className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0c101a] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
            SQL Server {query.sqlServerVersion}
          </span>
          <span className="text-xs text-purple-800 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/20 px-2 py-0.5 rounded">
            {query.difficulty}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {query.title}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {query.description}
        </p>
      </div>

      {/* Safety / Warning Banner */}
      <WarningBanner risk={query.risk} warnings={query.warnings} />

      {/* When to Use Scenario Card */}
      <div className="rounded-xl border border-emerald-200 dark:border-sky-500/20 bg-emerald-50/70 dark:bg-sky-950/15 p-4.5 space-y-1.5 text-xs shadow-xs">
        <span className="font-bold text-emerald-800 dark:text-sky-400 uppercase tracking-wider block">
          When to Use
        </span>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {query.whenToUse}
        </p>
      </div>

      {/* Interactive Parameters Customizer */}
      {query.parameters && query.parameters.length > 0 && (
        <ParameterEditor
          parameters={query.parameters}
          values={paramValues}
          onChange={handleParamChange}
          onReset={handleResetParams}
        />
      )}

      {/* Main T-SQL Code Block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            T-SQL Statement
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Click &quot;Copy SQL&quot; to copy formatted script
          </span>
        </div>
        <CodeBlock
          sql={customizedSql}
          title={query.id}
          maxHeight="550px"
        />
      </div>

      {/* Result Schema / Columns Returned */}
      {query.columnsReturned && query.columnsReturned.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            Columns & Diagnostic Information Returned
          </h3>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-surface shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0e121d] border-b border-slate-200 dark:border-sql-border text-slate-700 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-4 font-mono">Column Name</th>
                  <th className="py-2.5 px-4">Description & Practical Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-sql-border/60">
                {query.columnsReturned.map((col, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-2 px-4 font-mono font-bold text-emerald-700 dark:text-sky-300 whitespace-nowrap">
                      {col.name}
                    </td>
                    <td className="py-2 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {col.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes & Production Guidelines */}
      {query.notes && query.notes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            Engineering Notes & Caveats
          </h3>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed list-disc list-inside bg-white dark:bg-sql-card/40 p-4 rounded-xl border border-slate-200 dark:border-sql-border shadow-xs">
            {query.notes.map((note, idx) => (
              <li key={idx} className="pl-1">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Queries Navigation */}
      {relatedQueries.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-sql-border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Related Queries
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {relatedQueries.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectQuery(rel)}
                className="p-3 rounded-lg border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 hover:bg-emerald-50/40 dark:hover:bg-sql-cardHover hover:border-emerald-300 dark:hover:border-sky-500/30 cursor-pointer transition-all group shadow-xs"
              >
                <span className="text-[10px] text-emerald-700 dark:text-sky-400 block mb-1 font-semibold">
                  {rel.category}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-sky-300 transition-colors line-clamp-1">
                  {rel.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
