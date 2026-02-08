import { useRef, useEffect } from 'react';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShutdown: () => void;
  onOpenApp: (appId: string) => void;
}

const menuItems = [
  { id: 'about', label: 'About Me', icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'skills', label: 'Skills', icon: '🌌' },
  { id: 'contact', label: 'Contact', icon: '📧' },
  { id: 'terminal', label: 'Terminal', icon: '💻' },
];

export default function StartMenu({ isOpen, onClose, onShutdown, onOpenApp }: StartMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="win95-raised"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '0',
        width: '220px',
        marginBottom: '2px',
        zIndex: 10000,
      }}
    >
      {/* Side banner */}
      <div style={{ display: 'flex', height: '100%' }}>
        <div
          style={{
            width: '28px',
            background: 'linear-gradient(to top, #000080, #1084d0)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '8px 0',
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              color: 'white',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              letterSpacing: '2px',
            }}
          >
            umesh.OS
          </span>
        </div>

        <div style={{ flex: 1 }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onOpenApp(item.id);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                textDecoration: 'none',
                color: 'black',
                fontSize: '12px',
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer',
                borderBottom: '1px solid #e0e0e0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#000080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'black';
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ borderTop: '2px solid #808080', margin: '0' }} />

          <div
            onClick={() => {
              onShutdown();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#000080';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'black';
            }}
          >
            <span style={{ fontSize: '18px' }}>🔌</span>
            Shut Down...
          </div>
        </div>
      </div>
    </div>
  );
}
