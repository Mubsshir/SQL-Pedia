import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Columns, 
  AlignJustify,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  FileCode
} from 'lucide-react';

interface DiffLine {
  type: 'equal' | 'insert' | 'delete';
  leftLine?: string;
  leftLineNum?: number;
  rightLine?: string;
  rightLineNum?: number;
}

// Standard dynamic programming LCS (Longest Common Subsequence) diff engine
function computeLcsDiff(leftLines: string[], rightLines: string[], ignoreWhitespace = false, ignoreCase = false): DiffLine[] {
  const norm = (s: string) => {
    let res = s;
    if (ignoreWhitespace) res = res.trim();
    if (ignoreCase) res = res.toLowerCase();
    return res;
  };

  const m = leftLines.length;
  const n = rightLines.length;

  // Limit matrix size to avoid UI lock on huge multi-thousand line files
  if (m > 1200 || n > 1200) {
    // Fallback simple line-by-line comparison
    const max = Math.max(m, n);
    const result: DiffLine[] = [];
    for (let i = 0; i < max; i++) {
      const l = leftLines[i];
      const r = rightLines[i];
      if (l === r) {
        result.push({ type: 'equal', leftLine: l, leftLineNum: i + 1, rightLine: r, rightLineNum: i + 1 });
      } else {
        if (l !== undefined) result.push({ type: 'delete', leftLine: l, leftLineNum: i + 1 });
        if (r !== undefined) result.push({ type: 'insert', rightLine: r, rightLineNum: i + 1 });
      }
    }
    return result;
  }

  // DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (norm(leftLines[i - 1]) === norm(rightLines[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  let i = m;
  let j = n;
  const diff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && norm(leftLines[i - 1]) === norm(rightLines[j - 1])) {
      diff.unshift({
        type: 'equal',
        leftLine: leftLines[i - 1],
        leftLineNum: i,
        rightLine: rightLines[j - 1],
        rightLineNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: 'insert',
        rightLine: rightLines[j - 1],
        rightLineNum: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({
        type: 'delete',
        leftLine: leftLines[i - 1],
        leftLineNum: i,
      });
      i--;
    }
  }

  return diff;
}

const SAMPLE_LEFT_SQL = `-- Production Version (usp_rep_feeder_comm_datacoverage)
CREATE PROCEDURE [dbo].[usp_rep_name] 
    @ID NVARCHAR(MAX) = '499',
    @LoginHierarchyID INT = 1,
    @LoginOfficeID NVARCHAR(1000) = '',
    @LoginHESID NVARCHAR(1000) = 1,
    @RoleID INT = 1,
    @viewcount NVARCHAR(15) = '100',
    @offset INT = 0,
    @btntype INT = 1,
    @LoginRefID INT = 1,
    @OrgOrNetwork NVARCHAR(1) = 'O',
    @HierarchyID INT = 1,
    @OrgNetID BIGINT = 1,
    @DTRRatingID INT = 3,
    @DTRTypeID INT = 4,
    @FromDate DATE = '2025-10-28',
    @ToDate DATE = '2025-10-28',
    @MSN NVARCHAR(32) = '',
    @param1 INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FromDateSTART DATETIME, @ToDateEND DATETIME;
    SELECT @FromDateSTART = DATEADD(DAY, -1, @FromDate), 
           @ToDateEND = DATEADD(DAY, 1, @ToDate);

    -- Unoptimized query scanning whole table
    SELECT 
        m.MSN,
        m.MeterStatus,
        m.ReadDate
    FROM mis.dbo.T_Meter_Master m
    WHERE m.HierarchyID = @HierarchyID;
END`;

const SAMPLE_RIGHT_SQL = `-- Optimized Version (usp_rep_feeder_comm_datacoverage)
-- Refactored for Guideline #1 (NOLOCK) and Date Range Seek
CREATE OR ALTER PROCEDURE [dbo].[usp_rep_name] 
    @ID NVARCHAR(MAX) = '499',
    @LoginHierarchyID INT = 1,
    @LoginOfficeID NVARCHAR(1000) = '',
    @LoginHESID NVARCHAR(1000) = 1,
    @RoleID INT = 1,
    @viewcount NVARCHAR(15) = '100',
    @offset INT = 0,
    @btntype INT = 1,
    @LoginRefID INT = 1,
    @OrgOrNetwork NVARCHAR(1) = 'O',
    @HierarchyID INT = 1,
    @OrgNetID BIGINT = 1,
    @DTRRatingID INT = 3,
    @DTRTypeID INT = 4,
    @FromDate DATE = '2025-10-28',
    @ToDate DATE = '2025-10-28',
    @MSN NVARCHAR(32) = '',
    @param1 INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FromDateSTART DATETIME, @ToDateEND DATETIME;
    SELECT @FromDateSTART = DATEADD(DAY, -1, @FromDate), 
           @ToDateEND = DATEADD(DAY, 1, @ToDate);

    -- Optimized query with (NOLOCK) and indexed date boundary seek
    SELECT 
        m.MSN,
        m.MeterStatus,
        m.ReadDate,
        m.ActiveEnergy_kWh
    FROM mis.dbo.T_Meter_Master m (NOLOCK)
    WHERE m.HierarchyID = @HierarchyID
      AND m.ReadDate >= @FromDateSTART 
      AND m.ReadDate < @ToDateEND;
END`;

