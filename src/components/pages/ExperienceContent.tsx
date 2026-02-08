import { useEffect, useRef, useState } from 'react';
import { experiences } from '../../data/resume';
import { getYearsOfExperience } from '../../data/dynamic';

function AnimatedCounter({ target, label, suffix = '' }: { target: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          let current = 0;
          const step = Math.ceil(target / 60);
          const interval = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(interval);
            } else {
              setCount(current);
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: '28px',
          fontFamily: "'Press Start 2P', monospace",
          color: '#00ff41',
          textShadow: '0 0 10px rgba(0,255,65,0.5)',
        }}
      >
        {count}{suffix}
      </div>
      <div style={{ fontSize: '12px', color: '#808080', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function TimelineCard({ experience, index }: { experience: typeof experiences[0]; index: number }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Simulate "installing" progress
          let p = 0;
          const interval = setInterval(() => {
            p += Math.random() * 15 + 5;
            if (p >= 100) {
              setProgress(100);
              clearInterval(interval);
              setTimeout(() => setVisible(true), 200);
            } else {
              setProgress(p);
            }
          }, 80);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '32px',
        opacity: progress > 0 ? 1 : 0.3,
        transition: 'opacity 0.3s',
      }}
    >
      {/* Timeline line */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '40px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: visible ? '#000080' : '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            border: `2px solid ${visible ? '#00ff41' : '#555'}`,
            transition: 'all 0.3s',
            boxShadow: visible ? '0 0 10px rgba(0,255,65,0.3)' : 'none',
          }}
        >
          {experience.icon}
        </div>
        <div
          style={{
            width: '2px',
            flex: 1,
            background: 'linear-gradient(to bottom, #333, transparent)',
            marginTop: '4px',
          }}
        />
      </div>

      {/* Card */}
      <div style={{ flex: 1 }}>
        {/* Window chrome */}
        <div
          style={{
            borderTop: '2px solid #ffffff',
            borderLeft: '2px solid #ffffff',
            borderBottom: '2px solid #000000',
            borderRight: '2px solid #000000',
            background: '#c0c0c0',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              background: visible
                ? 'linear-gradient(90deg, #000080, #1084d0)'
                : 'linear-gradient(90deg, #808080, #b5b5b5)',
              color: 'white',
              padding: '3px 8px',
              fontSize: '12px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{experience.company} - {experience.role}</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <span style={{ background: '#c0c0c0', color: '#000', padding: '0 4px', fontSize: '10px' }}>_</span>
              <span style={{ background: '#c0c0c0', color: '#000', padding: '0 4px', fontSize: '10px' }}>□</span>
              <span style={{ background: '#c0c0c0', color: '#000', padding: '0 4px', fontSize: '10px' }}>x</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '12px', background: '#0a0a0a' }}>
            {!visible && (
              <div>
                <div style={{ fontSize: '12px', color: '#808080', marginBottom: '6px', fontFamily: "'VT323', monospace" }}>
                  Installing {experience.company.toLowerCase()}.exe...
                </div>
                <div className="pixel-progress" style={{ width: '100%' }}>
                  <div
                    className="pixel-progress-fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {visible && (
              <div style={{ fontFamily: "'VT323', monospace" }}>
                <div style={{ color: '#808080', fontSize: '14px', marginBottom: '4px' }}>
                  {experience.period} | {experience.location}
                </div>
                <ul style={{ margin: '8px 0', paddingLeft: '16px', listStyle: 'none' }}>
                  {experience.highlights.map((h, i) => (
                    <li
                      key={i}
                      style={{
                        color: '#aaaaaa',
                        fontSize: '14px',
                        marginBottom: '6px',
                        paddingLeft: '12px',
                        borderLeft: '2px solid #333',
                        animation: `fadeIn 0.3s ease ${i * 0.1}s both`,
                      }}
                    >
                      <span style={{ color: '#00ff41' }}>{'>'}</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default function ExperienceContent() {
  return (
    <div
      style={{
        padding: '24px',
        background: '#0a0a0a',
        minHeight: '100%',
        fontFamily: "'VT323', monospace",
        color: '#00ff41',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '16px',
            fontFamily: "'Press Start 2P', monospace",
            color: '#00ff41',
            textShadow: '0 0 10px rgba(0,255,65,0.5)',
            marginBottom: '8px',
          }}
        >
          CAREER.EXE
        </div>
        <div style={{ fontSize: '14px', color: '#808080' }}>Professional Experience Timeline</div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          marginBottom: '40px',
          flexWrap: 'wrap',
          padding: '20px',
          border: '1px solid #333',
        }}
      >
        <AnimatedCounter target={getYearsOfExperience()} label="Years Experience" suffix="+" />
        <AnimatedCounter target={10} label="Monthly Transactions" suffix="M+" />
        <AnimatedCounter target={19000} label="Zipcodes Managed" suffix="+" />
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {experiences.map((exp, i) => (
          <TimelineCard key={i} experience={exp} index={i} />
        ))}
      </div>

      {/* End marker */}
      <div style={{ textAlign: 'center', color: '#333', marginTop: '20px' }}>
        <div style={{ fontSize: '24px' }}>🚀</div>
        <div style={{ fontSize: '14px' }}>The journey continues...</div>
      </div>
    </div>
  );
}
