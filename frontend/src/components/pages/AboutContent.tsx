import { useEffect, useRef, useState } from 'react';
import { personalInfo, education, awards } from '../../data/resume';
import { getSummary } from '../../data/dynamic';

function TypeWriter({ text, speed = 20, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span>
      {displayed}
      {indexRef.current < text.length && <span className="typing-cursor" />}
    </span>
  );
}

export default function AboutContent() {
  const [section, setSection] = useState(0);

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: "'VT323', monospace",
        background: '#0a0a0a',
        color: '#00ff41',
        minHeight: '100%',
        lineHeight: '1.6',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '24px',
            fontFamily: "'Press Start 2P', monospace",
            color: '#00ff41',
            textShadow: '0 0 10px rgba(0,255,65,0.5)',
            marginBottom: '8px',
          }}
        >
          {personalInfo.name}
        </div>
        <div style={{ fontSize: '16px', color: '#1084d0' }}>{personalInfo.title}</div>
        <div style={{ fontSize: '14px', color: '#808080', marginTop: '4px' }}>
          {personalInfo.location}
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '12px',
            fontFamily: "'Press Start 2P', monospace",
            color: '#ffb000',
            marginBottom: '12px',
            borderBottom: '1px solid #333',
            paddingBottom: '4px',
          }}
        >
          {'>'} PROFESSIONAL SUMMARY
        </div>
        <div style={{ fontSize: '16px', color: '#aaaaaa' }}>
          {section >= 0 && <TypeWriter text={getSummary()} speed={8} onComplete={() => setSection(1)} />}
        </div>
      </div>

      {/* Links */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <a
          href={personalInfo.github}
          target="_blank"
          rel="noopener"
          style={{ color: '#1084d0', textDecoration: 'none', fontSize: '15px' }}
        >
          [GitHub]
        </a>
        <a
          href={personalInfo.linkedin}
          target="_blank"
          rel="noopener"
          style={{ color: '#1084d0', textDecoration: 'none', fontSize: '15px' }}
        >
          [LinkedIn]
        </a>
        <a
          href={`mailto:${personalInfo.email}`}
          style={{ color: '#1084d0', textDecoration: 'none', fontSize: '15px' }}
        >
          [Email]
        </a>
      </div>

      {/* Education */}
      {section >= 1 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '12px',
              fontFamily: "'Press Start 2P', monospace",
              color: '#ffb000',
              marginBottom: '12px',
              borderBottom: '1px solid #333',
              paddingBottom: '4px',
            }}
          >
            {'>'} EDUCATION
          </div>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '12px', paddingLeft: '16px', borderLeft: '2px solid #333' }}>
              <div style={{ color: '#00ff41', fontSize: '16px' }}>{edu.degree}</div>
              <div style={{ color: '#808080', fontSize: '14px' }}>{edu.institution}</div>
              <div style={{ color: '#555', fontSize: '14px' }}>{edu.period}</div>
            </div>
          ))}
        </div>
      )}

      {/* Awards */}
      {section >= 1 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '12px',
              fontFamily: "'Press Start 2P', monospace",
              color: '#ffb000',
              marginBottom: '12px',
              borderBottom: '1px solid #333',
              paddingBottom: '4px',
            }}
          >
            {'>'} AWARDS & RECOGNITION
          </div>
          {awards.map((award, i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                border: '1px solid #ffb000',
                boxShadow: '0 0 10px rgba(255,176,0,0.2)',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🏆</span>
                <div>
                  <div style={{ color: '#ffb000', fontSize: '16px', fontWeight: 'bold' }}>{award.title}</div>
                  <div style={{ color: '#808080', fontSize: '14px' }}>
                    {award.company} | {award.date}
                  </div>
                  <div style={{ color: '#aaaaaa', fontSize: '14px', marginTop: '4px' }}>
                    {award.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Section */}
      {section >= 1 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '12px',
              fontFamily: "'Press Start 2P', monospace",
              color: '#a855f7',
              marginBottom: '12px',
              borderBottom: '1px solid #333',
              paddingBottom: '4px',
            }}
          >
            {'>'} AI-POWERED DEVELOPMENT
          </div>

          <div
            style={{
              padding: '16px',
              border: '1px solid #a855f7',
              boxShadow: '0 0 15px rgba(168,85,247,0.2)',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>🤖</span>
              <div style={{ color: '#a855f7', fontSize: '16px', fontWeight: 'bold' }}>
                How I Leverage AI
              </div>
            </div>

            <div style={{ color: '#aaaaaa', fontSize: '14px', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#a855f7' }}>{'>'}</span> This entire website was <span style={{ color: '#00ff41' }}>vibe-coded</span> using <span style={{ color: '#a855f7' }}>Cursor AI + Claude</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#a855f7' }}>{'>'}</span> I describe the vision, AI handles the implementation — then I iterate, refine, and direct
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#a855f7' }}>{'>'}</span> 30+ React components, 3D scenes, easter eggs, and a full window manager — built in a single session
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#a855f7' }}>{'>'}</span> AI tools I use daily: <span style={{ color: '#1084d0' }}>Cursor IDE, Claude, GitHub Copilot, ChatGPT</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#a855f7' }}>{'>'}</span> AI doesn't replace developers — it amplifies creative engineers who know <em>what</em> to build
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '8px',
            }}
          >
            {[
              { name: 'Cursor AI', icon: '⚡' },
              { name: 'Claude', icon: '🧠' },
              { name: 'GitHub Copilot', icon: '🤖' },
              { name: 'ChatGPT', icon: '💬' },
              { name: 'Prompt Engineering', icon: '🎯' },
              { name: 'Vibe Coding', icon: '🎨' },
            ].map((tool) => (
              <div
                key={tool.name}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #333',
                  textAlign: 'center',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{tool.icon}</div>
                <div style={{ color: '#a855f7' }}>{tool.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASCII art footer */}
      <div style={{ marginTop: '32px', color: '#333', fontSize: '14px', textAlign: 'center' }}>
        <pre>{`
  ╔══════════════════════════════════╗
  ║   End of about.exe output       ║
  ║   Type 'ai' in terminal for     ║
  ║   the full AI story!            ║
  ╚══════════════════════════════════╝
        `}</pre>
      </div>
    </div>
  );
}
