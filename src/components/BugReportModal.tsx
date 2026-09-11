import React, { useState } from 'react';
import { 
  X, 
  Bug, 
  User, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [toolName, setToolName] = useState('General Platform / Query Snippet');
  const [issueSummary, setIssueSummary] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const developerName = 'Mubasshir Khan';
  const developerEmail = 'mubasshir.khan@company.com';
  const githubRepoIssues = 'https://github.com/Mubsshir/SQL-Pedia/issues';

  const bugReportTemplate = `[SQL Toolkit Bug Report]
Developer / Maintainer: ${developerName}
Affected Component: ${toolName}
Summary: ${issueSummary || '(Brief summary of the issue)'}

Expected Behavior:
${issueDetails || '(Describe what should happen, SQL errors encountered, or requested improvements)'}

Environment:
- Browser: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}
`;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(bugReportTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(developerEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111522] border border-emerald-200 dark:border-sql-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 dark:border-sql-border bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bug Report & Developer Info
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Contact & issue tracking for Company SQL Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Developer Attribution Card */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-[#0d121c] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm border border-emerald-300 dark:border-emerald-600/40">
                MK
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {developerName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-semibold">
                    Lead Developer
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  SQL Engineering, Stored Procedures & Platform Maintenance
                </p>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-sql-border bg-white dark:bg-sql-card text-slate-700 dark:text-slate-300 hover:text-emerald-700 transition-colors shadow-2xs font-mono text-[11px]"
                title="Copy developer email"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{copiedEmail ? 'Copied' : 'Email'}</span>
              </button>

              <a
                href={githubRepoIssues}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors text-[11px]"
                title="Open GitHub Issues"
              >
                <span>GitHub Issues</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Report Form / Template Generator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Bug Report & Feedback Generator</span>
              </label>
              <span className="text-[10px] text-slate-400">Copy & send to developer</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Affected Feature / Procedure
                </label>
                <select
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface text-slate-800 dark:text-slate-200 text-xs focus:border-emerald-500 transition-colors"
                >
                  <option value="General Platform / Query Snippet">General Platform / Query Snippet</option>
                  <option value="Boilerplate SP Generator (usp_rep_* / usp_import_*)">Boilerplate SP Generator (usp_rep_* / usp_import_*)</option>
                  <option value="SQL Code Compare Tool">SQL Code Compare Tool</option>
                  <option value="JSON Formatter & OPENJSON Generator">JSON Formatter & OPENJSON Generator</option>
                  <option value="DB Guidelines Document / Table Aliases">DB Guidelines Document / Table Aliases</option>
                  <option value="SQL Playground & Formatter">SQL Playground & Formatter</option>
                  <option value="Partition Toolkit / DMVs">Partition Toolkit / DMVs</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  value={issueSummary}
                  onChange={(e) => setIssueSummary(e.target.value)}
                  placeholder="e.g. Parameter @ToDate in usp_rep_feeder needs validation check"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface text-slate-800 dark:text-slate-200 text-xs focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Steps to Reproduce / Expected Behavior
                </label>
                <textarea
                  rows={3}
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  placeholder="Describe what occurred, any error messages, or what you would like improved..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-sql-border bg-slate-50 dark:bg-sql-surface text-slate-800 dark:text-slate-200 text-xs focus:border-emerald-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Copy Action */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-sql-border">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Ready to paste in Teams, Slack, or Email
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Template!' : 'Copy Bug Report'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-emerald-100 dark:border-sql-border bg-slate-50/80 dark:bg-[#0c0f18] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>Developer: <strong className="text-slate-800 dark:text-slate-200">{developerName}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
