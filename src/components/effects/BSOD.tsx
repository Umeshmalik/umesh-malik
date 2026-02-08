import { useEffect } from 'react';

interface BSODProps {
  onDismiss: () => void;
}

export default function BSOD({ onDismiss }: BSODProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    const handler = () => onDismiss();
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
  }, [onDismiss]);

  return (
    <div className="bsod">
      <div className="bsod-title">umesh.OS</div>
      <br />
      An error has occurred. To continue:
      <br /><br />
      Press any key to restart your computer. If you do this,
      <br />
      you will lose all unsaved memes in all open programs.
      <br /><br />
      Error: 0E : 016F : BFF9B3D4
      <br /><br />
      *  Press any key to continue _
      <br /><br />
      <span style={{ fontSize: '12px', opacity: 0.6 }}>
        (Just kidding! This is Umesh's portfolio. No computers were harmed.)
      </span>
    </div>
  );
}
