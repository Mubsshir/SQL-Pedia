import React, { useState, useMemo } from 'react';
import { 
  FileJson, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  Database,
  ArrowRight
} from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';

const SAMPLE_PAYLOADS = {
  meterRead: {
    name: 'Smart Meter Reading (MDMS/AMI)',
    json: JSON.stringify({
      meterSerialNo: "MTR-98214",
      deviceType: "3-Phase-Smart-Meter",
      readTimestamp: "2026-09-11T12:00:00Z",
      metrics: {
        activeEnergyImport_kWh: 1420.55,
        activeEnergyExport_kWh: 0.00,
        reactiveEnergyLead_kVARh: 42.18,
        reactiveEnergyLag_kVARh: 88.31,
        voltage_V: 231.4,
        current_A: 14.8,
        powerFactor: 0.96,
        frequency_Hz: 50.02
      },
      statusFlags: {
        powerFailure: false,
        tamperDetected: false,
        relayState: "CONNECTED"
      }
    }, null, 2)
  },
  hesEvent: {
    name: 'HES Alarm & Event Payload',
    json: JSON.stringify({
      eventId: 499120,
      hesId: "HES-NORTH-01",
      meterNo: "MTR-98214",
      eventCode: "EVT_POWER_RESTORE",
      severity: "INFO",
      eventTime: "2026-09-11T11:45:10Z",
      loggedTime: "2026-09-11T11:45:14Z",
      parameters: [
        { key: "durationSeconds", value: 340 },
        { key: "terminalCoverOpen", value: 0 }
      ]
    }, null, 2)
  },
  hierarchyConfig: {
    name: 'Office Hierarchy Config',
    json: JSON.stringify({
      hierarchyId: 1,
      orgOrNetwork: "O",
      officeId: 1042,
      officeName: "Gurugram Central Substation",
      dtrRatingId: 3,
      dtrTypeId: 4,
      feedersCount: 18,
      isActive: true
    }, null, 2)
  }
};

