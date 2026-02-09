import { useState } from 'react';
import { projects } from '../../data/resume';

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  size?: string;
  content?: string;
}

export default function ProjectsContent() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [currentPath, setCurrentPath] = useState('C:\\Users\\Umesh\\Projects');

  const getProjectFiles = (projectIndex: number): FileItem[] => {
    const project = projects[projectIndex];
    return [
      { name: 'README.md', type: 'file', size: '2 KB', content: project.description },
      {
        name: 'tech-stack.txt',
        type: 'file',
        size: '1 KB',
        content: project.tech.join(', '),
      },
      {
        name: 'highlights.log',
        type: 'file',
        size: '3 KB',
        content: project.highlights.join('\n'),
      },
      ...(project.url
        ? [{ name: 'demo.lnk', type: 'file' as const, size: '1 KB', content: project.url }]
        : []),
    ];
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '12px',
        background: '#c0c0c0',
      }}
    >
      {/* Address Bar */}
      <div
        style={{
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #808080',
        }}
      >
        <span style={{ fontSize: '11px' }}>Address</span>
        <div
          className="win95-sunken"
          style={{
            flex: 1,
            padding: '2px 6px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '14px' }}>📁</span>
          {selectedProject !== null
            ? `${currentPath}\\${projects[selectedProject].name}`
            : currentPath}
        </div>
        {selectedProject !== null && (
          <button
            className="win95-button"
            onClick={() => setSelectedProject(null)}
            style={{ fontSize: '11px', minWidth: '40px', height: '22px' }}
          >
            ← Up
          </button>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar - Folder Tree */}
        <div
          style={{
            width: '180px',
            overflow: 'auto',
            padding: '8px',
            borderRight: '2px solid #808080',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '4px',
              fontWeight: 'bold',
            }}
          >
            <span>📂</span> Projects
          </div>
          {projects.map((project, i) => (
            <div
              key={i}
              onClick={() => setSelectedProject(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 4px 2px 20px',
                cursor: 'pointer',
                background: selectedProject === i ? '#000080' : 'transparent',
                color: selectedProject === i ? 'white' : 'black',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '11px',
              }}
            >
              <span>{selectedProject === i ? '📂' : '📁'}</span>
              {project.name}
            </div>
          ))}
        </div>

        {/* File Listing */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {selectedProject === null ? (
            // Show project folders
            <div
              style={{
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, 100px)',
                gap: '16px',
                background: 'white',
                minHeight: '100%',
              }}
            >
              {projects.map((project, i) => (
                <div
                  key={i}
                  onDoubleClick={() => setSelectedProject(i)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0e0ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📁</span>
                  <span style={{ fontSize: '11px', wordBreak: 'break-word', lineHeight: '1.2' }}>
                    {project.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            // Show files in selected project
            <div style={{ background: 'white', minHeight: '100%' }}>
              {/* File list header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr 80px 120px',
                  padding: '4px 8px',
                  borderBottom: '2px solid #c0c0c0',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: '#c0c0c0',
                }}
              >
                <span></span>
                <span>Name</span>
                <span>Size</span>
                <span>Type</span>
              </div>

              {getProjectFiles(selectedProject).map((file, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 80px 120px',
                    padding: '3px 8px',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '11px',
                    cursor: 'pointer',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000080';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'black';
                  }}
                  onClick={() => {
                    if (file.name === 'demo.lnk' && file.content) {
                      window.open(file.content, '_blank');
                    }
                  }}
                >
                  <span style={{ fontSize: '14px' }}>
                    {file.name.endsWith('.md') ? '📄' :
                     file.name.endsWith('.txt') ? '📃' :
                     file.name.endsWith('.log') ? '📋' :
                     file.name.endsWith('.lnk') ? '🔗' : '📄'}
                  </span>
                  <span>{file.name}</span>
                  <span>{file.size}</span>
                  <span>
                    {file.name.endsWith('.md') ? 'Markdown' :
                     file.name.endsWith('.txt') ? 'Text' :
                     file.name.endsWith('.log') ? 'Log File' :
                     file.name.endsWith('.lnk') ? 'Shortcut' : 'File'}
                  </span>
                </div>
              ))}

              {/* File Preview */}
              <div
                style={{
                  margin: '12px',
                  padding: '12px',
                  background: '#0a0a0a',
                  color: '#00ff41',
                  fontFamily: "'VT323', monospace",
                  fontSize: '14px',
                  border: '1px solid #333',
                  minHeight: '120px',
                }}
              >
                <div style={{ color: '#ffb000', marginBottom: '8px', fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}>
                  {'>'} PROJECT DETAILS
                </div>
                <div style={{ color: '#1084d0', marginBottom: '4px' }}>
                  {projects[selectedProject].name}
                </div>
                <div style={{ color: '#aaaaaa', marginBottom: '12px' }}>
                  {projects[selectedProject].description}
                </div>
                <div style={{ color: '#808080', marginBottom: '4px' }}>Tech Stack:</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {projects[selectedProject].tech.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '2px 8px',
                        border: '1px solid #333',
                        color: '#00ff41',
                        fontSize: '13px',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div style={{ color: '#808080', marginBottom: '4px' }}>Highlights:</div>
                {projects[selectedProject].highlights.map((h, i) => (
                  <div key={i} style={{ color: '#aaaaaa', paddingLeft: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#00ff41' }}>{'>'}</span> {h}
                  </div>
                ))}
                {projects[selectedProject].url && (
                  <div style={{ marginTop: '12px' }}>
                    <a
                      href={projects[selectedProject].url}
                      target="_blank"
                      rel="noopener"
                      style={{ color: '#1084d0', textDecoration: 'none' }}
                    >
                      [🔗 Live Demo]
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="win95-sunken"
        style={{
          padding: '2px 8px',
          fontSize: '11px',
          margin: '2px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {selectedProject !== null
            ? `${getProjectFiles(selectedProject).length} object(s)`
            : `${projects.length} object(s)`}
        </span>
        <span>umesh.OS Explorer</span>
      </div>
    </div>
  );
}
