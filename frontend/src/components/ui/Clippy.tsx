import { useState, useEffect } from 'react';

const TIPS = [
  "It looks like you're trying to hire a developer! Need help?",
  "Did you know? Umesh has migrated entire codebases from Vue to React!",
  "Pro tip: Try the Konami code for a surprise! (Up Up Down Down Left Right Left Right B A)",
  "Have you checked out the Skills Galaxy? It's out of this world!",
  "Try typing 'neofetch' in the terminal!",
  "Fun fact: Umesh has processed $10M+ in monthly transactions!",
  "Tip: Right-click the desktop for more options!",
  "Want to play a game? Type 'snake' in the terminal!",
  "This entire website was vibe-coded with Cursor AI + Claude!",
  "Type 'ai' in the terminal to see how AI built this site!",
  "Umesh uses AI as a force multiplier — not a replacement for thinking.",
  "Fun fact: 30+ components were generated in a single AI pair-programming session!",
];

export default function Clippy() {
  const [visible, setVisible] = useState(false);
  const [tip, setTip] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const showTimer = setTimeout(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
      setVisible(true);
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(showTimer);
  }, [dismissed]);

  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(hideTimer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '50px',
        right: '20px',
        zIndex: 9995,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {/* Speech Bubble */}
      <div
        style={{
          background: '#ffffcc',
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '250px',
          fontSize: '12px',
          fontFamily: "'IBM Plex Mono', monospace",
          position: 'relative',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        <button
          onClick={() => {
            setVisible(false);
            setDismissed(true);
          }}
          style={{
            position: 'absolute',
            top: '2px',
            right: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
          }}
        >
          x
        </button>
        {tip}
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            right: '20px',
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #000',
          }}
        />
      </div>

      {/* Clippy Character */}
      <div
        style={{
          fontSize: '40px',
          cursor: 'pointer',
          filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',
          animation: 'bounce 2s ease-in-out infinite',
        }}
        onClick={() => {
          setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
        }}
      >
        📎
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
