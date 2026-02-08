import { useState, useEffect, useRef } from 'react';
import { getOSVersion, getCopyright, getYearsOfExperience } from '../../data/dynamic';

interface BootSequenceProps {
  onComplete: () => void;
}

const BIOS_LINES = [
  `umesh.OS BIOS ${getOSVersion()}`,
  `Copyright (C) ${getCopyright()}, Umesh Malik`,
  '',
  `CPU: Caffeine-Powered Brain @ ${getYearsOfExperience()}.0GHz`,
  'Memory Test: 640K ought to be enough for anybody...',
  'Memory Test: 4096MB OK',
  '',
  'Detecting IDE drives...',
  '  Primary Master: React 19.2',
  '  Primary Slave: TypeScript 5.9',
  '  Secondary Master: Three.js 0.182',
  '  Secondary Slave: Astro 5.12',
  '',
  'Initializing React Three Fiber...... OK',
  'Loading GSAP Animation Engine...... OK',
  'Mounting Tailwind CSS v4........... OK',
  'Starting Sound System.............. OK',
  'Connecting to AI Copilot........... OK',
  'Loading Cursor AI + Claude......... OK',
  '',
  'NOTE: This entire OS was vibe-coded with AI.',
  '',
  'All systems nominal.',
  '',
  'Press any key to continue...',
];

const OS_LOAD_STAGES = [
  `Loading umesh.OS ${getOSVersion()}...`,
  'Initializing desktop environment...',
  'Loading skill constellation...',
  'Mounting achievement system...',
  'Syncing AI-generated components...',
  'Starting window manager...',
  'Ready.',
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [phase, setPhase] = useState<'bios' | 'loading' | 'done'>('bios');
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadText, setLoadText] = useState('');
  const [waitingForKey, setWaitingForKey] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // BIOS phase - typewriter effect
  useEffect(() => {
    if (phase !== 'bios') return;
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < BIOS_LINES.length) {
        setVisibleLines((prev) => [...prev, BIOS_LINES[lineIndex]]);
        lineIndex++;
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setWaitingForKey(true);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  // Key press to advance from BIOS
  useEffect(() => {
    if (!waitingForKey) return;
    const handler = () => {
      setWaitingForKey(false);
      setPhase('loading');
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    // Auto-advance after 3 seconds
    const timer = setTimeout(handler, 3000);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
      clearTimeout(timer);
    };
  }, [waitingForKey]);

  // Loading phase
  useEffect(() => {
    if (phase !== 'loading') return;
    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < OS_LOAD_STAGES.length) {
        setLoadText(OS_LOAD_STAGES[stageIndex]);
        setLoadProgress(((stageIndex + 1) / OS_LOAD_STAGES.length) * 100);
        stageIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('done');
          onComplete();
        }, 500);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [phase, onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'VT323', monospace",
        color: '#aaaaaa',
        animation: phase === 'loading' ? undefined : undefined,
      }}
    >
      {phase === 'bios' && (
        <div
          ref={containerRef}
          style={{
            flex: 1,
            padding: '20px',
            overflow: 'auto',
            fontSize: '16px',
            lineHeight: '1.4',
          }}
        >
          {visibleLines.map((line, i) => (
            <div key={i} style={{ minHeight: '1.4em' }}>
              {line}
              {i === visibleLines.length - 1 && line === 'Press any key to continue...' && (
                <span className="typing-cursor" />
              )}
            </div>
          ))}
        </div>
      )}

      {phase === 'loading' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontFamily: "'Press Start 2P', monospace",
              color: '#00ff41',
              textShadow: '0 0 10px rgba(0,255,65,0.5)',
              marginBottom: '30px',
            }}
          >
            umesh.OS
          </div>

          <div style={{ width: '400px', maxWidth: '80vw' }}>
            <div className="pixel-progress" style={{ width: '100%' }}>
              <div
                className="pixel-progress-fill"
                style={{
                  width: `${loadProgress}%`,
                  background: '#000080',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '14px', color: '#808080', marginTop: '10px' }}>
            {loadText}
          </div>
        </div>
      )}
    </div>
  );
}
