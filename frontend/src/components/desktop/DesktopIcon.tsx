import { useState, useCallback, useRef } from 'react';

interface DesktopIconProps {
  label: string;
  icon: string;
  href?: string;
  onOpen?: () => void;
}

export default function DesktopIcon({ label, icon, href, onOpen }: DesktopIconProps) {
  const [selected, setSelected] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    setSelected(true);
    clickCount.current++;

    if (clickCount.current === 2) {
      clickCount.current = 0;
      if (clickTimer.current) clearTimeout(clickTimer.current);
      if (onOpen) {
        onOpen();
      } else if (href) {
        window.location.href = href;
      }
      return;
    }

    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 400);
  }, [href, onOpen]);

  return (
    <div
      onClick={handleClick}
      onBlur={() => setSelected(false)}
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        cursor: 'pointer',
        width: '80px',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontSize: '36px',
          filter: selected ? 'brightness(1.5)' : undefined,
          lineHeight: 1,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: '11px',
          fontFamily: "'IBM Plex Mono', monospace",
          color: 'white',
          textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
          background: selected ? '#000080' : 'transparent',
          padding: '1px 4px',
          lineHeight: '1.3',
          wordBreak: 'break-word',
        }}
      >
        {label}
      </span>
    </div>
  );
}
