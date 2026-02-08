import { THEMES, type ThemeId } from '../../hooks/useTheme';

interface ThemePickerProps {
  currentTheme: ThemeId;
  onChangeTheme: (id: ThemeId) => void;
}

export default function ThemePicker({ currentTheme, onChangeTheme }: ThemePickerProps) {
  const themes = Object.values(THEMES);

  return (
    <div style={{ padding: '20px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '14px' }}>
        🎨 Desktop Themes
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChangeTheme(theme.id)}
            className={currentTheme === theme.id ? 'win95-pressed' : 'win95-button'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              textAlign: 'left',
              width: '100%',
              fontSize: '13px',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <span style={{ fontSize: '24px' }}>{theme.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{theme.name}</div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <div style={{ width: '16px', height: '16px', background: theme.desktopBg, border: '1px solid #808080' }} />
                <div style={{ width: '16px', height: '16px', background: theme.buttonFace, border: '1px solid #808080' }} />
                <div style={{ width: '16px', height: '16px', background: theme.titleBarText === '#ffffff' ? '#000080' : theme.titleBarText, border: '1px solid #808080' }} />
              </div>
            </div>
            {currentTheme === theme.id && <span style={{ color: '#008000', fontWeight: 'bold' }}>✓ Active</span>}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '16px', color: '#808080', fontSize: '11px', textAlign: 'center' }}>
        Theme preferences are saved locally.
      </div>
    </div>
  );
}
