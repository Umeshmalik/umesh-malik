import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="win95-sunken"
      style={{
        padding: '2px 8px',
        fontSize: '11px',
        fontFamily: "'IBM Plex Mono', monospace",
        minWidth: '75px',
        textAlign: 'center',
      }}
    >
      {time}
    </div>
  );
}
