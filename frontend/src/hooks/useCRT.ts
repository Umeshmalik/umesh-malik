import { useState, useEffect } from 'react';

const STORAGE_KEY = 'umesh-os-crt';

export function useCRT() {
  const [crtEnabled, setCrtEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCrtEnabled(stored === 'true');
    }
  }, []);

  const toggle = () => {
    setCrtEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return { crtEnabled, toggle };
}
