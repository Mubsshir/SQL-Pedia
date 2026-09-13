import React, { useState } from 'react';
import { 
  GraduationCap, 
  Cpu, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Layers, 
  Flame, 
  Zap, 
  Search, 
  Terminal, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Server
} from 'lucide-react';
import { 
  QUERY_STATUSES, 
  SQLOS_LIFECYCLE_STEPS, 
  TOP_WAIT_TYPES, 
  QueryStatusDetail 
} from '../data/sqlKnowledge';
import { CodeBlock } from '../components/CodeBlock';

export const SqlKnowledgePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'statuses' | 'lifecycle' | 'waits'>('statuses');
  const [selectedStatusId, setSelectedStatusId] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filteredStatuses = QUERY_STATUSES.filter((item) => {
    if (selectedStatusId !== 'all' && item.id !== selectedStatusId) return false;
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      item.status.toLowerCase().includes(term) ||
      item.title.toLowerCase().includes(term) ||
      item.summary.toLowerCase().includes(term) ||
      item.whatItMeans.toLowerCase().includes(term) ||
      item.causesAndScenarios.some(c => c.toLowerCase().includes(term))
    );
  });

  const getHealthBadge = (level: QueryStatusDetail['healthEvaluation']['level']) => {
    switch (level) {
      case 'Normal':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Normal Execution</span>
          </span>
        );
      case 'Caution':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Investigate Wait/Tran</span>
          </span>
        );
      case 'Danger':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Bottleneck / Action Required</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-950 border border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500/30">
            <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>System Internal</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-sql-border pb-5">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              SQL Engine Knowledge & Internals
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Essential concepts every database developer, engineer, and DBA must know: query thread statuses, cooperative scheduling, resource waits, and transaction diagnostics.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs font-semibold shrink-0">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Core Developer Knowledge</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-emerald-100 dark:border-sql-border pb-3">
        <button
          onClick={() => setActiveTab('statuses')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'statuses'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Query Statuses (Running, Suspended, Runnable...)</span>
        </button>

        <button
          onClick={() => setActiveTab('lifecycle')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'lifecycle'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>The SQLOS Scheduling Loop (4ms Quantum)</span>
        </button>

        <button
          onClick={() => setActiveTab('waits')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'waits'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-sql-border'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Top Wait Types Reference</span>
        </button>
      </div>

      {/* TAB 1: QUERY STATUSES */}
      {activeTab === 'statuses' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUERY_STATUSES.map((statusItem) => (
              <button
                key={statusItem.id}
                onClick={() => setSelectedStatusId(selectedStatusId === statusItem.id ? 'all' : statusItem.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedStatusId === statusItem.id
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {statusItem.status}
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                  {statusItem.title}
                </div>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-sql-surface p-3 rounded-xl border border-slate-200 dark:border-sql-border shadow-xs">
            <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Showing:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                {selectedStatusId === 'all' ? 'All 6 Statuses' : selectedStatusId.toUpperCase()}
              </span>
              {selectedStatusId !== 'all' && (
                <button
                  onClick={() => setSelectedStatusId('all')}
                  className="text-[11px] text-slate-500 hover:text-emerald-600 underline ml-2"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search statuses, DMVs, causes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-sql-border bg-slate-50 dark:bg-sql-card text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Status Detail Cards */}
          <div className="space-y-6">
            {filteredStatuses.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 p-6 sm:p-7 space-y-6 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Header with Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-sql-border/60 pb-4">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold border ${item.badge.lightClass} ${item.badge.darkClass}`}>
                      {item.status}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {item.title}
                    </h2>
                  </div>
                  <div>
                    {getHealthBadge(item.healthEvaluation.level)}
                  </div>
                </div>

                {/* State Banner */}
                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 dark:bg-sql-surface border border-slate-200 dark:border-sql-border text-xs">
                  <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      Thread Position in SQLOS:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      {item.threadState}
                    </p>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 block pt-1">
                      DMV Source: <code className="text-emerald-700 dark:text-emerald-300">{item.dmvSource}</code>
                    </span>
                  </div>
                </div>

                {/* What It Means Deep Dive */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>What It Means In Plain English</span>
                  </h3>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {item.whatItMeans}
                  </p>
                </div>

                {/* Health Evaluation */}
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/15 space-y-1 text-xs">
                  <span className="font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider block">
                    Is this status normal or a problem?
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {item.healthEvaluation.explanation}
                  </p>
                </div>

                {/* Common Scenarios & Causes */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Common Triggers & Operational Scenarios</span>
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {item.causesAndScenarios.map((cause, idx) => (
                      <li key={idx} className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Diagnostic Query */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-sky-600" />
                    <span>Diagnostic T-SQL: Inspecting this status in production</span>
                  </h3>
                  <CodeBlock
                    sql={item.diagnosticQuery}
                    title={`diagnose_${item.id}_requests`}
                  />
                </div>

                {/* Actionable Runbook */}
                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Actionable Developer / DBA Runbook</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {item.troubleshootingSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-2 p-2.5 rounded-lg border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-surface text-slate-800 dark:text-slate-300">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SQLOS SCHEDULING LIFECYCLE */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Conceptual Explanation Box */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-[#0c1410] dark:to-emerald-950/20 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              How SQL Server Schedules Queries: The 4ms Cooperative Quantum
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
              SQL Server does not use preemptive Windows thread scheduling for queries; it uses its own non-preemptive user-mode scheduler called <strong>SQLOS</strong>. Each logical CPU core has a dedicated SOS Scheduler. A worker thread is given a maximum <strong>4-millisecond quantum</strong> on the CPU.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white dark:bg-sql-card border border-slate-200 dark:border-sql-border">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1">1. RUNNING</span>
                <span>Active on CPU (Max 4ms before voluntarily yielding).</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-sql-card border border-slate-200 dark:border-sql-border">
                <span className="text-amber-700 dark:text-amber-400 font-bold block mb-1">2. SUSPENDED</span>
                <span>Off CPU in Waiter List waiting for I/O, Lock, or Memory.</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-sql-card border border-slate-200 dark:border-sql-border">
                <span className="text-sky-700 dark:text-sky-400 font-bold block mb-1">3. RUNNABLE</span>
                <span>Ready to run, queued in line waiting for next free CPU core.</span>
              </div>
            </div>
          </div>

          {/* Sequential Lifecycle Stages */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Query Lifecycle Step-by-Step
            </h3>

            <div className="relative border-l-2 border-emerald-300 dark:border-emerald-600/40 ml-4 space-y-8 pl-6">
              {SQLOS_LIFECYCLE_STEPS.map((step) => (
                <div key={step.stepNumber} className="relative space-y-2 group">
                  {/* Step Bubble */}
                  <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {step.stepNumber}
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card p-5 space-y-2.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-sql-border/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {step.name}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Status: {step.statusName}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Managed by: {step.actor}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Next Transition:</strong> {step.transitionTrigger}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMON WAIT TYPES */}
      {activeTab === 'waits' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/60 space-y-1 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Understanding SQL Server Wait Statistics
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Whenever a query is in a <strong>SUSPENDED</strong> state, SQL Server records the exact reason as a <code>wait_type</code>. Measuring wait statistics is the most accurate way to find why queries are slow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOP_WAIT_TYPES.map((w, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card p-5 space-y-3.5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-sql-border/60 pb-2">
                    <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 break-all">
                      {w.waitType}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {w.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {w.meaning}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-sql-surface border border-slate-200 dark:border-sql-border text-xs space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                      When is it normal?
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {w.isNormal}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-xs space-y-1">
                    <span className="font-bold text-emerald-950 dark:text-emerald-300 block text-[11px]">
                      Developer Action:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                      {w.action}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <CodeBlock
                    sql={w.diagnosticSql}
                    title={`check_${w.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
