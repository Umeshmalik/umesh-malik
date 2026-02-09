import { useState, useEffect } from 'react';

interface HireMeBadgeProps {
  onOpenContact: () => void;
}

export default function HireMeBadge({ onOpenContact }: HireMeBadgeProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('umesh-os-hire-dismissed');
    if (stored === 'true') {
      setDismissed(true);
    } else {
      // Show after 10s delay
      const timer = setTimeout(() => setDismissed(false), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '46px',
        left: '12px',
        zIndex: 9980,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'slide-in-right 0.5s ease-out',
      }}
    >
      <div
        onClick={onOpenContact}
        style={{
          background: 'rgba(0, 128, 0, 0.95)',
          border: '2px solid #00ff41',
          padding: '8px 14px',
          cursor: 'pointer',
          fontFamily: "'VT323', monospace",
          fontSize: '15px',
          color: '#00ff41',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 15px rgba(0,255,65,0.3)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      >
        <span style={{ fontSize: '14px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#00ff41', borderRadius: '50%', marginRight: '6px', boxShadow: '0 0 6px #00ff41' }} />
        </span>
        Open to Opportunities
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
          localStorage.setItem('umesh-os-hire-dismissed', 'true');
        }}
        style={{
          background: 'none',
          border: '1px solid #555',
          color: '#555',
          cursor: 'pointer',
          padding: '2px 6px',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
        title="Dismiss"
      >
        x
      </button>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(0,255,65,0.3); }
          50% { box-shadow: 0 0 25px rgba(0,255,65,0.5); }
        }
      `}</style>
    </div>
  );
}
