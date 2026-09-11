import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'K'], mac: ['⌘', 'K'], desc: 'Open global search from anywhere' },
    { keys: ['Esc'], mac: ['Esc'], desc: 'Close modals, search, or dialogs' },
    { keys: ['?'], mac: ['?'], desc: 'Toggle keyboard shortcuts reference' },
    { keys: ['↑', '↓'], mac: ['↑', '↓'], desc: 'Navigate search results' },
    { keys: ['Enter'], mac: ['Enter'], desc: 'Select active search result' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#111522] border border-emerald-200 dark:border-sql-border rounded-xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-emerald-100 dark:border-sql-border">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold text-base">
            <Keyboard className="w-5 h-5 text-emerald-600 dark:text-sky-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-sql-border/60 py-2">
          {shortcuts.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3">
              <span className="text-xs text-slate-700 dark:text-slate-300">{item.desc}</span>
              <div className="flex items-center space-x-1">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-1 text-xs font-mono font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-emerald-100 dark:border-sql-border text-center">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

