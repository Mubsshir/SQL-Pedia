import React, { useState } from 'react';
import { 
  Sparkles, 
  Package, 
  Send, 
  Smartphone, 
  Wifi, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  Code2, 
  HelpCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Layers,
  Lightbulb
} from 'lucide-react';
import { 
  METER_JOURNEY_PHASES, 
  JourneyPhase 
} from '../data/meterJourneyKt';
import { ThreeSmartMeter, MeterComponentHotspot } from '../components/ThreeSmartMeter';
import { CodeBlock } from '../components/CodeBlock';

export const MeterJourneyKtPage: React.FC = () => {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string>('lcd');
  const [activeSubTab, setActiveSubTab] = useState<'story' | 'tables' | 'sp' | 'gotchas'>('story');

  const currentPhase: JourneyPhase = METER_JOURNEY_PHASES[activePhaseIndex];

  const getPhaseIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package className="w-4 h-4" />;
      case 'Send': return <Send className="w-4 h-4" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4" />;
      case 'Wifi': return <Wifi className="w-4 h-4" />;
      case 'Database': return <Database className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleHotspotSelect = (hotspot: MeterComponentHotspot) => {
    setActiveHotspotId(hotspot.id);
  };

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Page Title & Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-sql-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Interactive 3D Product Walkthrough
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How a Meter Starts Its Journey in MDMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            The complete end-to-end technical lifecycle: from warehouse factory inwarding to field technician mobile installation (WFM), cellular HES discovery ping, and midnight MDMS billing hierarchy activation.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Junior KT Module #1</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE 3D SMART METER VISUALIZER */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Interactive 3D Hardware & Database Inspection
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click any part to view its database schema mapping
          </span>
        </div>

        <ThreeSmartMeter
          activeHotspotId={activeHotspotId}
          onSelectHotspot={handleHotspotSelect}
        />
      </section>

      {/* SECTION 2: 5-PHASE INTERACTIVE LIFECYCLE TIMELINE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>The 5 Lifecycle Stages of a Meter</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Step {activePhaseIndex + 1} of {METER_JOURNEY_PHASES.length}
          </span>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {METER_JOURNEY_PHASES.map((phase, idx) => {
            const isActive = activePhaseIndex === idx;
            const isCompleted = activePhaseIndex > idx;

            return (
              <button
                key={phase.id}
                onClick={() => {
                  setActivePhaseIndex(idx);
                  setActiveSubTab('story');
                }}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : phase.stepNumber}
                  </span>
                  <span className="text-slate-400">
                    {getPhaseIcon(phase.iconName)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white block line-clamp-1">
                    {phase.shortName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                    {phase.tablesInvolved[0].name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: ACTIVE PHASE DEEP-DIVE CONTAINER */}
      <section className="rounded-2xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card shadow-sm p-6 sm:p-8 space-y-6">
        {/* Phase Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-sql-border/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentPhase.badgeColor}`}>
                Phase {currentPhase.stepNumber}: {currentPhase.shortName}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Stored Proc: {currentPhase.coreProcedure.procName}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {currentPhase.storyTitle}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={activePhaseIndex === 0}
              onClick={() => setActivePhaseIndex(prev => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-sql-border text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={activePhaseIndex === METER_JOURNEY_PHASES.length - 1}
              onClick={() => setActivePhaseIndex(prev => Math.min(METER_JOURNEY_PHASES.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              Next Step
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs inside the Phase */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-sql-border/60 pb-3">
          <button
            onClick={() => setActiveSubTab('story')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'story'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Real-World Field Story</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tables')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'tables'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>2. Database Tables Involved ({currentPhase.tablesInvolved.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sp')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'sp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>3. Stored Procedure & Execution</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gotchas')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'gotchas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>4. Junior Debugging & Gotchas</span>
          </button>
        </div>

        {/* SUBTAB 1: REAL-WORLD FIELD STORY */}
        {activeSubTab === 'story' && (
          <div className="space-y-6 animate-fadeIn text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-sql-surface border border-slate-200 dark:border-sql-border leading-relaxed text-slate-800 dark:text-slate-200 text-sm">
              {currentPhase.storySummary}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What Happens Step-By-Step:</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentPhase.businessContext.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card/50 flex items-start space-x-2.5 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: DATABASE TABLES INVOLVED */}
        {activeSubTab === 'tables' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              These tables store and track the meter state during this exact phase. Notice the strict adherence to our team prefix standards:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentPhase.tablesInvolved.map((tbl, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-surface p-4 space-y-3 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/20">
                        {tbl.prefixType}
                      </span>
                    </div>
                    <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white break-all">
                      dbo.{tbl.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {tbl.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-sql-border/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Key Columns:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tbl.keyColumns.map((col, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: STORED PROCEDURE & EXECUTION */}
        {activeSubTab === 'sp' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-sql-surface border border-slate-200 dark:border-sql-border">
              <div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold block">
                  PRIMARY STORED PROCEDURE
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  dbo.{currentPhase.coreProcedure.procName}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
                {currentPhase.coreProcedure.description}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Production Execution Template:
              </span>
              <CodeBlock
                sql={currentPhase.coreProcedure.sampleSql}
                title={`execute_${currentPhase.coreProcedure.procName.toLowerCase()}`}
              />
            </div>
          </div>
        )}

        {/* SUBTAB 4: JUNIOR DEBUGGING & GOTCHAS */}
        {activeSubTab === 'gotchas' && (
          <div className="space-y-4 animate-fadeIn">
            {currentPhase.juniorGotchas.map((gotcha, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-3.5 shadow-xs"
              >
                <div className="flex items-start space-x-2.5">
                  <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-amber-950 dark:text-amber-300">
                      &quot;{gotcha.question}&quot;
                    </h4>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {gotcha.answer}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Diagnostic Query to Run in SSMS:
                  </span>
                  <CodeBlock
                    sql={gotcha.verificationQuery}
                    title={`diagnose_step_${currentPhase.stepNumber}_${idx + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
