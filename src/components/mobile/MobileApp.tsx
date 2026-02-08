import { useState, useCallback, useEffect } from 'react';
import AboutContent from '../pages/AboutContent';
import ExperienceContent from '../pages/ExperienceContent';
import ProjectsContent from '../pages/ProjectsContent';
import ContactContent from '../pages/ContactContent';
import GitHubContent from '../pages/GitHubContent';
import NotepadContent from '../pages/NotepadContent';
import { getTimeGreeting } from '../../data/dynamic';
import { useAchievements } from '../../hooks/useAchievements';
import AchievementToast from '../ui/AchievementToast';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'about', label: 'About', icon: '👤' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'contact', label: 'Contact', icon: '📧' },
];

interface SkillBar {
  name: string;
  level: number;
  color: string;
}

const SKILLS: SkillBar[] = [
  { name: 'React / Next.js', level: 95, color: '#61dafb' },
  { name: 'TypeScript', level: 92, color: '#3178c6' },
  { name: 'Node.js', level: 85, color: '#68a063' },
  { name: 'Three.js / WebGL', level: 75, color: '#00ff41' },
  { name: 'CSS / Tailwind', level: 90, color: '#a855f7' },
  { name: 'GraphQL', level: 78, color: '#e535ab' },
  { name: 'AWS / Cloud', level: 72, color: '#ff9900' },
  { name: 'AI / LLM Tools', level: 88, color: '#ffb000' },
];

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState('home');
  const { unlock, newAchievement } = useAchievements();

  useEffect(() => {
    unlock('first-boot');
  }, [unlock]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontFamily: "'Press Start 2P', monospace", color: '#00ff41', marginBottom: '8px' }}>
              {getTimeGreeting()}!
            </div>
            <div style={{ fontSize: '20px', fontFamily: "'Press Start 2P', monospace", color: 'white', marginBottom: '16px' }}>
              umesh.OS
            </div>
            <div style={{ color: '#c0c0c0', fontSize: '14px', fontFamily: "'VT323', monospace", lineHeight: 1.5, marginBottom: '24px' }}>
              Umesh Malik<br />
              Senior Frontend Engineer<br />
              Full-Stack Developer
            </div>

            {/* Skills as retro progress bars */}
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#00ff41', marginBottom: '12px' }}>
                {'>'} SKILL LEVELS
              </div>
              {SKILLS.map((skill) => (
                <div key={skill.name} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: "'VT323', monospace", color: '#c0c0c0', marginBottom: '2px' }}>
                    <span>{skill.name}</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div style={{
                    height: '12px',
                    background: '#333',
                    border: '1px solid #555',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${skill.level}%`,
                      background: skill.color,
                      transition: 'width 1s ease',
                      imageRendering: 'pixelated' as any,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { icon: '🐙', label: 'GitHub', action: () => window.open('https://github.com/Umeshmalik', '_blank') },
                { icon: '💼', label: 'LinkedIn', action: () => window.open('https://linkedin.com/in/umeshmalik', '_blank') },
                { icon: '📧', label: 'Email', action: () => setActiveTab('contact') },
                { icon: '📄', label: 'Resume', action: () => { const a = document.createElement('a'); a.href = '/Umesh-Malik-Resume.pdf'; a.download = 'Umesh-Malik-Resume.pdf'; a.click(); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="win95-raised"
                  style={{
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    cursor: 'pointer',
                    background: '#c0c0c0',
                    color: '#000',
                    border: 'none',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Blog preview */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#ffb000', marginBottom: '12px', textAlign: 'left' }}>
                {'>'} LATEST THOUGHTS
              </div>
              <NotepadContent />
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="mobile-app-card">
            <div className="mobile-app-card-title">
              <span>👤</span> about.exe
            </div>
            <div className="mobile-app-card-content">
              <AboutContent />
            </div>
          </div>
        );

      case 'work':
        return (
          <>
            <div className="mobile-app-card">
              <div className="mobile-app-card-title">
                <span>💼</span> career.exe
              </div>
              <div className="mobile-app-card-content">
                <ExperienceContent />
              </div>
            </div>
            <div className="mobile-app-card" style={{ marginTop: '8px' }}>
              <div className="mobile-app-card-title">
                <span>🐙</span> github.exe
              </div>
              <div className="mobile-app-card-content">
                <GitHubContent />
              </div>
            </div>
          </>
        );

      case 'projects':
        return (
          <div className="mobile-app-card">
            <div className="mobile-app-card-title">
              <span>📁</span> projects.exe
            </div>
            <div className="mobile-app-card-content">
              <ProjectsContent />
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="mobile-app-card">
            <div className="mobile-app-card-title">
              <span>📧</span> mail.exe
            </div>
            <div className="mobile-app-card-content">
              <ContactContent />
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#008080' }}>
      {/* Content Area */}
      <div className="mobile-card-view">
        {renderContent()}
      </div>

      {/* Bottom Tab Bar */}
      <div className="mobile-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievement Toast */}
      <AchievementToast achievement={newAchievement} />
    </div>
  );
}
