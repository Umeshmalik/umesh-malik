import { useState, useRef, useCallback, type ReactNode } from 'react';

interface DraggableWindowProps {
  title: string;
  icon?: string;
  children: ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
  onClose?: () => void;
  closeHref?: string;
  onFocus?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  zIndex?: number;
  style?: React.CSSProperties;
}

export default function DraggableWindow({
  title,
  icon = '📄',
  children,
  defaultWidth = 600,
  defaultHeight = 450,
  defaultX,
  defaultY,
  onClose,
  closeHref,
  onFocus,
  onMinimize,
  isMinimized = false,
  zIndex = 1000,
  style,
}: DraggableWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({
    x: defaultX ?? Math.max(20, Math.random() * 120),
    y: defaultY ?? Math.max(10, Math.random() * 60),
  });
  const sizeRef = useRef({ width: defaultWidth, height: defaultHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const prevState = useRef({
    position: { ...posRef.current },
    size: { width: defaultWidth, height: defaultHeight },
  });
  // Force a single re-render after initial mount to apply ref position
  const [, forceRender] = useState(0);

  const applyPosition = useCallback(() => {
    if (!windowRef.current) return;
    windowRef.current.style.left = `${posRef.current.x}px`;
    windowRef.current.style.top = `${posRef.current.y}px`;
  }, []);

  const applySize = useCallback(() => {
    if (!windowRef.current) return;
    windowRef.current.style.width = `${sizeRef.current.width}px`;
    windowRef.current.style.height = `${sizeRef.current.height}px`;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onFocus?.();

    dragOffset.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };

    let rafId: number | null = null;
    let latestX = posRef.current.x;
    let latestY = posRef.current.y;

    const updateFrame = () => {
      posRef.current.x = latestX;
      posRef.current.y = latestY;
      applyPosition();
      rafId = null;
    };

    const handleMove = (ev: MouseEvent) => {
      latestX = ev.clientX - dragOffset.current.x;
      latestY = Math.max(0, ev.clientY - dragOffset.current.y);
      if (rafId === null) {
        rafId = requestAnimationFrame(updateFrame);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        posRef.current.x = latestX;
        posRef.current.y = latestY;
        applyPosition();
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [isMaximized, onFocus, applyPosition]);

  const toggleMaximize = () => {
    if (isMaximized) {
      posRef.current = { ...prevState.current.position };
      sizeRef.current = { ...prevState.current.size };
      applyPosition();
      applySize();
      setIsMaximized(false);
    } else {
      prevState.current = {
        position: { ...posRef.current },
        size: { ...sizeRef.current },
      };
      posRef.current = { x: 0, y: 0 };
      sizeRef.current = { width: window.innerWidth, height: window.innerHeight - 36 };
      applyPosition();
      applySize();
      setIsMaximized(true);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else if (closeHref) window.location.href = closeHref;
  };

  if (isMinimized) return null;

  return (

    <div
      ref={windowRef}
      onMouseDown={(e) => {
        // Don't steal focus from title bar drag
        if (!(e.target as HTMLElement).closest('.win95-title-bar')) {
          onFocus?.();
        }
      }}
      style={{
        position: 'fixed',
        left: `${posRef.current.x}px`,
        top: `${posRef.current.y}px`,
        width: `${sizeRef.current.width}px`,
        height: `${sizeRef.current.height}px`,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '2px solid #ffffff',
        borderLeft: '2px solid #ffffff',
        borderBottom: '2px solid #000000',
        borderRight: '2px solid #000000',
        background: '#c0c0c0',
        boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
        willChange: isDragging ? 'left, top' : 'auto',
        ...style,
      }}
    >
      {/* Title Bar */}
      <div
        className="win95-title-bar"
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            className="win95-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onMinimize?.()}
            style={{ minWidth: '22px', height: '20px', padding: '0', fontSize: '10px', lineHeight: 1 }}
          >
            _
          </button>
          <button
            className="win95-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleMaximize}
            style={{ minWidth: '22px', height: '20px', padding: '0', fontSize: '10px', lineHeight: 1 }}
          >
            □
          </button>
          <button
            className="win95-button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClose}
            style={{ minWidth: '22px', height: '20px', padding: '0', fontSize: '10px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          padding: '2px 0',
          borderBottom: '1px solid #808080',
          fontSize: '12px',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        <span style={{ padding: '2px 8px', cursor: 'pointer' }}>File</span>
        <span style={{ padding: '2px 8px', cursor: 'pointer' }}>Edit</span>
        <span style={{ padding: '2px 8px', cursor: 'pointer' }}>View</span>
        <span style={{ padding: '2px 8px', cursor: 'pointer' }}>Help</span>
      </div>

      {/* Content - disable pointer events while dragging to prevent iframe/canvas stealing mouse */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'white',
          margin: '2px',
          borderTop: '2px solid #808080',
          borderLeft: '2px solid #808080',
          borderBottom: '2px solid #ffffff',
          borderRight: '2px solid #ffffff',
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
      >
        {children}
      </div>

      {/* Status Bar */}
      <div
        className="win95-sunken"
        style={{
          padding: '2px 8px',
          fontSize: '11px',
          fontFamily: "'IBM Plex Mono', monospace",
          margin: '2px',
        }}
      >
        Ready
      </div>
    </div>
  );
}
