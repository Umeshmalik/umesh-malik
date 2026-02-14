import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import BootSequence from './boot/BootSequence';
import Taskbar from './desktop/Taskbar';
import type { OpenWindow } from './desktop/Taskbar';
import DesktopIcon from './desktop/DesktopIcon';
import ContextMenu from './desktop/ContextMenu';
import DraggableWindow from './windows/DraggableWindow';
import AchievementToast from './ui/AchievementToast';
import Clippy from './ui/Clippy';
import CommandPalette from './ui/CommandPalette';
import HireMeBadge from './ui/HireMeBadge';
import PrintDialog from './ui/PrintDialog';
import MatrixRain from './effects/MatrixRain';
import ScreenSaver from './effects/ScreenSaver';
import ShutdownScreen from './effects/ShutdownScreen';
import Terminal from './terminal/Terminal';
import Snake from './games/Snake';
import AboutContent from './pages/AboutContent';
import ExperienceContent from './pages/ExperienceContent';
import ProjectsContent from './pages/ProjectsContent';
import ContactContent from './pages/ContactContent';
import GitHubContent from './pages/GitHubContent';
import NotepadContent from './pages/NotepadContent';
import CodePlayground from './pages/CodePlayground';
import KeyboardHelp from './pages/KeyboardHelp';
import SystemProperties from './pages/SystemProperties';

// Lazy-load Three.js components to reduce initial bundle size (~1MB+ savings)
const FloatingShapes = lazy(() => import('./three/FloatingShapes'));
const SkillGalaxy = lazy(() => import('./three/SkillGalaxy'));
import { useCRT } from '../hooks/useCRT';
import { useSound } from '../hooks/useSound';
import { useAchievements } from '../hooks/useAchievements';
import { useKonamiCode } from '../hooks/useKonamiCode';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { getTimeGreeting, getDesktopTint, getTimePeriod } from '../data/dynamic';
import { useTheme, type ThemeId } from '../hooks/useTheme';
import ThemePicker from './ui/ThemePicker';

// App definitions
interface AppDef {
  id: string;
  title: string;
  icon: string;
  label: string;
  width: number;
  height: number;
  showOnDesktop?: boolean;
}

const APP_DEFS: AppDef[] = [
  { id: 'about', title: 'about.exe - Umesh Malik', icon: '👤', label: 'about.exe', width: 700, height: 520, showOnDesktop: true },
  { id: 'experience', title: 'career.exe - Experience', icon: '💼', label: 'career.exe', width: 750, height: 550, showOnDesktop: true },
  { id: 'projects', title: 'projects.exe - File Explorer', icon: '📁', label: 'projects.exe', width: 750, height: 520, showOnDesktop: true },
  { id: 'skills', title: 'skills.exe - Skill Galaxy', icon: '🌌', label: 'skills.exe', width: 800, height: 560, showOnDesktop: true },
  { id: 'contact', title: 'mail.exe - umesh.OS Mail', icon: '📧', label: 'mail.exe', width: 700, height: 500, showOnDesktop: true },
  { id: 'github', title: 'github.exe - System Monitor', icon: '🐙', label: 'github.exe', width: 600, height: 480, showOnDesktop: true },
  { id: 'terminal', title: 'terminal.exe', icon: '💻', label: 'terminal.exe', width: 650, height: 420, showOnDesktop: true },
  { id: 'snake', title: 'snake.exe', icon: '🐍', label: 'snake.exe', width: 420, height: 480, showOnDesktop: false },
  { id: 'notepad', title: 'notepad.exe - Blog', icon: '📝', label: 'notepad.exe', width: 680, height: 520, showOnDesktop: true },
  { id: 'code', title: 'code.exe - Playground', icon: '🧪', label: 'code.exe', width: 800, height: 520, showOnDesktop: true },
  { id: 'keyboard', title: 'keyboard.exe - Shortcuts', icon: '⌨️', label: 'keyboard.exe', width: 500, height: 400, showOnDesktop: false },
  { id: 'system', title: 'System Properties', icon: '🖥️', label: 'sysinfo.exe', width: 480, height: 540, showOnDesktop: false },
  { id: 'theme', title: 'Display Properties', icon: '🎨', label: 'themes.exe', width: 400, height: 380, showOnDesktop: false },
  { id: 'print', title: 'print.exe', icon: '🖨️', label: 'print.exe', width: 0, height: 0, showOnDesktop: true },
];

