import { useEffect, useRef } from 'react';
import { getOSVersion, getCopyright } from '../../data/dynamic';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ContextMenu({ x, y, isOpen, onClose, onRefresh }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => onClose();
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { label: 'Refresh', action: onRefresh },
    { label: '---' },
    { label: 'View ▸', action: () => {} },
    { label: 'Sort By ▸', action: () => {} },
    { label: '---' },
    {
      label: 'About umesh.OS',
      action: () => {
        alert(
          `umesh.OS ${getOSVersion()}\n\nBuilt with Astro, React, Three.js\nby Umesh Malik\n\n© ${getCopyright()}`
        );
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="win95-raised"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        minWidth: '160px',
        zIndex: 10001,
        padding: '2px',
      }}
    >
      {items.map((item, i) =>
        item.label === '---' ? (
          <div
            key={i}
            style={{
              height: '2px',
              margin: '2px 4px',
              borderTop: '1px solid #808080',
              borderBottom: '1px solid white',
            }}
          />
        ) : (
          <div
            key={i}
            onClick={() => {
              item.action?.();
              onClose();
            }}
            style={{
              padding: '4px 24px 4px 12px',
              fontSize: '12px',
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer',
              whiteSpace: 'nowrap',
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
            {item.label}
          </div>
        )
      )}
    </div>
  );
}
