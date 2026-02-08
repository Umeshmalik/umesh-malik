import { useEffect, useRef } from 'react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

export function useKonamiCode(callback: () => void) {
  const indexRef = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const expected = KONAMI_CODE[indexRef.current];
      if (e.key.toLowerCase() === expected.toLowerCase()) {
        indexRef.current++;
        if (indexRef.current === KONAMI_CODE.length) {
          callback();
          indexRef.current = 0;
        }
      } else {
        indexRef.current = 0;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback]);
}
