import { useState, useCallback, useEffect } from 'react';
import BootSequence from './boot/BootSequence';
import Taskbar from './desktop/Taskbar';
import type { OpenWindow } from './desktop/Taskbar';
import DesktopIcon from './desktop/DesktopIcon';
import ContextMenu from './desktop/ContextMenu';
import DraggableWindow from './windows/DraggableWindow';
import AchievementToast from './ui/AchievementToast';
import Clippy from './ui/Clippy';
import MatrixRain from './effects/MatrixRain';
import ScreenSaver from './effects/ScreenSaver';
import BSOD from './effects/BSOD';
import FloatingShapes from './three/FloatingShapes';
import Terminal from './terminal/Terminal';
import Snake from './games/Snake';
import AboutContent from './pages/AboutContent';
import ExperienceContent from './pages/ExperienceContent';
import ProjectsContent from './pages/ProjectsContent';
import ContactContent from './pages/ContactContent';
import SkillGalaxy from './three/SkillGalaxy';
import { useCRT } from '../hooks/useCRT';
import { useSound } from '../hooks/useSound';
import { useAchievements } from '../hooks/useAchievements';
import { useKonamiCode } from '../hooks/useKonamiCode';
import { useIdleTimer } from '../hooks/useIdleTimer';

// App definitions
interface AppDef {
  id: string;
  title: string;
  icon: string;
  label: string;
  width: number;
  height: number;
}

const APP_DEFS: AppDef[] = [
  { id: 'about', title: 'about.exe - Umesh Malik', icon: '👤', label: 'about.exe', width: 700, height: 520 },
  { id: 'experience', title: 'career.exe - Experience', icon: '💼', label: 'career.exe', width: 750, height: 550 },
  { id: 'projects', title: 'projects.exe - File Explorer', icon: '📁', label: 'projects.exe', width: 750, height: 520 },
  { id: 'skills', title: 'skills.exe - Skill Galaxy', icon: '🌌', label: 'skills.exe', width: 800, height: 560 },
  { id: 'contact', title: 'mail.exe - umesh.OS Mail', icon: '📧', label: 'mail.exe', width: 700, height: 500 },
  { id: 'terminal', title: 'terminal.exe', icon: '💻', label: 'terminal.exe', width: 650, height: 420 },
  { id: 'snake', title: 'snake.exe', icon: '🐍', label: 'snake.exe', width: 420, height: 480 },
];

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
  const [showBSOD, setShowBSOD] = useState(false);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, open: false });
  const { crtEnabled, toggle: toggleCRT } = useCRT();
  const { soundEnabled, toggle: toggleSound, playBoot, playClick, playWindowOpen, playWindowClose } = useSound();
  const { unlock, newAchievement } = useAchievements();
  const { isIdle, dismiss: dismissIdle } = useIdleTimer(60000);

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
    setShowBSOD(true);
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
            <SkillGalaxy />
          </div>
        );
      case 'contact':
        return <ContactContent />;
      case 'terminal':
        return (
          <Terminal
            onNavigate={(path) => {
              const appMap: Record<string, string> = {
                '/about': 'about',
                '/experience': 'experience',
                '/projects': 'projects',
                '/skills': 'skills',
                '/contact': 'contact',
              };
              const appId = appMap[path];
              if (appId) openApp(appId);
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

  return (
    <div
      onContextMenu={handleContextMenu}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#008080',
      }}
    >
      {/* Boot Sequence */}
      {!booted && <BootSequence onComplete={handleBootComplete} />}

      {/* Main Desktop */}
      {booted && (
        <>
          {/* 3D Background */}
          <div style={{ position: 'absolute', inset: 0, bottom: '36px', overflow: 'hidden' }}>
            <FloatingShapes />

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
              {APP_DEFS.map((app) => (
                <DesktopIcon
                  key={app.id}
                  label={app.label}
                  icon={app.icon}
                  onOpen={() => openApp(app.id)}
                />
              ))}
              <DesktopIcon
                label="README.md"
                icon="📝"
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
                  Welcome to
                </div>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>umesh.OS</div>
                <div style={{ fontSize: '8px', color: '#c0c0c0', lineHeight: '1.6' }}>
                  Double-click icons to explore<br />
                  Right-click for more options<br />
                  Try the Konami code!
                </div>
              </div>
            )}
          </div>

          {/* Open Windows */}
          {openWindowIds.map((win) => {
            const def = APP_DEFS.find((d) => d.id === win.id);
            if (!def) return null;
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

          {/* Clippy */}
          <Clippy />
        </>
      )}

      {/* CRT Overlay */}
      {crtEnabled && <div className="crt-overlay crt-scanlines crt-flicker" />}

      {/* Matrix Rain */}
      {showMatrix && <MatrixRain onDismiss={() => setShowMatrix(false)} />}

      {/* BSOD */}
      {showBSOD && (
        <BSOD
          onDismiss={() => {
            setShowBSOD(false);
            setBooted(false);
            setOpenWindowIds([]);
            sessionStorage.removeItem('umesh-os-booted');
            setTimeout(() => {
              setBooted(true);
              sessionStorage.setItem('umesh-os-booted', 'true');
            }, 100);
          }}
        />
      )}

      {/* Screen Saver */}
      {isIdle && booted && !showMatrix && !showBSOD && (
        <ScreenSaver onDismiss={dismissIdle} />
      )}

      {/* Achievement Toast */}
      <AchievementToast achievement={newAchievement} />
    </div>
  );
}