export const JsonFormatterPage: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>(SAMPLE_PAYLOADS.meterRead.json);
  const [indentSize, setIndentSize] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'formatted' | 'openjson'>('formatted');
  const [copied, setCopied] = useState(false);

  // Validation & Parsing
  const validation = useMemo(() => {
    if (!inputJson.trim()) {
      return { isValid: false, error: 'Input is empty', data: null };
    }
    try {
      const parsed = JSON.parse(inputJson);
      return { isValid: true, error: null, data: parsed };
    } catch (err: any) {
      return { isValid: false, error: err.message || 'Invalid JSON syntax', data: null };
    }
  }, [inputJson]);

  // Formatted Output
  const formattedJson = useMemo(() => {
    if (!validation.isValid || !validation.data) return '';
    return JSON.stringify(validation.data, null, indentSize);
  }, [validation, indentSize]);

  // Minified Output
  const handleMinify = () => {
    if (!validation.isValid || !validation.data) return;
    setInputJson(JSON.stringify(validation.data));
  };

  // Format In-Place
  const handleFormatInPlace = (spaces: number) => {
    if (!validation.isValid || !validation.data) return;
    setIndentSize(spaces);
    setInputJson(JSON.stringify(validation.data, null, spaces));
  };

  // Generate T-SQL OPENJSON WITH Script
  const openJsonSql = useMemo(() => {
    if (!validation.isValid || !validation.data) {
      return '-- Please provide valid JSON above to generate T-SQL OPENJSON schema';
    }

    const inferSqlType = (val: any): string => {
      if (typeof val === 'number') {
        if (Number.isInteger(val)) return 'INT';
        return 'DECIMAL(18, 4)';
      }
      if (typeof val === 'boolean') return 'BIT';
      if (typeof val === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(val)) return 'DATETIME2';
        if (val.length > 50) return 'NVARCHAR(MAX)';
        return 'NVARCHAR(100)';
      }
      if (typeof val === 'object' && val !== null) {
        return 'NVARCHAR(MAX) AS JSON';
      }
      return 'NVARCHAR(200)';
    };

    const lines: string[] = [];
    const buildWithColumns = (obj: Record<string, any>, prefix = '$') => {
      Object.entries(obj).forEach(([key, val]) => {
        const sqlType = inferSqlType(val);
        const jsonPath = `${prefix}.${key}`;
        lines.push(`        [${key}] ${sqlType} '${jsonPath}'`);
      });
    };

    const targetObj = Array.isArray(validation.data) ? validation.data[0] || {} : validation.data;
    if (typeof targetObj === 'object' && targetObj !== null) {
      buildWithColumns(targetObj);
    }

    const withClause = lines.length > 0 
      ? `WITH (\n${lines.join(',\n')}\n    );`
      : ';';

    return `-- =============================================
-- Auto-generated T-SQL OPENJSON Query
-- Target Database: mis / mdms_stg
-- Company Standard JSON Ingestion Pattern
-- =============================================
DECLARE @jsonPayload NVARCHAR(MAX) = N'${inputJson.replace(/'/g, "''")}';

-- Verify JSON validity before execution (SQL Server 2016+)
IF (ISJSON(@jsonPayload) > 0)
BEGIN
    SELECT 
${lines.map(l => '        ' + l.trim().split(' ')[0]).join(',\n')}
    FROM OPENJSON(@jsonPayload)
    ${withClause}
END
ELSE
BEGIN
    RAISERROR('Invalid JSON string passed to @jsonPayload', 16, 1);
END
GO`;
  }, [validation, inputJson]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = activeTab === 'formatted' ? formattedJson : openJsonSql;
    const extension = activeTab === 'formatted' ? 'json' : 'sql';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payload_${Date.now()}.${extension}`;
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
              <FileJson className="w-5 h-5" />
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                JSON Formatter & T-SQL OPENJSON Generator
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Beautify, validate, minify smart meter payloads and instantly generate SQL Server <code>OPENJSON(...) WITH (...)</code> queries.
            </p>
          </div>

          {/* Sample Loaders */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Samples:</span>
            {Object.entries(SAMPLE_PAYLOADS).map(([key, sample]) => (
              <button
                key={key}
                onClick={() => setInputJson(sample.json)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-sql-card border border-slate-200 dark:border-sql-border hover:border-emerald-500 hover:text-emerald-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
              >
                {sample.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-sql-card border border-slate-200 dark:border-sql-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Format buttons */}
          <button
            onClick={() => handleFormatInPlace(2)}
            disabled={!validation.isValid}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            Format (2 Spaces)
          </button>
          <button
            onClick={() => handleFormatInPlace(4)}
            disabled={!validation.isValid}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-sql-surface text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-sql-border hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Format (4 Spaces)
          </button>
          <button
            onClick={handleMinify}
            disabled={!validation.isValid}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-sql-surface text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-sql-border hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Minify (Compact)
          </button>

          <button
            onClick={() => setInputJson('')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors ml-1"
            title="Clear editor"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-3">
          {validation.isValid ? (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Valid JSON ({inputJson.length.toLocaleString()} chars)</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-500/30">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Syntax Error</span>
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={() => handleCopy(activeTab === 'formatted' ? formattedJson : openJsonSql)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-sql-border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-sql-surface transition-colors"
            title="Download result"
          >
            <Download className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* Main Dual Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Textarea */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Input JSON String / Payload
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Paste raw JSON here
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={22}
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="w-full p-4 font-mono text-xs rounded-xl border border-slate-300 dark:border-sql-border bg-white dark:bg-sql-card text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-2xs leading-relaxed"
              placeholder='Paste JSON here, e.g. {"meterNo": "MTR123"}'
              spellCheck={false}
            />

            {!validation.isValid && validation.error && (
              <div className="mt-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-mono">
                <strong>Error:</strong> {validation.error}
              </div>
            )}
          </div>
        </div>

        {/* Right: Output Tabs (Formatted JSON vs T-SQL OPENJSON) */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between px-1">
            {/* View Switcher Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('formatted')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'formatted'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-sql-card text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Beautified JSON
              </button>
              <button
                onClick={() => setActiveTab('openjson')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'openjson'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-sql-card text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>T-SQL OPENJSON Query</span>
                <span className="text-[9px] bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300 px-1 py-0.2 rounded font-mono">
                  Smart Grid
                </span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {activeTab === 'formatted' ? 'Formatted' : 'T-SQL 2016+'}
            </span>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-sql-border shadow-xs">
            {activeTab === 'formatted' ? (
              <CodeBlock
                code={formattedJson || '// Valid formatted JSON will appear here'}
                language="json"
                title="formatted_payload.json"
              />
            ) : (
              <CodeBlock
                code={openJsonSql}
                language="sql"
                title="openjson_ingestion.sql"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
