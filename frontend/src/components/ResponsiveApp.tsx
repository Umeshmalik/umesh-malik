import { useState, useEffect } from 'react';
import DesktopApp from './DesktopApp';
import MobileApp from './mobile/MobileApp';

export default function ResponsiveApp() {
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 769);
    };
    check();
    setReady(true);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!ready) return null;

  return isMobile ? <MobileApp /> : <DesktopApp />;
}