const DESKTOP_APPS = APP_DEFS.filter((a) => a.showOnDesktop);

interface WindowState {
  id: string;
  zIndex: number;
  minimized: boolean;
}

export default function DesktopApp({ currentPage }: { currentPage?: string }) {
  const [booted, setBooted] = useState(false);
  const [openWindowIds, setOpenWindowIds] = useState<WindowState[]>([]);
  const [nextZ, setNextZ] = useState(1000);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showShutdown, setShowShutdown] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, open: false });
  const { crtEnabled, toggle: toggleCRT } = useCRT();
  const { soundEnabled, toggle: toggleSound, playBoot, playClick, playWindowOpen, playWindowClose } = useSound();
  const { unlock, newAchievement } = useAchievements();
  const { isIdle, dismiss: dismissIdle } = useIdleTimer(60000);
  const { themeId, theme, setTheme } = useTheme();

  // Time-based personalization
  const timePeriod = getTimePeriod();
  const desktopBg = themeId === 'win95' ? getDesktopTint() : theme.desktopBg;
  const greeting = getTimeGreeting();

  // Night owl achievement
  useEffect(() => {
    if (timePeriod === 'night' && booted) {
      unlock('night-owl');
    }
  }, [timePeriod, booted, unlock]);

  // Check if already booted
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasBooted = sessionStorage.getItem('umesh-os-booted');
    if (hasBooted) setBooted(true);
  }, []);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
    sessionStorage.setItem('umesh-os-booted', 'true');
    playBoot();
    unlock('first-boot');
  }, [playBoot, unlock]);

  // Track visited apps for explorer achievement
  useEffect(() => {
    if (!booted) return;
    const key = 'umesh-os-visited-pages';
    const visited: string[] = JSON.parse(sessionStorage.getItem(key) || '["home"]');
    const allPages = ['home', 'about', 'experience', 'projects', 'skills', 'contact'];
    if (allPages.every((p) => visited.includes(p))) {
      unlock('explorer');
    }
  }, [booted, openWindowIds, unlock]);

  const trackVisit = useCallback((appId: string) => {
    const key = 'umesh-os-visited-pages';
    const visited: string[] = JSON.parse(sessionStorage.getItem(key) || '["home"]');
    if (!visited.includes(appId)) {
      visited.push(appId);
      sessionStorage.setItem(key, JSON.stringify(visited));
    }
    const allPages = ['home', 'about', 'experience', 'projects', 'skills', 'contact'];
    if (allPages.every((p) => visited.includes(p))) {
      unlock('explorer');
    }
  }, [unlock]);

  // Open an app
  const openApp = useCallback((appId: string) => {
    // Special case: print opens a dialog, not a window
    if (appId === 'print') {
      setShowPrintDialog(true);
      return;
    }

    playWindowOpen();
    trackVisit(appId);

    // If already open, restore & focus it
    const existing = openWindowIds.find((w) => w.id === appId);
    if (existing) {
      const z = nextZ + 1;
      setNextZ(z);
      setOpenWindowIds((prev) =>
        prev.map((w) => (w.id === appId ? { ...w, zIndex: z, minimized: false } : w))
      );
      return;
    }

    const z = nextZ + 1;
    setNextZ(z);
    setOpenWindowIds((prev) => [...prev, { id: appId, zIndex: z, minimized: false }]);

    if (appId === 'terminal') unlock('power-user');
  }, [openWindowIds, nextZ, playWindowOpen, trackVisit, unlock]);

  // Close an app
  const closeApp = useCallback((appId: string) => {
    playWindowClose();
    setOpenWindowIds((prev) => prev.filter((w) => w.id !== appId));
  }, [playWindowClose]);

  // Focus a window (bring to front + restore if minimized)
  const focusWindow = useCallback((appId: string) => {
    const z = nextZ + 1;
    setNextZ(z);
    setOpenWindowIds((prev) =>
      prev.map((w) => (w.id === appId ? { ...w, zIndex: z, minimized: false } : w))
    );
  }, [nextZ]);

  // Minimize a window
  const minimizeWindow = useCallback((appId: string) => {
    setOpenWindowIds((prev) =>
      prev.map((w) => (w.id === appId ? { ...w, minimized: true } : w))
    );
  }, []);

  // Konami code
  useKonamiCode(() => {
    setShowMatrix(true);
    unlock('hacker');
  });

  // Global keyboard shortcuts
  useEffect(() => {
    if (!booted) return;

    const handler = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        unlock('keyboard-warrior');
        return;
      }

      // Esc -> Close active window or command palette
      if (e.key === 'Escape') {
        if (showCommandPalette) {
          setShowCommandPalette(false);
          return;
        }
        // Close the top-most (highest z) window
        if (openWindowIds.length > 0) {
          const topWin = openWindowIds.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
          closeApp(topWin.id);
        }
        return;
      }

      // Alt+F4 -> Close active window (retro!)
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        if (openWindowIds.length > 0) {
          const topWin = openWindowIds.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
          closeApp(topWin.id);
        }
        return;
      }

      // Alt+1 through Alt+9 -> Open app by position
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < APP_DEFS.length) {
          openApp(APP_DEFS[index].id);
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [booted, openWindowIds, showCommandPalette, closeApp, openApp, unlock]);

  // Console easter egg
  useEffect(() => {
    if (typeof window === 'undefined') return;
    console.log(
      '%c\n' +
      '  ╔══════════════════════════════════════╗\n' +
      '  ║           umesh.OS v4.0              ║\n' +
      '  ║                                      ║\n' +
      '  ║  Hey developer! 👋                   ║\n' +
      '  ║  Like what you see?                  ║\n' +
      '  ║                                      ║\n' +
      '  ║  This was vibe-coded with            ║\n' +
      '  ║  Cursor AI + Claude.                 ║\n' +
      '  ║                                      ║\n' +
      '  ║  Check the source on GitHub:         ║\n' +
      '  ║  github.com/Umeshmalik               ║\n' +
      '  ╚══════════════════════════════════════╝\n',
      'color: #00ff41; background: #0a0a0a; font-family: monospace; font-size: 12px; padding: 8px;'
    );
    console.log(
      '%cBuilt by Umesh Malik | umesh-malik.com',
      'color: #1084d0; font-size: 14px; font-weight: bold;'
    );
  }, []);

  // Context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, open: true });
      playClick();
      unlock('right-clicker');
    },
    [playClick, unlock]
  );

  const handleShutdown = useCallback(() => {
    setShowShutdown(true);
  }, []);


  // Active window = highest z-index
  const activeWindowId = openWindowIds.length > 0
    ? openWindowIds.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
    : null;

  // Build taskbar window list
  const taskbarWindows: OpenWindow[] = openWindowIds.map((w) => {
    const def = APP_DEFS.find((d) => d.id === w.id);
    return {
      id: w.id,
      title: def?.label || w.id,
      icon: def?.icon || '📄',
    };
  });

  // Command palette items
  const paletteItems = [
    ...APP_DEFS.filter((a) => a.id !== 'print').map((app) => ({
      id: `open-${app.id}`,
      label: `Open ${app.label}`,
      icon: app.icon,
      category: 'Applications',
      action: () => openApp(app.id),
    })),
    {
      id: 'print-resume',
      label: 'Print / Download Resume',
      icon: '🖨️',
      category: 'Actions',
      action: () => setShowPrintDialog(true),
    },
    {
      id: 'toggle-crt',
      label: `Toggle CRT Effect (${crtEnabled ? 'ON' : 'OFF'})`,
      icon: '📺',
      category: 'Settings',
      action: toggleCRT,
    },
    {
      id: 'toggle-sound',
      label: `Toggle Sound (${soundEnabled ? 'ON' : 'OFF'})`,
      icon: soundEnabled ? '🔊' : '🔇',
      category: 'Settings',
      action: toggleSound,
    },
    {
      id: 'matrix',
      label: 'Enter the Matrix',
      icon: '🟢',
      category: 'Easter Eggs',
      action: () => { setShowMatrix(true); unlock('hacker'); },
    },
    {
      id: 'change-theme',
      label: 'Change Desktop Theme',
      icon: '🎨',
      category: 'Settings',
      action: () => openApp('theme'),
    },
    {
      id: 'shutdown',
      label: 'Shut Down',
      icon: '🔌',
      category: 'System',
      action: handleShutdown,
    },
  ];

  // Render app content by id
  const renderAppContent = (appId: string) => {
    switch (appId) {
      case 'about':
        return <AboutContent />;
      case 'experience':
        return <ExperienceContent />;
      case 'projects':
        return <ProjectsContent />;
      case 'skills':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Suspense fallback={
              <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: "'VT323', monospace", color: '#00ff41',
                fontSize: '18px', background: '#0a0a0a',
              }}>
                Loading Skill Galaxy...
              </div>
            }>
              <SkillGalaxy />
            </Suspense>
          </div>
        );
      case 'contact':
        return <ContactContent />;
      case 'github':
        return <GitHubContent />;
      case 'notepad':
        return <NotepadContent />;
      case 'code':
        return <CodePlayground />;
      case 'keyboard':
        return <KeyboardHelp />;
      case 'system':
        return <SystemProperties />;
      case 'theme':
        return <ThemePicker currentTheme={themeId} onChangeTheme={setTheme} />;
      case 'terminal':
        return (
          <Terminal
            onNavigate={(path) => {
              const rawBase = import.meta.env.BASE_URL;
              const BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
              const appMap: Record<string, string> = {
                [`${BASE}about`]: 'about',
                [`${BASE}experience`]: 'experience',
                [`${BASE}projects`]: 'projects',
                [`${BASE}skills`]: 'skills',
                [`${BASE}contact`]: 'contact',
              };
              const id = appMap[path];
              if (id) openApp(id);
            }}
            onMatrix={() => {
              setShowMatrix(true);
              unlock('hacker');
            }}
            onSnake={() => openApp('snake')}
            onAchievement={(id) => unlock(id)}
          />
        );
      case 'snake':
        return (
          <Snake
            onClose={() => closeApp('snake')}
            onAchievement={(id) => unlock(id)}
          />
        );
      default:
        return <div style={{ padding: 20 }}>Unknown app: {appId}</div>;
    }
  };

  // Night-time stars background
  const nightStars = timePeriod === 'night' ? (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      background: `
        radial-gradient(1px 1px at 10% 10%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 20% 40%, rgba(255,255,255,0.4), transparent),
        radial-gradient(1px 1px at 40% 20%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 60% 30%, rgba(255,255,255,0.3), transparent),
        radial-gradient(1px 1px at 80% 15%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 90% 50%, rgba(255,255,255,0.4), transparent),
        radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.3), transparent),
        radial-gradient(1px 1px at 70% 70%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 50% 80%, rgba(255,255,255,0.4), transparent),
        radial-gradient(1px 1px at 15% 85%, rgba(255,255,255,0.3), transparent)
      `,
    }} />
  ) : null;

  return (
    <div
      onContextMenu={handleContextMenu}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: desktopBg,
        transition: 'background 0.5s ease',
      }}
    >
      {/* Boot Sequence */}
      {!booted && <BootSequence onComplete={handleBootComplete} />}

      {/* Main Desktop */}
      {booted && (
        <>
          {/* 3D Background */}
          <div style={{ position: 'absolute', inset: 0, bottom: '36px', overflow: 'hidden' }}>
            {nightStars}
            <Suspense fallback={null}>
              <FloatingShapes />
            </Suspense>

            {/* Desktop Icons */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, 80px)',
                gridAutoRows: '90px',
                gap: '8px',
                maxWidth: '600px',
              }}
            >
              {DESKTOP_APPS.map((app) => (
                <DesktopIcon
                  key={app.id}
                  label={app.label}
                  icon={app.icon}
                  onOpen={() => openApp(app.id)}
                />
              ))}
              <DesktopIcon
                label="README.md"
                icon="📄"
                onOpen={() => openApp('about')}
              />
            </div>

            {/* Welcome text (only when no windows visible) */}
            {(openWindowIds.length === 0 || openWindowIds.every((w) => w.minimized)) && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                  pointerEvents: 'none',
                  textAlign: 'center',
                  fontFamily: "'Press Start 2P', monospace",
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ fontSize: '10px', marginBottom: '8px', color: '#00ff41', textShadow: '0 0 10px rgba(0,255,65,0.5)' }}>
                  {greeting}! Welcome to
                </div>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>umesh.OS</div>
                <div style={{ fontSize: '8px', color: '#c0c0c0', lineHeight: '1.6' }}>
                  Double-click icons to explore<br />
                  Press Ctrl+K for command palette<br />
                  Try the Konami code!
                </div>
              </div>
            )}
          </div>

          {/* Open Windows */}
          {openWindowIds.map((win) => {
            const def = APP_DEFS.find((d) => d.id === win.id);
            if (!def || def.width === 0) return null;
            return (
              <DraggableWindow
                key={win.id}
                title={def.title}
                icon={def.icon}
                defaultWidth={def.width}
                defaultHeight={def.height}
                zIndex={win.zIndex}
                isMinimized={win.minimized}
                onMinimize={() => minimizeWindow(win.id)}
                onClose={() => closeApp(win.id)}
                onFocus={() => focusWindow(win.id)}
              >
                {renderAppContent(win.id)}
              </DraggableWindow>
            );
          })}

          {/* Taskbar */}
          <Taskbar
            openWindows={taskbarWindows}
            activeWindowId={activeWindowId}
            crtEnabled={crtEnabled}
            soundEnabled={soundEnabled}
            onToggleCRT={toggleCRT}
            onToggleSound={toggleSound}
            onShutdown={handleShutdown}
            onOpenApp={openApp}
            onFocusWindow={focusWindow}
          />

          {/* Context Menu */}
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            isOpen={contextMenu.open}
            onClose={() => setContextMenu((p) => ({ ...p, open: false }))}
            onRefresh={() => window.location.reload()}
          />

          {/* Command Palette */}
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            items={paletteItems}
          />

          {/* Print Dialog */}
          <PrintDialog
            isOpen={showPrintDialog}
            onClose={() => setShowPrintDialog(false)}
            onAchievement={(id) => unlock(id)}
          />

          {/* Hire Me Badge */}
          <HireMeBadge onOpenContact={() => openApp('contact')} />

          {/* Clippy */}
          <Clippy />
        </>
      )}

      {/* CRT Overlay */}
      {crtEnabled && <div className="crt-overlay crt-scanlines crt-flicker" />}

      {/* Matrix Rain */}
      {showMatrix && <MatrixRain onDismiss={() => setShowMatrix(false)} />}

      {/* Shutdown Animation */}
      {showShutdown && <ShutdownScreen />}

      {/* Screen Saver */}
      {isIdle && booted && !showMatrix && !showShutdown && (
        <ScreenSaver onDismiss={dismissIdle} />
      )}

      {/* Achievement Toast */}
      <AchievementToast achievement={newAchievement} />
    </div>
  );
}
