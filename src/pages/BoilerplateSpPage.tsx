import React, { useState, useMemo } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Database,
  ExternalLink
} from 'lucide-react';
import { SP_BOILERPLATES, SpBoilerplate } from '../data/spBoilerplates';
import { CodeBlock } from '../components/CodeBlock';

export const BoilerplateSpPage: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(SP_BOILERPLATES[0].id);

  const currentTemplate: SpBoilerplate = useMemo(() => {
    return SP_BOILERPLATES.find(t => t.id === selectedTemplateId) || SP_BOILERPLATES[0];
  }, [selectedTemplateId]);

  // Form customization states
  const [procName, setProcName] = useState(currentTemplate.defaultProcName);
  const [author, setAuthor] = useState(currentTemplate.authorDefault);
  const [description, setDescription] = useState(currentTemplate.description);
  const [database, setDatabase] = useState(currentTemplate.database);
  const [payloadId, setPayloadId] = useState('100');
  const [copied, setCopied] = useState(false);

  // Sync form when template changes
  const handleSelectTemplate = (template: SpBoilerplate) => {
    setSelectedTemplateId(template.id);
    setProcName(template.defaultProcName);
    setAuthor(template.authorDefault);
    setDescription(template.description);
    setDatabase(template.database);
  };

  const handleResetDefaults = () => {
    setProcName(currentTemplate.defaultProcName);
    setAuthor(currentTemplate.authorDefault);
    setDescription(currentTemplate.description);
    setDatabase(currentTemplate.database);
    setPayloadId('100');
  };

  // Generate customized SQL code
  const generatedSql = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return currentTemplate.templateGenerator({
      procName,
      author,
      date: today,
      description,
      database,
      payloadId,
    });
  }, [currentTemplate, procName, author, description, database, payloadId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedSql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${procName || 'stored_procedure'}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-emerald-100 dark:border-sql-border pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <FileCode2 className="w-5 h-5" />
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Stored Procedure Boilerplate Generator
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Official Company production templates for MIS reporting, payload data movement, atomic transactions, and staging loads.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Script'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white dark:bg-sql-card hover:bg-emerald-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-sql-border text-xs font-medium transition-colors"
              title="Download as .sql file"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Download .sql</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SP_BOILERPLATES.map((tmpl) => {
          const isSelected = tmpl.id === selectedTemplateId;
          return (
            <button
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-500 shadow-sm ring-1 ring-emerald-500/50'
                  : 'bg-white dark:bg-sql-card/50 border-slate-200 dark:border-sql-border hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-emerald-50/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    [{tmpl.database}]
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <span>{isSelected ? 'Active Template' : 'Select Template'}</span>
                <span className="font-mono text-[10px]">usp_*</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Customizer Panel & SQL Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Customization Form & Guideline Checklist */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-sql-border">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Customize Parameters</span>
              </div>
              <button
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-400 hover:text-emerald-600 flex items-center space-x-1 transition-colors"
                title="Reset to template defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Target Database */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Database
              </label>
              <div className="relative">
                <Database className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface focus:border-emerald-500 focus:bg-white dark:focus:bg-sql-surface transition-colors"
                  placeholder="e.g. mis, mdms_stg, master"
                />
              </div>
            </div>

            {/* Stored Procedure Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Procedure Name <span className="text-emerald-600 text-[10px] font-normal">(must start with usp_)</span>
              </label>
              <input
                type="text"
                value={procName}
                onChange={(e) => setProcName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface focus:border-emerald-500 focus:bg-white dark:focus:bg-sql-surface transition-colors"
                placeholder="e.g. usp_rep_feeder_summary"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface focus:border-emerald-500 focus:bg-white dark:focus:bg-sql-surface transition-colors"
                placeholder="e.g. Mubasshir Khan"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface focus:border-emerald-500 focus:bg-white dark:focus:bg-sql-surface transition-colors resize-none"
                placeholder="Brief summary of procedure logic"
              />
            </div>

            {/* Conditional: Payload ID for Data Movement */}
            {currentTemplate.id === 'import-data-movement-payload' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  m_max_movedata Payload ID
                </label>
                <input
                  type="text"
                  value={payloadId}
                  onChange={(e) => setPayloadId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface focus:border-emerald-500 focus:bg-white dark:focus:bg-sql-surface transition-colors"
                  placeholder="e.g. 100"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique payload identifier registered in mdms_stg.dbo.m_max_movedata.
                </p>
              </div>
            )}
          </div>

          {/* Architecture & Guideline Compliance Box */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Company Standard Compliance</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {currentTemplate.features.map((feat, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Live SQL Code Output */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Generated T-SQL Script
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ({generatedSql.split('\n').length} lines)
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium font-mono">
              Ready for SSMS / Azure Data Studio
            </span>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-sql-border shadow-xs">
            <CodeBlock
              code={generatedSql}
              language="sql"
              title={`${procName || 'stored_procedure'}.sql`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
