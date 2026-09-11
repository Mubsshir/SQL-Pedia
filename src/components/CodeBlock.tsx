import React, { useState, useMemo } from 'react';
import { Copy, Check, Maximize2, Minimize2, Download, WrapText } from 'lucide-react';
import { tokenizeSql, getTokenClass } from '../utils/sqlHighlighter';

interface CodeBlockProps {
  sql?: string;
  code?: string;
  language?: string;
  title?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  sql,
  code,
  language = 'sql',
  title,
  maxHeight = '500px',
  showLineNumbers = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  const activeContent = code !== undefined ? code : (sql || '');
  const lines = useMemo(() => activeContent.trim().split('\n'), [activeContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownload = () => {
    const ext = language === 'json' ? 'json' : 'sql';
    const filename = (title ? title.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'script') + '.' + ext;
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-lg border border-sql-border bg-sql-surface overflow-hidden shadow-xl ${className}`}>
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e121d] border-b border-sql-border text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="font-mono text-slate-300 ml-2 font-medium">
            {title ? title : (language === 'json' ? 'Payload.json' : 'T-SQL Script.sql')}
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
            {lines.length} lines
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
            className={`p-1.5 rounded transition-colors ${wordWrap ? 'bg-sky-500/20 text-sky-300' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Download SQL File */}
          <button
            onClick={handleDownload}
            title="Download .sql file"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse height" : "Expand to fit"}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded font-medium transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div
        className="overflow-auto font-mono text-sm leading-6 select-text"
        style={{ maxHeight: isExpanded ? 'none' : maxHeight }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, lineIndex) => {
              const tokens = tokenizeSql(line);
              return (
                <tr key={lineIndex} className="hover:bg-slate-800/30 transition-colors">
                  {showLineNumbers && (
                    <td className="w-12 py-0.5 pr-4 pl-3 text-right select-none text-slate-600 text-xs font-mono border-r border-sql-border/60 bg-[#0c101a]/50">
                      {lineIndex + 1}
                    </td>
                  )}
                  <td className={`py-0.5 pl-4 pr-4 ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
                    {tokens.length === 0 ? (
                      <span>&nbsp;</span>
                    ) : (
                      tokens.map((token, tokenIdx) => (
                        <span key={tokenIdx} className={getTokenClass(token.type)}>
                          {token.value}
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
