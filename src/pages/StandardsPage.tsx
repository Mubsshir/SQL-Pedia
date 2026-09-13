import React from 'react';
import { BookOpen, Users, CheckCircle, XCircle } from 'lucide-react';
import { TEAM_STANDARDS } from '../data/standards';

export const StandardsPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-emerald-100 dark:border-sql-border pb-5">
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
          <BookOpen className="w-5 h-5" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Team SQL Engineering Standards
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Adopted company-wide across all engineering, DBA, development, and QA teams.</span>
        </div>
      </div>

      {/* Standards Sections */}
      <div className="space-y-10">
        {TEAM_STANDARDS.map((sec) => (
          <section key={sec.id} className="space-y-4">
            <div className="border-b border-slate-200 dark:border-sql-border/60 pb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-sky-400 block mb-0.5">
                {sec.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {sec.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {sec.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sec.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow"
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{rule.rule}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rule.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2 pt-1 text-xs font-mono">
                    {rule.example && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-[11px] leading-relaxed break-all">
                        <span className="text-emerald-900 dark:text-emerald-400 font-bold uppercase tracking-wider text-[9px] block mb-1">
                          Standard Example:
                        </span>
                        {rule.example}
                      </div>
                    )}

                    {rule.badExample && (
                      <div className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-300 text-[11px] leading-relaxed break-all">
                        <span className="text-rose-900 dark:text-rose-400 font-bold uppercase tracking-wider text-[9px] block mb-1">
                          Never Use:
                        </span>
                        {rule.badExample}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
