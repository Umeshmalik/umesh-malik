import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'umesh-os-sound';

// Simple beep using Web Audio API (no external files needed)
function createBeep(frequency: number, duration: number, volume: number = 0.1) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    gainNode.gain.value = volume;
    oscillator.start(ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setSoundEnabled(stored === 'true');
    }
  }, []);

  const toggle = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    createBeep(800, 0.05, 0.08);
  }, [soundEnabled]);

  const playType = useCallback(() => {
    if (!soundEnabled) return;
    createBeep(600 + Math.random() * 200, 0.03, 0.05);
  }, [soundEnabled]);

  const playBoot = useCallback(() => {
    if (!soundEnabled) return;
    createBeep(440, 0.15, 0.1);
    setTimeout(() => createBeep(554, 0.15, 0.1), 150);
    setTimeout(() => createBeep(659, 0.15, 0.1), 300);
    setTimeout(() => createBeep(880, 0.3, 0.1), 450);
  }, [soundEnabled]);

  const playError = useCallback(() => {
    if (!soundEnabled) return;
    createBeep(200, 0.3, 0.1);
  }, [soundEnabled]);

  const playAchievement = useCallback(() => {
    if (!soundEnabled) return;
    createBeep(523, 0.1, 0.08);
    setTimeout(() => createBeep(659, 0.1, 0.08), 100);
    setTimeout(() => createBeep(784, 0.1, 0.08), 200);
    setTimeout(() => createBeep(1047, 0.2, 0.08), 300);
  }, [soundEnabled]);

  const playWindowOpen = useCallback(() => {
    if (!soundEnabled) return;
    createBeep(400, 0.08, 0.06);
    setTimeout(() => createBeep(600, 0.08, 0.06), 80);
  }, [soundEnabled]);

  const playWindowClose = useCallback(() => {
    if (!soundEnabled) return;
    createBeep(600, 0.08, 0.06);
    setTimeout(() => createBeep(400, 0.08, 0.06), 80);
  }, [soundEnabled]);

  return {
    soundEnabled,
    toggle,
    playClick,
    playType,
    playBoot,
    playError,
    playAchievement,
    playWindowOpen,
    playWindowClose,
  };
}
