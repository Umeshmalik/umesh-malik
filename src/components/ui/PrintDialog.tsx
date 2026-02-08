import { useState, useEffect } from 'react';

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAchievement?: (id: string) => void;
}

export default function PrintDialog({ isOpen, onClose, onAchievement }: PrintDialogProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'printing' | 'done'>('idle');

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setStatus('idle');
    }
  }, [isOpen]);

  const handlePrint = () => {
    setStatus('printing');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus('done');
          // Trigger actual download
          const link = document.createElement('a');
          link.href = '/Umesh-Malik-Resume.pdf';
          link.download = 'Umesh-Malik-Resume.pdf';
          link.click();
          onAchievement?.('paper-trail');
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99995,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="win95-raised"
        style={{
          width: '360px',
          background: '#c0c0c0',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '12px',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: '#000080',
            color: 'white',
            padding: '3px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          <span>🖨️ Print</span>
          <button
            onClick={onClose}
            className="win95-button"
            style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', padding: 0 }}
          >
            X
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {status === 'idle' && (
            <>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>🖨️</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Document: Umesh-Malik-Resume.pdf</div>
                  <div style={{ color: '#555', marginTop: '4px' }}>Printer: umesh.OS Virtual Printer</div>
                  <div style={{ color: '#555' }}>Pages: All</div>
                  <div style={{ color: '#555' }}>Copies: 1</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="win95-button" style={{ padding: '4px 24px' }} onClick={handlePrint}>
                  Print
                </button>
                <button className="win95-button" style={{ padding: '4px 16px' }} onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {status === 'printing' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '12px' }}>Printing document...</div>
              <div className="win95-sunken" style={{ height: '20px', overflow: 'hidden', marginBottom: '8px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(progress, 100)}%`,
                    background: '#000080',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
              <div style={{ color: '#555' }}>{Math.min(Math.round(progress), 100)}%</div>
            </div>
          )}

          {status === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Print complete!</div>
              <div style={{ color: '#555', marginBottom: '16px' }}>
                Your resume has been downloaded.
              </div>
              <button className="win95-button" style={{ padding: '4px 24px' }} onClick={onClose}>
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
