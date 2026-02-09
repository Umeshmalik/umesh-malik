import { useState, useEffect, useRef, useCallback } from 'react';

interface SnakeProps {
  onClose: () => void;
  onAchievement?: (id: string) => void;
}

const GRID_SIZE = 20;
const CELL_SIZE = 18;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function Snake({ onClose, onAchievement }: SnakeProps) {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const dirRef = useRef<Direction>('RIGHT');
  const hasAchieved = useRef(false);

  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y));
    return newFood;
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;

    if (!hasAchieved.current && onAchievement) {
      onAchievement('gamer');
      hasAchieved.current = true;
    }

    const interval = setInterval(() => {
      setSnake((prev) => {
        const head = { ...prev[0] };
        const dir = dirRef.current;

        switch (dir) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some((s) => s.x === head.x && s.y === head.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];

        // Food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10);
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, INITIAL_SPEED);

    return () => clearInterval(interval);
  }, [started, gameOver, food, spawnFood, onAchievement]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!started && e.key === ' ') {
        setStarted(true);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (dirRef.current !== 'DOWN') { dirRef.current = 'UP'; setDirection('UP'); }
          break;
        case 'ArrowDown':
        case 's':
          if (dirRef.current !== 'UP') { dirRef.current = 'DOWN'; setDirection('DOWN'); }
          break;
        case 'ArrowLeft':
        case 'a':
          if (dirRef.current !== 'RIGHT') { dirRef.current = 'LEFT'; setDirection('LEFT'); }
          break;
        case 'ArrowRight':
        case 'd':
          if (dirRef.current !== 'LEFT') { dirRef.current = 'RIGHT'; setDirection('RIGHT'); }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, onClose]);

  const restart = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]);
    dirRef.current = 'RIGHT';
    setDirection('RIGHT');
    setFood({ x: 15, y: 10 });
    setScore(0);
    setGameOver(false);
    setStarted(true);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'VT323', monospace",
        color: '#00ff41',
      }}
    >
      <div style={{ marginBottom: '12px', fontSize: '14px', fontFamily: "'Press Start 2P', monospace" }}>
        SNAKE.EXE
      </div>

      <div style={{ marginBottom: '8px', fontSize: '18px' }}>Score: {score}</div>

      <div
        style={{
          border: '2px solid #00ff41',
          boxShadow: '0 0 10px rgba(0,255,65,0.3)',
          position: 'relative',
          width: `${GRID_SIZE * CELL_SIZE}px`,
          height: `${GRID_SIZE * CELL_SIZE}px`,
        }}
      >
        {/* Grid */}
        {snake.map((segment, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${segment.x * CELL_SIZE}px`,
              top: `${segment.y * CELL_SIZE}px`,
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              background: i === 0 ? '#00ff41' : '#009926',
              border: '1px solid #0a0a0a',
            }}
          />
        ))}

        {/* Food */}
        <div
          style={{
            position: 'absolute',
            left: `${food.x * CELL_SIZE}px`,
            top: `${food.y * CELL_SIZE}px`,
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            background: '#ff0040',
            border: '1px solid #0a0a0a',
            boxShadow: '0 0 6px rgba(255,0,64,0.5)',
          }}
        />

        {/* Overlays */}
        {!started && !gameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
              fontSize: '16px',
            }}
          >
            Press SPACE to start
          </div>
        )}

        {gameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '20px', color: '#ff0040' }}>GAME OVER</div>
            <div>Score: {score}</div>
            <button
              onClick={restart}
              style={{
                background: 'none',
                border: '1px solid #00ff41',
                color: '#00ff41',
                padding: '6px 16px',
                fontFamily: "'VT323', monospace",
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Restart
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
        Arrow keys or WASD to move | ESC to close
      </div>
    </div>
  );
}
