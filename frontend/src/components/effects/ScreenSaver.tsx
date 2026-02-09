import { useState, useEffect, useRef } from 'react';

interface ScreenSaverProps {
  onDismiss: () => void;
}

export default function ScreenSaver({ onDismiss }: ScreenSaverProps) {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [vel, setVel] = useState({ x: 2, y: 1.5 });
  const [color, setColor] = useState('#00ff41');
  const animRef = useRef<number>(0);

  const colors = ['#00ff41', '#1084d0', '#ffb000', '#ff0080', '#00aaaa', '#ff6600'];

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const logoWidth = 200;
    const logoHeight = 40;

    let x = pos.x;
    let y = pos.y;
    let vx = vel.x;
    let vy = vel.y;
    let colorIndex = 0;

    const animate = () => {
      x += vx;
      y += vy;

      if (x <= 0 || x >= width - logoWidth) {
        vx = -vx;
        colorIndex = (colorIndex + 1) % colors.length;
        setColor(colors[colorIndex]);
      }
      if (y <= 0 || y >= height - logoHeight) {
        vy = -vy;
        colorIndex = (colorIndex + 1) % colors.length;
        setColor(colors[colorIndex]);
      }

      setPos({ x, y });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    const dismiss = () => onDismiss();
    window.addEventListener('mousemove', dismiss);
    window.addEventListener('keydown', dismiss);
    window.addEventListener('click', dismiss);
    return () => {
      window.removeEventListener('mousemove', dismiss);
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('click', dismiss);
    };
  }, [onDismiss]);

  return (
    <div className="screensaver-overlay">
      <div
        style={{
          position: 'absolute',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '18px',
          color,
          textShadow: `0 0 20px ${color}`,
          whiteSpace: 'nowrap',
          transition: 'color 0.3s',
        }}
      >
        umesh.OS
      </div>
    </div>
  );
}
