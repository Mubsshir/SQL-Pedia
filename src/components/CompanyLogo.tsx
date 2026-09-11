import React from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* Company Emblem */}
      <div className={`${icon} shrink-0 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-white dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-600/30 shadow-xs`}>
        <img
          src="/company-logo.svg"
          alt="Company Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Company Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none select-none">
          <div className="flex items-center space-x-1.5">
            <span className={`${text} font-bold tracking-tight text-slate-900 dark:text-white font-sans lowercase`}>
              company
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white shadow-xs">
              SQL
            </span>
          </div>
          <span className={`${sub} uppercase tracking-[0.25em] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5`}>
            enterprise
          </span>
        </div>
      )}
    </div>
  );
};
