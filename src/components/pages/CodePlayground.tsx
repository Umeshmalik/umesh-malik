import { useState, useRef } from 'react';

const DEMOS = [
  {
    name: 'React Counter',
    lang: 'jsx',
    code: `function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{textAlign:'center',padding:'40px',fontFamily:'monospace'}}>
      <h2 style={{color:'#00ff41'}}>Count: {count}</h2>
      <button onClick={() => setCount(c => c + 1)}
        style={{padding:'8px 24px',fontSize:'16px',cursor:'pointer',margin:'4px'}}>
        +1
      </button>
      <button onClick={() => setCount(0)}
        style={{padding:'8px 24px',fontSize:'16px',cursor:'pointer',margin:'4px'}}>
        Reset
      </button>
    </div>
  );
}
ReactDOM.render(<Counter />, document.getElementById('root'));`,
  },
  {
    name: 'CSS Animation',
    lang: 'html',
    code: `<style>
  body { background: #0a0a0a; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
  .box { width: 60px; height: 60px; background: #00ff41; border-radius: 8px;
    animation: spin 2s ease-in-out infinite, pulse 2s ease-in-out infinite; }
  @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 20px #00ff41} 50%{opacity:0.6;box-shadow:0 0 40px #00ff41} }
</style>
<div class="box"></div>`,
  },
  {
    name: 'Fetch API Demo',
    lang: 'html',
    code: `<style>
  body { background: #0a0a0a; color: #00ff41; font-family: monospace; padding: 20px; margin: 0; }
  pre { background: #111; padding: 12px; border: 1px solid #333; overflow: auto; font-size: 13px; }
  button { background: #000080; color: white; border: 2px outset #c0c0c0; padding: 6px 16px; cursor: pointer; font-family: monospace; }
</style>
<h3>GitHub API Fetch</h3>
<button onclick="fetchData()">Fetch Umesh's GitHub Profile</button>
<pre id="output">Click the button to fetch data...</pre>
<script>
async function fetchData() {
  document.getElementById('output').textContent = 'Loading...';
  try {
    const res = await fetch('https://api.github.com/users/Umeshmalik');
    const data = await res.json();
    document.getElementById('output').textContent = JSON.stringify({
      name: data.name, repos: data.public_repos,
      followers: data.followers, bio: data.bio
    }, null, 2);
  } catch(e) {
    document.getElementById('output').textContent = 'Error: ' + e.message;
  }
}
</script>`,
  },
  {
    name: 'TypeScript Types',
    lang: 'html',
    code: `<style>
  body { background: #0a0a0a; color: #e0e0e0; font-family: monospace; padding: 20px; margin: 0; line-height: 1.6; }
  .keyword { color: #569cd6; } .type { color: #4ec9b0; } .string { color: #ce9178; }
  .comment { color: #6a9955; } .fn { color: #dcdcaa; } pre { font-size: 14px; }
</style>
<pre>
<span class="comment">// TypeScript makes impossible states impossible</span>

<span class="keyword">type</span> <span class="type">Status</span> = <span class="string">'idle'</span> | <span class="string">'loading'</span> | <span class="string">'success'</span> | <span class="string">'error'</span>;

<span class="keyword">type</span> <span class="type">State</span>&lt;<span class="type">T</span>&gt; =
  | { status: <span class="string">'idle'</span> }
  | { status: <span class="string">'loading'</span> }
  | { status: <span class="string">'success'</span>; data: <span class="type">T</span> }
  | { status: <span class="string">'error'</span>; error: <span class="type">Error</span> };

<span class="comment">// This pattern ensures you handle ALL states</span>
<span class="keyword">function</span> <span class="fn">render</span>(state: <span class="type">State</span>&lt;<span class="type">User</span>&gt;) {
  <span class="keyword">switch</span> (state.status) {
    <span class="keyword">case</span> <span class="string">'idle'</span>:    <span class="keyword">return</span> <span class="string">'Ready'</span>;
    <span class="keyword">case</span> <span class="string">'loading'</span>: <span class="keyword">return</span> <span class="string">'Loading...'</span>;
    <span class="keyword">case</span> <span class="string">'success'</span>: <span class="keyword">return</span> state.data.name;
    <span class="keyword">case</span> <span class="string">'error'</span>:   <span class="keyword">return</span> state.error.message;
  }
}

<span class="comment">// Try accessing state.data here — TypeScript won't let you</span>
<span class="comment">// unless you've narrowed the type first. That's the magic.</span>
</pre>
<p style="color: #808080; font-size: 12px; margin-top: 20px;">
  This is a static TypeScript code showcase — demonstrating discriminated unions and exhaustive pattern matching.
</p>`,
  },
];

export default function CodePlayground() {
  const [selectedDemo, setSelectedDemo] = useState(0);
  const [code, setCode] = useState(DEMOS[0].code);
  const [output, setOutput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectDemo = (i: number) => {
    setSelectedDemo(i);
    setCode(DEMOS[i].code);
    setOutput('');
  };

  const runCode = () => {
    const demo = DEMOS[selectedDemo];
    let html: string;
    if (demo.lang === 'jsx') {
      html = `<!DOCTYPE html><html><head>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
</head><body style="margin:0;background:#0a0a0a;color:white">
<div id="root"></div>
<script type="text/babel">${code}<\/script>
</body></html>`;
    } else {
      html = `<!DOCTYPE html><html><head></head><body style="margin:0">${code}</body></html>`;
    }
    setOutput(html);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '2px', padding: '4px 4px 0', background: '#252526', flexWrap: 'wrap' }}>
        {DEMOS.map((d, i) => (
          <button
            key={i}
            onClick={() => selectDemo(i)}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              background: selectedDemo === i ? '#1e1e1e' : '#2d2d2d',
              color: selectedDemo === i ? '#fff' : '#808080',
              border: 'none',
              borderTop: selectedDemo === i ? '2px solid #007acc' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Editor + Preview */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Code Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              background: '#1e1e1e',
              color: '#d4d4d4',
              border: 'none',
              outline: 'none',
              padding: '12px',
              fontFamily: "'VT323', monospace",
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'none',
              tabSize: 2,
            }}
          />
          <button
            onClick={runCode}
            style={{
              background: '#007acc',
              color: 'white',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              letterSpacing: '1px',
            }}
          >
            RUN CODE
          </button>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '4px 8px', background: '#252526', color: '#808080', fontSize: '10px' }}>OUTPUT</div>
          {output ? (
            <iframe
              ref={iframeRef}
              srcDoc={output}
              sandbox="allow-scripts"
              style={{ flex: 1, border: 'none', background: 'white' }}
              title="Code output"
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px', fontFamily: "'VT323', monospace" }}>
              Click "RUN CODE" to see output
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
