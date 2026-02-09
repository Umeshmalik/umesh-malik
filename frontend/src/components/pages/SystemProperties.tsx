import { getOSVersion, getYearsOfExperience, getCopyright } from '../../data/dynamic';

export default function SystemProperties() {
  const scores = [
    { label: 'Performance', value: 95, color: '#00ff41' },
    { label: 'Accessibility', value: 90, color: '#1084d0' },
    { label: 'Best Practices', value: 95, color: '#ffb000' },
    { label: 'SEO', value: 100, color: '#a855f7' },
  ];

  const specs = [
    { label: 'OS Version', value: `umesh.OS ${getOSVersion()}` },
    { label: 'Framework', value: 'Astro 5.17 + React 19' },
    { label: 'Rendering', value: 'Three.js (React Three Fiber)' },
    { label: 'Styling', value: 'Tailwind CSS 4' },
    { label: 'Language', value: 'TypeScript 5.9 (Strict)' },
    { label: 'Build Tool', value: 'Vite' },
    { label: 'Package Manager', value: 'pnpm' },
    { label: 'Output', value: 'Static (0 server cost)' },
    { label: 'AI Powered', value: 'Cursor + Claude' },
    { label: 'Experience', value: `${getYearsOfExperience()}+ years` },
  ];

  const bundles = [
    { name: 'React + React DOM', size: '57 KB', gzip: true },
    { name: 'Three.js + R3F', size: '290 KB', gzip: true },
    { name: 'Desktop App', size: '12 KB', gzip: true },
    { name: 'Page Content', size: '~2 KB each', gzip: true },
    { name: 'Total First Load', size: '~75 KB', gzip: true },
  ];

  return (
    <div style={{ padding: '16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', background: '#c0c0c0', minHeight: '100%' }}>
      {/* Tabs-like header */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '-1px' }}>
        <div className="win95-raised" style={{ padding: '4px 16px', fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid #c0c0c0', position: 'relative', zIndex: 1 }}>
          General
        </div>
        <div style={{ padding: '4px 16px', fontSize: '11px', color: '#808080', cursor: 'default' }}>Performance</div>
        <div style={{ padding: '4px 16px', fontSize: '11px', color: '#808080', cursor: 'default' }}>Hardware</div>
      </div>

      <div className="win95-sunken" style={{ padding: '16px', background: '#c0c0c0' }}>
        {/* Computer icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #808080' }}>
          <span style={{ fontSize: '36px' }}>🖥️</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>umesh.OS {getOSVersion()}</div>
            <div style={{ color: '#808080', fontSize: '11px' }}>Personal Portfolio Operating System</div>
            <div style={{ color: '#808080', fontSize: '11px' }}>&copy; {getCopyright()} Umesh Malik. All rights reserved.</div>
          </div>
        </div>

        {/* Lighthouse Scores */}
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Lighthouse Scores (target):</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {scores.map((s) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '8px', border: '1px solid #808080' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: s.value >= 90 ? '#008000' : s.value >= 50 ? '#ff8c00' : '#ff0000' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* System Specs */}
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>System Specifications:</div>
        <div className="win95-sunken" style={{ padding: '8px', marginBottom: '12px', background: 'white' }}>
          {specs.map((s) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: '#555' }}>{s.label}:</span>
              <span style={{ fontWeight: 'bold' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Bundle Sizes */}
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Bundle Sizes (gzipped):</div>
        <div className="win95-sunken" style={{ padding: '8px', background: 'white' }}>
          {bundles.map((b) => (
            <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: '#555' }}>{b.name}</span>
              <span style={{ fontWeight: 'bold', color: '#008000' }}>{b.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
