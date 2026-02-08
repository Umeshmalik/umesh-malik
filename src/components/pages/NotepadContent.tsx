import { useState } from 'react';

interface Post {
  title: string;
  date: string;
  content: string;
}

const POSTS: Post[] = [
  {
    title: 'Why I Migrated Vue.js to React at Expedia',
    date: '2024-09-15',
    content: `When I joined Expedia Group, the Workflow Orchestration Platform was built on Vue.js. It worked, but the team was growing and we needed better type safety, a richer component ecosystem, and faster developer onboarding.

The migration wasn't a "rewrite everything" approach. We went incremental:
1. Set up React alongside Vue using a microfrontend bridge
2. Built a shared component library in React + TypeScript first
3. Migrated page by page, starting with the least complex
4. Wrote comprehensive tests before touching any page

Result: Developer velocity went up ~40%, onboarding time dropped from 2 weeks to 3 days, and TypeScript caught bugs that had been hiding in production for months.

Key lesson: Never migrate for the sake of migrating. We had concrete metrics that justified every decision.`,
  },
  {
    title: 'Lessons from Processing $10M+ Monthly at BYJU\'S',
    date: '2023-02-20',
    content: `At BYJU's, I led the Order & Payment Validation modules that processed over $10M in monthly transactions. Here's what I learned about building high-reliability financial systems:

1. NEVER trust the client. Every amount, every discount, every coupon was re-validated server-side.

2. Idempotency keys are non-negotiable. Payment retries happen. Duplicate charges destroy trust.

3. Build for failure. We had circuit breakers, retry queues, and dead letter queues for every payment gateway integration.

4. Monitoring > Testing. We had 90%+ test coverage, but it was our real-time dashboards that caught the issues tests couldn't predict.

5. The pincode system (19,000+ entries) taught me that "simple CRUD" at scale is never simple. We built fuzzy search, validation chains, and regional fallback logic.

The biggest lesson: In fintech, boring reliable code beats clever code every single time.`,
  },
  {
    title: 'How AI Changed My Development Workflow',
    date: '2025-06-10',
    content: `I used to be skeptical about AI coding tools. "It'll write bad code," I thought. I was wrong — but not in the way you'd expect.

AI didn't make me write less code. It made me think more about WHAT to build and less about HOW to type it.

My current workflow:
- Cursor AI + Claude for architecture and multi-file changes
- GitHub Copilot for inline completions and boilerplate
- ChatGPT for debugging weird edge cases and rubber-ducking

This very website (umesh.OS) was built in a single session using Cursor AI. I described the retro OS vision, and AI helped implement 30+ React components, 3D scenes, a terminal emulator, and 13 easter eggs.

But here's the key: AI is a force multiplier, not a replacement. You still need to:
- Know what good architecture looks like
- Review every line AI writes
- Understand WHY the code works, not just THAT it works
- Direct the AI with precise, thoughtful prompts

The engineers who'll thrive aren't the ones who ignore AI — they're the ones who learn to direct it like a senior engineer directs a junior developer.`,
  },
  {
    title: 'The Art of Component Architecture',
    date: '2024-03-05',
    content: `After building component libraries at both Tekion and Expedia, here's my framework for designing components that actually get reused:

1. THE RULE OF THREE: Don't abstract until you've built the same thing 3 times. Premature abstraction kills more codebases than code duplication.

2. PROPS DOWN, EVENTS UP: Components should be controlled by their parents. Internal state is a last resort.

3. COMPOSITION > CONFIGURATION: Instead of a <Button variant="primary" size="lg" icon="star" loading>, build <Button><Icon name="star"/><Spinner/> Save</Button>.

4. TEST THE CONTRACT, NOT THE IMPLEMENTATION: Your tests should break when the component's behavior changes, not when you refactor internals.

5. DOCUMENT WITH STORIES: If it doesn't have a Storybook story, it doesn't exist.

The component library I built at Expedia is used by 5+ teams across the platform. The secret? I spent more time on the API design than the implementation.`,
  },
  {
    title: 'Performance Optimization: The 80/20 Rule',
    date: '2024-11-18',
    content: `Every team I've been on has had a "make it faster" moment. Here's what actually moves the needle vs. what's just bike-shedding:

THE 80% (do these first):
- Code splitting / lazy loading routes → instant 30-50% bundle reduction
- Image optimization (WebP, lazy loading, srcset) → huge for LCP
- Memoize expensive computations (useMemo, React.memo) → stop unnecessary re-renders
- Virtualize long lists (react-window) → DOM node count matters

THE 20% (do these if you need more):
- Service workers for offline caching
- Preloading critical resources
- Server-side rendering for FCP
- Custom font loading strategies

WHAT DOESN'T MATTER (stop debating these):
- Which state management library is "faster"
- Micro-optimizing individual functions
- Switching frameworks for "performance"

At Tekion, our biggest win was simply lazy-loading the Finance & Insurance module. One import() statement saved 200KB from the initial bundle. Sometimes the simplest fix is the best one.`,
  },
];

export default function NotepadContent() {
  const [selectedPost, setSelectedPost] = useState(0);
  const post = POSTS[selectedPost];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', background: '#c0c0c0' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px 8px', borderBottom: '1px solid #808080', flexWrap: 'wrap' }}>
        {POSTS.map((p, i) => (
          <button
            key={i}
            className="win95-button"
            onClick={() => setSelectedPost(i)}
            style={{
              fontSize: '10px',
              height: '22px',
              padding: '2px 6px',
              fontWeight: selectedPost === i ? 'bold' : 'normal',
              background: selectedPost === i ? '#e0e0e0' : undefined,
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {p.title.slice(0, 25)}...
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '16px', fontFamily: "'VT323', monospace", fontSize: '16px', lineHeight: '1.6' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px', color: '#000080' }}>{post.title}</div>
        <div style={{ fontSize: '13px', color: '#808080', marginBottom: '16px', fontFamily: "'IBM Plex Mono', monospace" }}>{post.date}</div>
        <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{post.content}</div>
      </div>

      {/* Status */}
      <div className="win95-sunken" style={{ padding: '2px 8px', fontSize: '11px', margin: '2px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Post {selectedPost + 1} of {POSTS.length}</span>
        <span>notepad.exe</span>
      </div>
    </div>
  );
}
