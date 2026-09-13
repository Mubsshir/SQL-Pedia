import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Code2, 
  Table, 
  Calendar, 
  Server, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  SP_GUIDELINES, 
  TABLE_GUIDELINES, 
  TABLE_ALIASES, 
  NEW_YEAR_ACTIVITIES, 
  NEW_DB_DEPLOY_CHECKLIST, 
  SERVER_SYNC_QUERIES 
} from '../data/dbGuidelines';
import { CodeBlock } from '../components/CodeBlock';

export const GuidelinesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sp' | 'table' | 'aliases' | 'newyear' | 'deploy'>('sp');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 dark:border-sql-border pb-5">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <FileSpreadsheet className="w-5 h-5" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Official DB Guidelines & Standards
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Adopted directly from our team&apos;s master <strong>DB Guidelines Document</strong> for stored procedures, table naming, server deployments, and annual archiving.
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Team Master Reference</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-emerald-200 dark:border-sql-border pb-3">
        <button
          onClick={() => setActiveTab('sp')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'sp'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>SP Guidelines (17 Rules)</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'table'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Table Guidelines (M_, L_, T_, S_, R_)</span>
        </button>

        <button
          onClick={() => setActiveTab('aliases')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'aliases'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Standard Table Aliases</span>
        </button>

        <button
          onClick={() => setActiveTab('newyear')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'newyear'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>New Year Archive Workflow</span>
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'deploy'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>New DB Deploy & Server Sync</span>
        </button>
      </div>

      {/* Tab 1: Stored Procedure Guidelines */}
      {activeTab === 'sp' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Callout */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-2 text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px] block">
              Core Stored Procedure Standards Summary
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Every SP must include the standard header, avoid reserved words (<em>Create/Created, Alter/Altered</em>) in comments, log errors into <code>t_job_error</code> with <code>RAISERROR WITH NOWAIT</code> at the end of catch block, use <code>(NOLOCK)</code> on reports, eliminate extra spaces, and filter dates using open-ended ranges without <code>CAST/CONVERT/BETWEEN</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {SP_GUIDELINES.map((item) => (
              <div
                key={item.sno}
                className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {item.sno}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {item.guideline}
                    </p>
                  </div>
                </div>

                {item.remarks && (
                  <div className="ml-9 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0c0f18] p-3 rounded-lg border border-slate-200/80 dark:border-sql-border/60">
                    <strong className="text-emerald-700 dark:text-emerald-400">Notes / Rationale: </strong>
                    {item.remarks}
                  </div>
                )}

                {item.query && (
                  <div className="ml-9 pt-1">
                    <CodeBlock
                      sql={item.query}
                      title={`sp_guideline_${item.sno}`}
                      maxHeight="220px"
                      showLineNumbers={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Table Guidelines */}
      {activeTab === 'table' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Nomenclature Quick Reference Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 text-center">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono block">M_</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Master Tables</span>
              <span className="text-[10px] text-slate-500">M_Organisation_Hierarchy</span>
            </div>

            <div className="p-4 rounded-xl border border-sky-300 dark:border-sky-500/30 bg-sky-50/60 dark:bg-sky-950/20 text-center">
              <span className="text-2xl font-black text-sky-700 dark:text-sky-400 font-mono block">L_</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Lookup Tables</span>
              <span className="text-[10px] text-slate-500">L_Network_Lookup</span>
            </div>

            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 text-center">
              <span className="text-2xl font-black text-amber-900 dark:text-amber-400 font-mono block">T_</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Transaction Tables</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">T_Consumer_Billing</span>
            </div>

            <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50/60 dark:bg-purple-950/20 text-center">
              <span className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono block">S_</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Staging Tables</span>
              <span className="text-[10px] text-slate-500">S_RawMeterData</span>
            </div>

            <div className="p-4 rounded-xl border border-teal-300 dark:border-teal-500/30 bg-teal-50/60 dark:bg-teal-950/20 text-center col-span-2 sm:col-span-1">
              <span className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono block">R_</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Report Tables</span>
              <span className="text-[10px] text-slate-500">R_Consumer_All</span>
            </div>
          </div>

          <div className="space-y-4">
            {TABLE_GUIDELINES.map((item) => (
              <div
                key={item.sno}
                className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 p-5 space-y-2 shadow-sm"
              >
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {item.sno}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.guideline}
                    </h3>
                    {item.remarks && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {item.remarks}
                      </p>
                    )}
                  </div>
                </div>

                {item.query && (
                  <div className="ml-9 pt-2">
                    <CodeBlock
                      sql={item.query}
                      title={`table_guideline_${item.sno}`}
                      maxHeight="200px"
                      showLineNumbers={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Standard Table Aliases Directory */}
      {activeTab === 'aliases' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <strong className="text-emerald-800 dark:text-emerald-300 block">
              Rule 17: Structured Alias Prefix Standard
            </strong>
            <p>
              Alias names must reflect the logical purpose of the table and follow prefix structure (e.g. &apos;L&apos; for Lookup, &apos;R&apos; for Report). When the same table is joined multiple times in a query, incremental suffixes (1, 2, 3) must be used.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-surface overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0e121d] border-b border-slate-200 dark:border-sql-border text-slate-700 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-5">Table Name</th>
                  <th className="py-3 px-5 font-mono">Mandatory Alias</th>
                  <th className="py-3 px-5">Reference / Description</th>
                  <th className="py-3 px-5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-sql-border/60">
                {TABLE_ALIASES.map((alias, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-5 font-mono font-medium text-slate-900 dark:text-sky-300">
                      {alias.tableName}
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30">
                        {alias.aliasName}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-600 dark:text-slate-300">
                      {alias.reference}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleCopy(`${alias.tableName} ${alias.aliasName}`, `alias-${idx}`)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                      >
                        {copiedId === `alias-${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Join</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: New Year Archive & Partition Workflow */}
      {activeTab === 'newyear' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
              Annual Database Partitioning & Archive Runbook
            </span>
            <p>
              Executed annually during the Q4/Q1 cutover window to prepare the incoming calendar year partition files, archive historical tables, and prevent partition overflow.
            </p>
          </div>

          <div className="space-y-3">
            {NEW_YEAR_ACTIVITIES.map((act) => (
              <div
                key={act.sno}
                className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {act.sno}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {act.guideline}
                  </h3>
                  {act.remarks && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {act.remarks}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: New DB Deploy & Server Counter Resets */}
      {activeTab === 'deploy' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Checklist */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Production Server Deployment Checklist</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NEW_DB_DEPLOY_CHECKLIST.map((step) => (
                <div
                  key={step.sno}
                  className="p-4 rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {step.sno}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {step.guideline}
                    </span>
                  </div>
                  {step.remarks && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-7">
                      {step.remarks}
                    </p>
                  )}
                  {step.query && (
                    <div className="ml-7 pt-1">
                      <CodeBlock
                        sql={step.query}
                        title={`deploy_step_${step.sno}`}
                        maxHeight="160px"
                        showLineNumbers={false}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sync & Reseed Queries */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-sql-border">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>MDM & MIS Server Sync & Reseed Queries</span>
            </h2>

            <div className="space-y-5">
              {SERVER_SYNC_QUERIES.map((sync, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 p-5 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {sync.guideline}
                    </h3>
                  </div>
                  {sync.query && (
                    <CodeBlock
                      sql={sync.query}
                      title={`server_sync_${sync.sno}`}
                      maxHeight="250px"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
