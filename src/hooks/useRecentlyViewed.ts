import { useState, useEffect } from 'react';

const RECENT_KEY = 'tsql_toolkit_recent';

export interface RecentItem {
  id: string;
  timestamp: number;
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentItem[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial recent items so dashboard immediately looks populated
    const now = Date.now();
    return [
      { id: 'index-fragmentation', timestamp: now - 120 * 1000 },
      { id: 'partition-information', timestamp: now - 900 * 1000 },
      { id: 'active-queries', timestamp: now - 3600 * 1000 },
      { id: 'find-tables-with-column', timestamp: now - 7200 * 1000 }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch (e) {
      console.error(e);
    }
  }, [recent]);

  const addRecent = (id: string) => {
    setRecent(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return [{ id, timestamp: Date.now() }, ...filtered].slice(0, 20);
    });
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  return { recent, addRecent, clearRecent };
}
