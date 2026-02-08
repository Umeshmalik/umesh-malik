import { useState } from 'react';
import Clock from './Clock';
import StartMenu from './StartMenu';
import VisitorCounter from '../ui/VisitorCounter';

export interface OpenWindow {
  id: string;
  title: string;
  icon: string;
}

interface TaskbarProps {
  openWindows: OpenWindow[];
  activeWindowId: string | null;
  crtEnabled: boolean;
  soundEnabled: boolean;
  onToggleCRT: () => void;
  onToggleSound: () => void;
  onShutdown: () => void;
  onOpenApp: (appId: string) => void;
  onFocusWindow: (id: string) => void;
}

export default function Taskbar({
  openWindows,
  activeWindowId,
  crtEnabled,
  soundEnabled,
  onToggleCRT,
  onToggleSound,
  onShutdown,
  onOpenApp,
  onFocusWindow,
}: TaskbarProps) {
  const [startOpen, setStartOpen] = useState(false);

  return (
    <div
      className="win95-raised"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        padding: '2px 4px',
        gap: '4px',
        zIndex: 9990,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Start Button */}
      <div style={{ position: 'relative' }}>
        <button
          className={startOpen ? 'win95-pressed' : 'win95-button'}
          onClick={() => setStartOpen((p) => !p)}
          style={{
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            height: '28px',
            padding: '2px 8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>🪟</span>
          Start
        </button>
        <StartMenu
          isOpen={startOpen}
          onClose={() => setStartOpen(false)}
          onShutdown={onShutdown}
          onOpenApp={onOpenApp}
        />
      </div>

      {/* Divider */}
      <div
        style={{
          width: '2px',
          height: '24px',
          borderLeft: '1px solid #808080',
          borderRight: '1px solid white',
          flexShrink: 0,
        }}
      />

      {/* Open Window Buttons */}
      <div style={{ display: 'flex', gap: '2px', flex: 1, overflow: 'hidden' }}>
        {openWindows.map((win) => {
          const isActive = win.id === activeWindowId;
          return (
            <button
              key={win.id}
              onClick={() => onFocusWindow(win.id)}
              style={{
                height: '28px',
                padding: '2px 8px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minWidth: '100px',
                maxWidth: '160px',
                overflow: 'hidden',
                background: '#c0c0c0',
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: isActive ? 'bold' : 'normal',
                border: 'none',
                borderTop: isActive ? '2px solid #000' : '2px solid #fff',
                borderLeft: isActive ? '2px solid #000' : '2px solid #fff',
                borderBottom: isActive ? '2px solid #fff' : '2px solid #000',
                borderRight: isActive ? '2px solid #fff' : '2px solid #000',
              }}
            >
              <span style={{ fontSize: '12px', flexShrink: 0 }}>{win.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {win.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* System Tray */}
      <div
        className="win95-sunken"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 6px',
          height: '28px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onToggleCRT}
          title={crtEnabled ? 'CRT Mode: ON' : 'CRT Mode: OFF'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '2px',
            opacity: crtEnabled ? 1 : 0.5,
          }}
        >
          📺
        </button>

        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '2px',
            opacity: soundEnabled ? 1 : 0.5,
          }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        <VisitorCounter />
        <Clock />
      </div>
    </div>
  );
}
