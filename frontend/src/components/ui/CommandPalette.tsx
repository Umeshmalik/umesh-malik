import { useState, useEffect, useRef, useCallback } from 'react';

interface PaletteItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: PaletteItem[];
}

export default function CommandPalette({ isOpen, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    },
    [filtered, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '480px',
          maxWidth: '90vw',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #00ff41',
          boxShadow: '0 0 30px rgba(0,255,65,0.2)',
          background: '#0a0a0a',
          fontFamily: "'VT323', monospace",
        }}
      >
        {/* Search Input */}
        <div style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00ff41', fontSize: '16px' }}>{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search apps, skills, commands..."
            spellCheck={false}
            autoComplete="off"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#00ff41',
              fontFamily: "'VT323', monospace",
              fontSize: '18px',
              caretColor: '#00ff41',
            }}
          />
          <span style={{ color: '#555', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>ESC</span>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '16px' }}>
              No matches found
            </div>
          )}
          {filtered.map((item, i) => (
            <div
              key={item.id}
              onClick={() => {
                item.action();
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                cursor: 'pointer',
                background: i === selectedIndex ? '#1a3a1a' : 'transparent',
                borderLeft: i === selectedIndex ? '3px solid #00ff41' : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: i === selectedIndex ? '#00ff41' : '#ccc', fontSize: '16px' }}>{item.label}</div>
                <div style={{ color: '#555', fontSize: '13px' }}>{item.category}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 16px', borderTop: '1px solid #333', display: 'flex', gap: '16px', fontSize: '12px', color: '#555', fontFamily: "'IBM Plex Mono', monospace" }}>
          <span>Up/Down to navigate</span>
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
