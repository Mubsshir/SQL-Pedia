import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { RiskLevel } from '../types';

interface WarningBannerProps {
  risk: RiskLevel;
  warnings?: string[];
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ risk, warnings }) => {
  if (risk === 'safe' && (!warnings || warnings.length === 0)) {
    return (
      <div className="flex items-start space-x-3 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-emerald-300">Safe / Read-Only Operation</span>
          <span className="text-emerald-400/80 text-xs">
            This query reads metadata or DMVs without holding exclusive locks or modifying underlying data.
          </span>
        </div>
      </div>
    );
  }

  if (risk === 'caution') {
    return (
      <div className="flex items-start space-x-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-950/25 text-amber-200 text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-amber-300">Caution / Resource Impact</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Verify Before Running
            </span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            This operation modifies schema, runs maintenance, or alters rows. Verify table names, index sizes, and execution timing before running on production servers.
          </p>
          {warnings && warnings.length > 0 && (
            <ul className="list-disc list-inside text-xs space-y-1 pt-1 text-amber-300/90">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 p-3.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-200 text-sm">
      <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-rose-300">⚠️ Destructive Operation</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300">
            High Risk
          </span>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed">
          Permanent data deletion or session termination. Always verify targeted rows using a <code>SELECT</code> query first, ensure current backups exist, and run inside an explicit transaction where applicable.
        </p>
        {warnings && warnings.length > 0 && (
          <ul className="list-disc list-inside text-xs space-y-1 pt-1 text-rose-300/90 font-medium">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
