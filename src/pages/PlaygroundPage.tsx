import React, { useState } from 'react';
import { Terminal, Wand2, Copy, Check, Download, RotateCcw, AlertCircle, FileCode } from 'lucide-react';
import { formatSql } from '../utils/sqlFormatter';
import { CodeBlock } from '../components/CodeBlock';

const SAMPLE_QUERIES = [
  {
    name: 'Unformatted Query',
    sql: `select a,b from table where id=10 and is_active=1 order by a`
  },
  {
    name: 'Active Requests DMV',
    sql: `select r.session_id, r.status, r.command, r.cpu_time, DB_NAME(r.database_id) as db_name, t.text as sql_text from sys.dm_exec_requests r cross apply sys.dm_exec_sql_text(r.sql_handle) t where r.session_id <> @@spid order by r.cpu_time desc`
  },
  {
    name: 'Partition Range Lookup',
    sql: `select o.name as table_name, rv.value as boundary_value, fg.name as filegroup, p.partition_number, p.rows from sys.partitions p inner join sys.objects o on p.object_id = o.object_id left outer join sys.partition_range_values rv on p.partition_number = rv.boundary_id where o.name = 'Orders'`
  }
];

export const PlaygroundPage: React.FC = () => {
  const [inputSql, setInputSql] = useState(SAMPLE_QUERIES[0].sql);
  const [formattedSql, setFormattedSql] = useState(() => formatSql(SAMPLE_QUERIES[0].sql));
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    const formatted = formatSql(inputSql);
    setFormattedSql(formatted);
  };

  const handleCopyFormatted = async () => {
    try {
      await navigator.clipboard.writeText(formattedSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([formattedSql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formatted_query.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = (sql: string) => {
    setInputSql(sql);
    setFormattedSql(formatSql(sql));
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 dark:border-sql-border pb-5">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Terminal className="w-5 h-5" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              T-SQL Client Playground & Formatter
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Write, normalize, and beautify SQL queries with standardized uppercase keywords and aligned clauses.
          </p>
        </div>

        {/* Clear Disclaimer Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-sky-500/20 bg-emerald-50 dark:bg-sky-950/20 text-emerald-800 dark:text-sky-300 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-sky-400 shrink-0" />
          <span>Client-side editor — does not execute against a database.</span>
        </div>
      </div>

      {/* Preset Query Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 flex items-center space-x-1 mr-1">
          <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-slate-400" />
          <span className="font-semibold">Load sample:</span>
        </span>
        {SAMPLE_QUERIES.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => handleLoadSample(sample.sql)}
            className="text-xs px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 transition-colors shadow-xs"
          >
            {sample.name}
          </button>
        ))}
      </div>

      {/* Side-by-Side Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Textarea */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Raw Input SQL
            </label>
            <button
              onClick={() => {
                setInputSql('');
                setFormattedSql('');
              }}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-emerald-700 dark:hover:text-slate-300"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <textarea
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
            placeholder="Type or paste unformatted SQL here..."
            rows={18}
            className="w-full flex-1 rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-surface p-4 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none shadow-xs"
          />

          <button
            onClick={handleFormat}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            <span>Format & Beautify SQL</span>
          </button>
        </div>

        {/* Right: Formatted Output */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Formatted & Highlighted Output
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-emerald-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs transition-colors shadow-xs"
                title="Download formatted SQL script"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>

              <button
                onClick={handleCopyFormatted}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-all shadow-xs ${
                  copied
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <CodeBlock
              sql={formattedSql}
              title="formatted_output"
              maxHeight="440px"
              className="flex-1"
            />
          </div>

          <div className="p-3 rounded-lg border border-sql-border/80 bg-sql-card/40 text-[11px] text-slate-400 leading-relaxed">
            Formats keywords to uppercase (<code>SELECT</code>, <code>FROM</code>, <code>WHERE</code>), indents joins, breaks clauses cleanly onto new lines, and handles single-line/multi-line comments without altering string literals.
          </div>
        </div>
      </div>
    </div>
  );
};
