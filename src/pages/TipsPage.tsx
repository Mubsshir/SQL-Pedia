import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, Tag, Search } from 'lucide-react';
import { SQL_TIPS } from '../data/tips';
import { CodeBlock } from '../components/CodeBlock';

export const TipsPage: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [filterText, setFilterText] = useState<string>('');

  const allTags = Array.from(new Set(SQL_TIPS.flatMap((t) => t.tags)));

  const filteredTips = SQL_TIPS.filter((tip) => {
    const matchesTag = selectedTag === 'ALL' || tip.tags.includes(selectedTag);
    const matchesText =
      !filterText.trim() ||
      tip.title.toLowerCase().includes(filterText.toLowerCase()) ||
      tip.problem.toLowerCase().includes(filterText.toLowerCase()) ||
      tip.why.toLowerCase().includes(filterText.toLowerCase());
    return matchesTag && matchesText;
  });

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-emerald-100 dark:border-sql-border pb-5">
        <div className="flex items-center space-x-2 text-emerald-700 dark:text-yellow-400 mb-1">
          <Lightbulb className="w-5 h-5 text-amber-500 dark:text-yellow-400" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            SQL Tips & Anti-Patterns
          </h1>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Proven advice from senior database engineers. Every tip structured as: <strong>Problem → Why → Better approach → Example</strong>.
        </p>
      </div>

      {/* Filter & Tag Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search tips..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-surface text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 mr-1 flex items-center space-x-1">
            <Tag className="w-3 h-3 text-emerald-600" />
            <span className="font-semibold">Tags:</span>
          </span>
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              selectedTag === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-700/60'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Cards List */}
      <div className="space-y-8">
        {filteredTips.map((tip) => (
          <div
            key={tip.id}
            className="rounded-2xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 p-6 sm:p-7 space-y-5 shadow-xs hover:shadow-md transition-shadow"
          >
            {/* Tip Title & Category */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-sql-border/60 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {tip.title}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded">
                  {tip.category}
                </span>
              </div>
            </div>

            {/* Problem & Why */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-950/15 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>The Problem</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {tip.problem}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-950/15 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Why It Matters</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {tip.why}
                </p>
              </div>
            </div>

            {/* Better Approach */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/15 space-y-1.5 text-xs shadow-xs">
              <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recommended Solution</span>
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {tip.betterApproach}
              </p>
            </div>

            {/* Bad Code vs Good Code Comparison */}
            {(tip.badCode || tip.goodCode) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {tip.badCode && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center space-x-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Avoid This Pattern</span>
                    </span>
                    <CodeBlock
                      sql={tip.badCode}
                      title="anti_pattern"
                      maxHeight="250px"
                      showLineNumbers={false}
                    />
                  </div>
                )}

                {tip.goodCode && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Preferred Approach</span>
                    </span>
                    <CodeBlock
                      sql={tip.goodCode}
                      title="best_practice"
                      maxHeight="250px"
                      showLineNumbers={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tags Footer */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tip.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0d101a] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

