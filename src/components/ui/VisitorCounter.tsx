import { useState, useEffect } from 'react';

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Use a simple localStorage-based counter (self-sufficient, no external API needed)
    // For a real counter, you'd use an API like countapi.xyz
    // This gives a local count that persists per browser + adds a random base
    const key = 'umesh-os-visitor-count';
    const baseCount = 1337; // Starting base for social proof
    const stored = localStorage.getItem(key);
    let current = stored ? parseInt(stored, 10) : baseCount;
    
    // Increment on each new session
    const sessionKey = 'umesh-os-session-counted';
    if (!sessionStorage.getItem(sessionKey)) {
      current += 1;
      localStorage.setItem(key, String(current));
      sessionStorage.setItem(sessionKey, 'true');
    }
    
    setCount(current);
  }, []);

  if (count === null) return null;

  const digits = String(count).padStart(5, '0').split('');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '11px',
        fontFamily: "'VT323', monospace",
        color: '#000',
      }}
      title={`${count} visitors have booted umesh.OS`}
    >
      <span style={{ fontSize: '10px', marginRight: '2px' }}>👥</span>
      {digits.map((d, i) => (
        <span
          key={i}
          style={{
            background: '#000',
            color: '#00ff41',
            padding: '0 2px',
            fontSize: '12px',
            fontFamily: "'VT323', monospace",
            minWidth: '10px',
            textAlign: 'center',
            border: '1px solid #555',
          }}
        >
          {d}
        </span>
      ))}
    </div>
  );
}
