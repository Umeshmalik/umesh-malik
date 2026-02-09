import { useState, useEffect } from 'react';

interface GitHubUser {
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  avatar_url: string;
  bio: string;
}

interface GitHubEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: any;
}

const USERNAME = 'Umeshmalik';

export default function GitHubContent() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, eventsRes] = await Promise.all([
          fetch(`https://api.github.com/users/${USERNAME}`),
          fetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=15`),
        ]);
        if (!userRes.ok) throw new Error('API limit reached');
        setUser(await userRes.json());
        setEvents(await eventsRes.json());
      } catch (e: any) {
        setError(e.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getEventLabel = (e: GitHubEvent) => {
    switch (e.type) {
      case 'PushEvent': return `Pushed ${e.payload?.commits?.length || 0} commit(s)`;
      case 'CreateEvent': return `Created ${e.payload?.ref_type || 'repo'}`;
      case 'WatchEvent': return 'Starred repo';
      case 'ForkEvent': return 'Forked repo';
      case 'PullRequestEvent': return `${e.payload?.action} PR`;
      case 'IssuesEvent': return `${e.payload?.action} issue`;
      case 'IssueCommentEvent': return 'Commented on issue';
      case 'DeleteEvent': return `Deleted ${e.payload?.ref_type}`;
      default: return e.type.replace('Event', '');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div style={{ background: '#0a0a0a', color: '#00ff41', fontFamily: "'VT323', monospace", padding: '16px', minHeight: '100%' }}>
      <div style={{ fontSize: '12px', fontFamily: "'Press Start 2P', monospace", color: '#00ff41', textShadow: '0 0 10px rgba(0,255,65,0.5)', marginBottom: '16px', textAlign: 'center' }}>
        GITHUB SYSTEM MONITOR
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#808080' }}>
          <div style={{ marginBottom: '12px' }}>Fetching data from api.github.com...</div>
          <div className="pixel-progress" style={{ width: '200px', margin: '0 auto' }}>
            <div className="pixel-progress-fill" style={{ width: '60%', animation: 'pulse 1s ease infinite' }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ff4040' }}>
          ERROR: {error}<br />
          <span style={{ color: '#808080', fontSize: '14px' }}>GitHub API rate limit may have been reached. Try again later.</span>
        </div>
      )}

      {user && !loading && (
        <>
          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px', padding: '12px', border: '1px solid #333' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#00ff41' }}>{user.public_repos}</div>
              <div style={{ fontSize: '12px', color: '#808080' }}>Repos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#1084d0' }}>{user.followers}</div>
              <div style={{ fontSize: '12px', color: '#808080' }}>Followers</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ffb000' }}>{user.following}</div>
              <div style={{ fontSize: '12px', color: '#808080' }}>Following</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#a855f7' }}>{new Date(user.created_at).getFullYear()}</div>
              <div style={{ fontSize: '12px', color: '#808080' }}>Since</div>
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ fontSize: '12px', fontFamily: "'Press Start 2P', monospace", color: '#ffb000', marginBottom: '8px' }}>
            {'>'} RECENT ACTIVITY
          </div>
          <div style={{ border: '1px solid #333', maxHeight: '260px', overflow: 'auto' }}>
            {events.length === 0 && <div style={{ padding: '12px', color: '#808080' }}>No recent public activity</div>}
            {events.map((event, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderBottom: '1px solid #1a1a1a',
                  fontSize: '14px',
                  gap: '8px',
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  <span style={{ color: '#1084d0' }}>{getEventLabel(event)}</span>
                  {' '}
                  <span style={{ color: '#808080' }}>in</span>
                  {' '}
                  <span style={{ color: '#00ff41' }}>{event.repo.name.split('/')[1]}</span>
                </div>
                <span style={{ color: '#555', flexShrink: 0, fontSize: '13px' }}>{timeAgo(event.created_at)}</span>
              </div>
            ))}
          </div>

          {/* Link */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a href={`https://github.com/${USERNAME}`} target="_blank" rel="noopener" style={{ color: '#1084d0', textDecoration: 'none', fontSize: '14px' }}>
              [View full profile on GitHub]
            </a>
          </div>
        </>
      )}
    </div>
  );
}
