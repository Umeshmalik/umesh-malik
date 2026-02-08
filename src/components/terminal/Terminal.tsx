import { useState, useRef, useEffect, useCallback } from 'react';
import { executeCommand } from '../../data/commands';
import { getOSVersion } from '../../data/dynamic';

interface TerminalProps {
  onNavigate?: (path: string) => void;
  onMatrix?: () => void;
  onSnake?: () => void;
  onAchievement?: (id: string) => void;
}

export default function Terminal({ onNavigate, onMatrix, onSnake, onAchievement }: TerminalProps) {
  const [lines, setLines] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    { type: 'output', text: `umesh.OS Terminal ${getOSVersion()}` },
    { type: 'output', text: 'Type "help" for available commands.\n' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasNotified = useRef(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
    if (!hasNotified.current && onAchievement) {
      onAchievement('power-user');
      hasNotified.current = true;
    }
  }, [onAchievement]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const input = currentInput.trim();
      if (!input) {
        setLines((prev) => [...prev, { type: 'input', text: input }]);
        setCurrentInput('');
        return;
      }

      const result = executeCommand(input, commandHistory);

      const newLines: Array<{ type: 'input' | 'output'; text: string }> = [
        { type: 'input', text: input },
      ];

      if (result.action === 'clear') {
        setLines([]);
        setCurrentInput('');
        setCommandHistory((prev) => [...prev, input]);
        return;
      }

      if (result.output) {
        newLines.push({ type: 'output', text: result.output });
      }

      setLines((prev) => [...prev, ...newLines]);
      setCommandHistory((prev) => [...prev, input]);
      setHistoryIndex(-1);
      setCurrentInput('');

      // Handle actions
      if (result.action === 'navigate' && result.target) {
        setTimeout(() => {
          if (onNavigate) onNavigate(result.target!);
          else window.location.href = result.target!;
        }, 500);
      } else if (result.action === 'matrix') {
        setTimeout(() => onMatrix?.(), 300);
      } else if (result.action === 'snake') {
        setTimeout(() => onSnake?.(), 300);
      }
    },
    [currentInput, commandHistory, onNavigate, onMatrix, onSnake]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setCurrentInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setCurrentInput('');
      } else {
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        color: '#00ff41',
        fontFamily: "'VT323', monospace",
        fontSize: '16px',
        padding: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          lineHeight: '1.5',
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line.type === 'input' ? (
              <span>
                <span style={{ color: '#1084d0' }}>umesh@os</span>
                <span style={{ color: '#ffffff' }}>:</span>
                <span style={{ color: '#ffb000' }}>~</span>
                <span style={{ color: '#ffffff' }}>$ </span>
                <span>{line.text}</span>
              </span>
            ) : (
              <span style={{ color: '#aaaaaa' }}>{line.text}</span>
            )}
          </div>
        ))}

        {/* Current Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <span>
            <span style={{ color: '#1084d0' }}>umesh@os</span>
            <span style={{ color: '#ffffff' }}>:</span>
            <span style={{ color: '#ffb000' }}>~</span>
            <span style={{ color: '#ffffff' }}>$ </span>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00ff41',
              fontFamily: "'VT323', monospace",
              fontSize: '16px',
              outline: 'none',
              flex: 1,
              caretColor: '#00ff41',
            }}
          />
        </form>
      </div>
    </div>
  );
}