export const SqlComparePage: React.FC = () => {
  const [leftCode, setLeftCode] = useState<string>(SAMPLE_LEFT_SQL);
  const [rightCode, setRightCode] = useState<string>(SAMPLE_RIGHT_SQL);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(true);
  const [ignoreCase, setIgnoreCase] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  // Compute Diff
  const diffLines = useMemo(() => {
    const leftArr = leftCode.split('\n');
    const rightArr = rightCode.split('\n');
    return computeLcsDiff(leftArr, rightArr, ignoreWhitespace, ignoreCase);
  }, [leftCode, rightCode, ignoreWhitespace, ignoreCase]);

  // Statistics
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    diffLines.forEach((l) => {
      if (l.type === 'insert') added++;
      else if (l.type === 'delete') removed++;
      else unchanged++;
    });

    const total = added + removed + unchanged;
    const similarity = total > 0 ? Math.round((unchanged / total) * 100) : 100;

    return { added, removed, unchanged, total, similarity };
  }, [diffLines]);

  const handleSwap = () => {
    const temp = leftCode;
    setLeftCode(rightCode);
    setRightCode(temp);
  };

  const handleLoadSample = () => {
    setLeftCode(SAMPLE_LEFT_SQL);
    setRightCode(SAMPLE_RIGHT_SQL);
  };

  const handleClear = () => {
    setLeftCode('');
    setRightCode('');
  };

  const handleCopyDiffReport = () => {
    const report = `SQL Diff Summary:
Similarity: ${stats.similarity}%
Lines Added (+): ${stats.added}
Lines Removed (-): ${stats.removed}
Lines Unchanged: ${stats.unchanged}`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-emerald-100 dark:border-sql-border pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <GitCompare className="w-5 h-5" />
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                SQL Code Compare & Diff Analyzer
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Compare two SQL scripts, stored procedures, or DDL migrations side-by-side or unified to verify optimizations and detect regressions.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Load Sample SP Diff</span>
            </button>

            <button
              onClick={handleSwap}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-sql-border hover:bg-slate-100 dark:hover:bg-sql-card text-slate-600 dark:text-slate-300 transition-colors"
              title="Swap Left & Right Code"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-sql-border hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
              title="Clear both editors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar & Diff Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-white dark:bg-sql-card border border-slate-200 dark:border-sql-border shadow-xs">
        {/* Left: View Mode & Comparison Options */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-sql-surface p-1 rounded-lg border border-slate-200 dark:border-sql-border">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-sql-card text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                viewMode === 'unified'
                  ? 'bg-white dark:bg-sql-card text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Unified Diff</span>
            </button>
          </div>

          {/* Options checkboxes */}
          <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Ignore Whitespace</span>
          </label>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Case Insensitive</span>
          </label>
        </div>

        {/* Right: Diff Statistics Badges */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+{stats.added}</span>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20 font-bold">
            <MinusCircle className="w-3.5 h-3.5" />
            <span>-{stats.removed}</span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
            Match: <span className="font-bold text-slate-900 dark:text-white">{stats.similarity}%</span>
          </div>

          <button
            onClick={handleCopyDiffReport}
            className="inline-flex items-center space-x-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 ml-1 transition-colors"
            title="Copy diff stats summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Input Code Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-rose-500" />
              <span>Original Script (Left / Base / Old SP)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {leftCode.split('\n').length} lines
            </span>
          </div>
          <textarea
            rows={8}
            value={leftCode}
            onChange={(e) => setLeftCode(e.target.value)}
            className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-sql-border bg-white dark:bg-sql-card text-slate-900 dark:text-slate-100 focus:border-emerald-500 transition-colors shadow-2xs leading-relaxed"
            placeholder="Paste original SQL script here..."
            spellCheck={false}
          />
        </div>

        {/* Right Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Modified Script (Right / Target / New SP)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {rightCode.split('\n').length} lines
            </span>
          </div>
          <textarea
            rows={8}
            value={rightCode}
            onChange={(e) => setRightCode(e.target.value)}
            className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-sql-border bg-white dark:bg-sql-card text-slate-900 dark:text-slate-100 focus:border-emerald-500 transition-colors shadow-2xs leading-relaxed"
            placeholder="Paste modified SQL script here..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Visual Diff Output Viewer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Interactive Diff Inspector ({viewMode === 'split' ? 'Side-by-Side Comparison' : 'Unified Diff View'})
          </span>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500 inline-block" />
              <span className="text-slate-500">Added</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500 inline-block" />
              <span className="text-slate-500">Removed</span>
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-sql-border bg-white dark:bg-[#0c1017] overflow-hidden shadow-sm font-mono text-xs">
          {viewMode === 'split' ? (
            /* Split / Side-by-Side View */
            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-sql-border max-h-[600px] overflow-y-auto">
              {/* Left Column */}
              <div className="divide-y divide-slate-100 dark:divide-sql-border/40">
                {diffLines.map((line, idx) => {
                  if (line.type === 'insert') {
                    // Empty space on the left when an insertion occurred on the right
                    return (
                      <div key={idx} className="flex bg-slate-50/70 dark:bg-slate-900/30 px-3 py-1 text-slate-400 dark:text-slate-500 select-none">
                        <span className="w-8 shrink-0 text-slate-400 dark:text-slate-600 text-right pr-2">·</span>
                        <span className="italic text-[10px] text-slate-400 dark:text-slate-500">(blank)</span>
                      </div>
                    );
                  }
                  const isDeleted = line.type === 'delete';
                  return (
                    <div
                      key={idx}
                      className={`flex px-3 py-1 ${
                        isDeleted 
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-semibold' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-8 shrink-0 text-slate-400 dark:text-slate-600 text-right pr-2 select-none">
                        {line.leftLineNum}
                      </span>
                      <span className="w-4 shrink-0 text-center font-bold select-none text-rose-600">
                        {isDeleted ? '-' : ' '}
                      </span>
                      <pre className="flex-1 overflow-x-auto whitespace-pre font-mono">
                        {line.leftLine}
                      </pre>
                    </div>
                  );
                })}
              </div>

              {/* Right Column */}
              <div className="divide-y divide-slate-100 dark:divide-sql-border/40">
                {diffLines.map((line, idx) => {
                  if (line.type === 'delete') {
                    // Empty space on right when a deletion occurred on left
                    return (
                      <div key={idx} className="flex bg-slate-50/70 dark:bg-slate-900/30 px-3 py-1 text-slate-400 dark:text-slate-500 select-none">
                        <span className="w-8 shrink-0 text-slate-400 dark:text-slate-600 text-right pr-2">·</span>
                        <span className="italic text-[10px] text-slate-400 dark:text-slate-500">(blank)</span>
                      </div>
                    );
                  }
                  const isInserted = line.type === 'insert';
                  return (
                    <div
                      key={idx}
                      className={`flex px-3 py-1 ${
                        isInserted 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-8 shrink-0 text-slate-400 dark:text-slate-600 text-right pr-2 select-none">
                        {line.rightLineNum}
                      </span>
                      <span className="w-4 shrink-0 text-center font-bold select-none text-emerald-600">
                        {isInserted ? '+' : ' '}
                      </span>
                      <pre className="flex-1 overflow-x-auto whitespace-pre font-mono">
                        {line.rightLine}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Unified View */
            <div className="divide-y divide-slate-100 dark:divide-sql-border/40 max-h-[600px] overflow-y-auto">
              {diffLines.map((line, idx) => {
                if (line.type === 'equal') {
                  return (
                    <div key={idx} className="flex px-3 py-1 text-slate-700 dark:text-slate-300">
                      <span className="w-8 shrink-0 text-slate-400 dark:text-slate-600 text-right pr-2 select-none">
                        {line.leftLineNum}
                      </span>
                      <span className="w-8 shrink-0 text-slate-400 dark:text-slate-600 text-right pr-2 select-none">
                        {line.rightLineNum}
                      </span>
                      <span className="w-4 shrink-0 text-slate-400 text-center select-none"> </span>
                      <pre className="flex-1 overflow-x-auto whitespace-pre font-mono">
                        {line.leftLine}
                      </pre>
                    </div>
                  );
                }
                if (line.type === 'delete') {
                  return (
                    <div key={idx} className="flex px-3 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-semibold">
                      <span className="w-8 shrink-0 text-rose-400 dark:text-rose-600 text-right pr-2 select-none">
                        {line.leftLineNum}
                      </span>
                      <span className="w-8 shrink-0 text-slate-300 dark:text-slate-700 text-right pr-2 select-none">
                        -
                      </span>
                      <span className="w-4 shrink-0 text-rose-600 font-bold text-center select-none">-</span>
                      <pre className="flex-1 overflow-x-auto whitespace-pre font-mono">
                        {line.leftLine}
                      </pre>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="flex px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold">
                    <span className="w-8 shrink-0 text-slate-300 dark:text-slate-700 text-right pr-2 select-none">
                      -
                    </span>
                    <span className="w-8 shrink-0 text-emerald-400 dark:text-emerald-600 text-right pr-2 select-none">
                      {line.rightLineNum}
                    </span>
                    <span className="w-4 shrink-0 text-emerald-600 font-bold text-center select-none">+</span>
                    <pre className="flex-1 overflow-x-auto whitespace-pre font-mono">
                      {line.rightLine}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
