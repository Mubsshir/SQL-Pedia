import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { QueryParameter } from '../types';

interface ParameterEditorProps {
  parameters: QueryParameter[];
  values: Record<string, string>;
  onChange: (paramName: string, value: string) => void;
  onReset: () => void;
}

export const ParameterEditor: React.FC<ParameterEditorProps> = ({
  parameters,
  values,
  onChange,
  onReset,
}) => {
  if (!parameters || parameters.length === 0) return null;

  return (
    <div className="rounded-lg border border-sql-border bg-sql-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-sql-border/60 pb-2">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive Query Parameters</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset to default placeholders"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {parameters.map((param) => (
          <div key={param.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-mono text-slate-300 font-medium">
                {param.name}
              </label>
              <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {param.description}
              </span>
            </div>
            <input
              type="text"
              value={values[param.name] ?? param.defaultValue}
              onChange={(e) => onChange(param.name, e.target.value)}
              placeholder={param.placeholder}
              className="w-full bg-[#0a0d16] border border-sql-borderLight rounded px-3 py-1.5 text-xs font-mono text-sky-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
