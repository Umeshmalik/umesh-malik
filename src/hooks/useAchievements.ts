import { useState, useCallback, useEffect } from 'react';
import type { Achievement } from '../data/achievements';
import { achievements } from '../data/achievements';

const STORAGE_KEY = 'umesh-os-achievements';

function getUnlocked(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUnlocked(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useAchievements() {
  const [unlockedIds, setUnlockedIds] = useState<string[]>(getUnlocked);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    setUnlockedIds(getUnlocked());
  }, []);

  const unlock = useCallback(
    (id: string) => {
      if (unlockedIds.includes(id)) return;
      const achievement = achievements.find((a) => a.id === id);
      if (!achievement) return;
      const updated = [...unlockedIds, id];
      setUnlockedIds(updated);
      saveUnlocked(updated);
      setNewAchievement(achievement);
      setTimeout(() => setNewAchievement(null), 4000);
    },
    [unlockedIds]
  );

  const isUnlocked = useCallback((id: string) => unlockedIds.includes(id), [unlockedIds]);

  return { unlockedIds, unlock, isUnlocked, newAchievement, allAchievements: achievements };
}

// Global unlock function for non-React contexts
export function unlockAchievement(id: string) {
  const current = getUnlocked();
  if (current.includes(id)) return null;
  const achievement = achievements.find((a) => a.id === id);
  if (!achievement) return null;
  const updated = [...current, id];
  saveUnlocked(updated);
  // Dispatch custom event for React listeners
  window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: achievement }));
  return achievement;
}
