import React from 'react';
import { CheckSquare, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { REVIEW_CHECKLIST_ITEMS } from '../data/checklist';

interface ChecklistPageProps {
  checkedIds: string[];
  onToggleItem: (id: string) => void;
  onReset: () => void;
}

export const ChecklistPage: React.FC<ChecklistPageProps> = ({
  checkedIds,
  onToggleItem,
  onReset,
}) => {
  const totalCount = REVIEW_CHECKLIST_ITEMS.length;
  const completedCount = checkedIds.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const categories = Array.from(
    new Set(REVIEW_CHECKLIST_ITEMS.map((item) => item.category))
  );

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-sql-border pb-5">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 mb-1">
            <CheckSquare className="w-5 h-5" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              SQL Pull Request & Deployment Review Checklist
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Interactive verification checklist before submitting or releasing database scripts to production.
          </p>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reset Checks</span>
        </button>
      </div>

      {/* Progress Bar & Status */}
      <div className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <span className="text-slate-700 dark:text-slate-200">Review Progress:</span>
            <span className="text-emerald-700 dark:text-sky-400 font-mono font-bold">
              {completedCount} of {totalCount} verified
            </span>
          </div>
          <span className={`font-mono font-bold ${progressPercent === 100 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
            {progressPercent}%
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              progressPercent === 100
                ? 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {progressPercent === 100 && (
          <div className="flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 p-2.5 rounded-lg shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>All verification items passed! Query is ready for staging deployment and PR approval.</span>
          </div>
        )}
      </div>

      {/* Checklist Grouped by Category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const items = REVIEW_CHECKLIST_ITEMS.filter((i) => i.category === category);

          return (
            <div
              key={category}
              className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/40 overflow-hidden shadow-xs"
            >
              <div className="bg-slate-50 dark:bg-[#0e121d] px-5 py-3 border-b border-slate-200 dark:border-sql-border flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                  {category}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-medium">
                  {items.filter((i) => checkedIds.includes(i.id)).length} / {items.length} Done
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-sql-border/40 p-1">
                {items.map((item) => {
                  const isChecked = checkedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onToggleItem(item.id)}
                      className={`flex items-start space-x-3 p-3.5 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50/70 dark:bg-emerald-950/15' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by parent div
                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm font-semibold transition-colors ${
                              isChecked ? 'text-emerald-800 dark:text-emerald-300 line-through' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.critical && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

