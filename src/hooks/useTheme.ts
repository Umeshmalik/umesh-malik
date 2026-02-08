import { useState, useEffect, useCallback } from 'react';

export type ThemeId = 'win95' | 'macos9' | 'linux';

export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  titleBarBg: string;
  titleBarText: string;
  buttonFace: string;
  borderLight: string;
  borderDark: string;
  borderDarkest: string;
  windowBg: string;
  desktopBg: string;
  textColor: string;
  fontFamily: string;
  titleFont: string;
  titleBarStyle: 'gradient' | 'flat' | 'none';
  closeSymbol: string;
  minSymbol: string;
  maxSymbol: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  win95: {
    id: 'win95',
    name: 'Windows 95',
    icon: '🪟',
    titleBarBg: 'linear-gradient(90deg, #000080, #1084d0)',
    titleBarText: '#ffffff',
    buttonFace: '#c0c0c0',
    borderLight: '#ffffff',
    borderDark: '#808080',
    borderDarkest: '#000000',
    windowBg: '#c0c0c0',
    desktopBg: '#008080',
    textColor: '#000000',
    fontFamily: "'IBM Plex Mono', monospace",
    titleFont: "'IBM Plex Mono', monospace",
    titleBarStyle: 'gradient',
    closeSymbol: 'X',
    minSymbol: '_',
    maxSymbol: '□',
  },
  macos9: {
    id: 'macos9',
    name: 'Mac OS 9',
    icon: '🍎',
    titleBarBg: 'linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 50%, #a0a0a0 100%)',
    titleBarText: '#000000',
    buttonFace: '#dddddd',
    borderLight: '#ffffff',
    borderDark: '#999999',
    borderDarkest: '#666666',
    windowBg: '#dddddd',
    desktopBg: '#5f6b8d',
    textColor: '#000000',
    fontFamily: "'IBM Plex Mono', monospace",
    titleFont: "'IBM Plex Mono', monospace",
    titleBarStyle: 'flat',
    closeSymbol: '●',
    minSymbol: '–',
    maxSymbol: '+',
  },
  linux: {
    id: 'linux',
    name: 'Linux Terminal',
    icon: '🐧',
    titleBarBg: '#1a1a1a',
    titleBarText: '#00ff41',
    buttonFace: '#0a0a0a',
    borderLight: '#333333',
    borderDark: '#111111',
    borderDarkest: '#000000',
    windowBg: '#0a0a0a',
    desktopBg: '#0a0a0a',
    textColor: '#00ff41',
    fontFamily: "'VT323', monospace",
    titleFont: "'VT323', monospace",
    titleBarStyle: 'flat',
    closeSymbol: 'x',
    minSymbol: '-',
    maxSymbol: '□',
  },
};

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>('win95');

  useEffect(() => {
    const saved = localStorage.getItem('umesh-os-theme') as ThemeId | null;
    if (saved && THEMES[saved]) {
      setThemeId(saved);
    }
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem('umesh-os-theme', id);

    // Apply CSS custom properties
    const theme = THEMES[id];
    const root = document.documentElement;
    root.style.setProperty('--win-bg', theme.desktopBg);
    root.style.setProperty('--win-taskbar', theme.buttonFace);
    root.style.setProperty('--win-button-face', theme.buttonFace);
    root.style.setProperty('--win-border-light', theme.borderLight);
    root.style.setProperty('--win-border-dark', theme.borderDark);
    root.style.setProperty('--win-border-darkest', theme.borderDarkest);
    root.style.setProperty('--win-text', theme.textColor);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    const theme = THEMES[themeId];
    const root = document.documentElement;
    root.style.setProperty('--win-bg', theme.desktopBg);
    root.style.setProperty('--win-taskbar', theme.buttonFace);
    root.style.setProperty('--win-button-face', theme.buttonFace);
    root.style.setProperty('--win-border-light', theme.borderLight);
    root.style.setProperty('--win-border-dark', theme.borderDark);
    root.style.setProperty('--win-border-darkest', theme.borderDarkest);
    root.style.setProperty('--win-text', theme.textColor);
  }, [themeId]);

  return {
    themeId,
    theme: THEMES[themeId],
    setTheme,
    allThemes: Object.values(THEMES),
  };
}
