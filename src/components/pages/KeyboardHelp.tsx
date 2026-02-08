export default function KeyboardHelp() {
  const shortcuts = [
    { keys: ['Ctrl/Cmd', 'K'], desc: 'Open Command Palette', category: 'Navigation' },
    { keys: ['Alt', '1-9'], desc: 'Open app by position', category: 'Navigation' },
    { keys: ['Esc'], desc: 'Close active window', category: 'Window Management' },
    { keys: ['Alt', 'F4'], desc: 'Close active window (retro!)', category: 'Window Management' },
    { keys: ['↑ ↑ ↓ ↓ ← → ← → B A'], desc: 'Konami Code (Easter Egg!)', category: 'Easter Eggs' },
  ];

  const grouped = shortcuts.reduce(
    (acc, s) => {
      (acc[s.category] = acc[s.category] || []).push(s);
      return acc;
    },
    {} as Record<string, typeof shortcuts>
  );

  return (
    <div style={{ padding: '20px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', background: '#c0c0c0', minHeight: '100%' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px' }}>⌨️</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Keyboard Shortcuts</div>
          <div style={{ color: '#555', fontSize: '11px' }}>Power user guide for umesh.OS</div>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#000080', fontSize: '12px' }}>{cat}</div>
          <div className="win95-sunken" style={{ padding: '8px', background: 'white' }}>
            {items.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {s.keys.map((k, j) => (
                    <span key={j}>
                      <kbd
                        style={{
                          background: '#e8e8e8',
                          border: '1px solid #808080',
                          borderBottom: '2px solid #555',
                          borderRadius: '3px',
                          padding: '1px 6px',
                          fontSize: '11px',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {k}
                      </kbd>
                      {j < s.keys.length - 1 && <span style={{ margin: '0 2px', color: '#808080' }}>+</span>}
                    </span>
                  ))}
                </div>
                <span style={{ color: '#333', fontSize: '12px' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', color: '#808080', fontSize: '11px', marginTop: '16px' }}>
        Pro tip: Try typing commands in the terminal for more hidden features!
      </div>
    </div>
  );
}
