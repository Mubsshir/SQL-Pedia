import { useState, useEffect } from 'react';

const CHECKLIST_KEY = 'tsql_toolkit_checklist';

export function useChecklist() {
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checkedIds));
    } catch (e) {
      console.error(e);
    }
  }, [checkedIds]);

  const toggleItem = (id: string) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isChecked = (id: string) => checkedIds.includes(id);

  const resetChecklist = () => {
    setCheckedIds([]);
    localStorage.removeItem(CHECKLIST_KEY);
  };

  return { checkedIds, toggleItem, isChecked, resetChecklist };
}
