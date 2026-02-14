import { useEffect, useState } from 'react';

type Phase = 'saving' | 'shutting-down' | 'safe-to-turn-off';

export default function ShutdownScreen() {
  const [phase, setPhase] = useState<Phase>('saving');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('shutting-down'), 1500);
    const t2 = setTimeout(() => setPhase('safe-to-turn-off'), 3500);
    const t3 = setTimeout(() => {
      window.location.href = '/projects';
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'VT323', monospace",
    }}>
      {phase === 'saving' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '24px',
            animation: 'shutdown-spin 1s linear infinite',
          }}>
            💾
          </div>
          <div style={{
            color: '#c0c0c0',
            fontSize: '22px',
            letterSpacing: '1px',
          }}>
            Saving your settings...
          </div>
          <div style={{
            marginTop: '20px',
            width: '200px',
            height: '20px',
            background: '#333',
            border: '2px solid #555',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: '#000080',
              animation: 'shutdown-progress 1.5s linear forwards',
            }} />
          </div>
        </div>
      )}

      {phase === 'shutting-down' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '20px',
            color: '#c0c0c0',
            marginBottom: '16px',
            letterSpacing: '1px',
          }}>
            umesh.OS is shutting down...
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: '8px',
                height: '8px',
                background: '#c0c0c0',
                animation: `shutdown-dot 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'safe-to-turn-off' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: '#ffb000',
            fontSize: '24px',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(255, 176, 0, 0.5)',
          }}>
            It's now safe to turn off
          </div>
          <div style={{
            color: '#ffb000',
            fontSize: '24px',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(255, 176, 0, 0.5)',
            marginTop: '4px',
          }}>
            your computer.
          </div>
          <div style={{
            marginTop: '24px',
            color: '#808080',
            fontSize: '14px',
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            Redirecting to portfolio...
          </div>
        </div>
      )}

      <style>{`
        @keyframes shutdown-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shutdown-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes shutdown-dot {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
