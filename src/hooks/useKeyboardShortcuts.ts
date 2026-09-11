import { useEffect } from 'react';

interface ShortcutOptions {
  onOpenSearch?: () => void;
  onCloseModal?: () => void;
  onOpenShortcuts?: () => void;
}

export function useKeyboardShortcuts({
  onOpenSearch,
  onCloseModal,
  onOpenShortcuts,
}: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }

      // Check for Esc
      if (e.key === 'Escape') {
        onCloseModal?.();
        return;
      }

      // Check for ? to open shortcuts help if not in an input/textarea
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (!isInput && e.key === '?') {
        e.preventDefault();
        onOpenShortcuts?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch, onCloseModal, onOpenShortcuts]);
}
