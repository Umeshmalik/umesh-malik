import { useEffect, useState } from 'react';
import type { Achievement } from '../../data/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
}

export default function AchievementToast({ achievement }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => setVisible(false), 400);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  if (!visible || !achievement) return null;

  return (
    <div
      className={exiting ? 'achievement-exit' : 'achievement-enter'}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99996,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.95)',
        border: '2px solid #00ff41',
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
        fontFamily: "'VT323', monospace",
        maxWidth: '300px',
      }}
    >
      <div style={{ fontSize: '28px' }}>{achievement.icon}</div>
      <div>
        <div
          style={{
            fontSize: '10px',
            fontFamily: "'Press Start 2P', monospace",
            color: '#00ff41',
            marginBottom: '4px',
          }}
        >
          ACHIEVEMENT UNLOCKED
        </div>
        <div style={{ fontSize: '18px', color: 'white' }}>{achievement.title}</div>
        <div style={{ fontSize: '14px', color: '#808080' }}>{achievement.description}</div>
      </div>
    </div>
  );
}
