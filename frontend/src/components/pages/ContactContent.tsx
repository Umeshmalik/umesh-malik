import { useState } from 'react';
import { personalInfo } from '../../data/resume';
import { getRelativeDate } from '../../data/dynamic';

const FAKE_EMAILS = [
  {
    from: 'recruiter@bigtech.com',
    subject: 'Re: Your code is absolutely amazing!',
    date: getRelativeDate(25),
    body: 'Hi Umesh, I was blown away by your portfolio. The retro OS theme is incredible! Would love to connect.',
    read: true,
  },
  {
    from: 'cto@startup.io',
    subject: 'Offer: Lead Frontend Architect',
    date: getRelativeDate(14),
    body: "We've been following your work at Expedia and would love to discuss a leadership role with us.",
    read: false,
  },
  {
    from: 'nasa@space.gov',
    subject: 'Offer: Senior Principal Engineer at NASA',
    date: getRelativeDate(5),
    body: "We need someone to build our mission control dashboard in React. You're our top choice!",
    read: false,
  },
  {
    from: 'tim@apple.com',
    subject: 'Quick question about your component library',
    date: getRelativeDate(1),
    body: 'Hey Umesh, Tim here. Loved your reusable component library approach. Can we chat?',
    read: false,
  },
];

export default function ContactContent() {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [view, setView] = useState<'inbox' | 'compose'>('compose');
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!formData.subject || !formData.message) return;
    setSent(true);
    // Create mailto link
    const mailtoUrl = `mailto:${personalInfo.email}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}`;
    window.open(mailtoUrl);
    setTimeout(() => setSent(false), 3000);
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
      {/* Toolbar */}
      <div
        style={{
          padding: '4px 8px',
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid #808080',
        }}
      >
        <button
          className="win95-button"
          onClick={() => setView('compose')}
          style={{
            fontSize: '11px',
            height: '24px',
            background: view === 'compose' ? '#e0e0e0' : undefined,
          }}
        >
          ✏️ New Mail
        </button>
        <button
          className="win95-button"
          onClick={() => setView('inbox')}
          style={{
            fontSize: '11px',
            height: '24px',
            background: view === 'inbox' ? '#e0e0e0' : undefined,
          }}
        >
          📥 Inbox ({FAKE_EMAILS.filter((e) => !e.read).length})
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {view === 'inbox' ? (
          <>
            {/* Email List */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 160px 1fr 100px',
                  padding: '4px 8px',
                  background: '#c0c0c0',
                  borderBottom: '2px solid #808080',
                  fontWeight: 'bold',
                  fontSize: '11px',
                }}
              >
                <span></span>
                <span>From</span>
                <span>Subject</span>
                <span>Date</span>
              </div>

              <div style={{ flex: 1, overflow: 'auto', background: 'white' }}>
                {FAKE_EMAILS.map((email, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedEmail(i)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px 160px 1fr 100px',
                      padding: '4px 8px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      background: selectedEmail === i ? '#000080' : 'transparent',
                      color: selectedEmail === i ? 'white' : 'black',
                      fontWeight: email.read ? 'normal' : 'bold',
                      fontSize: '11px',
                    }}
                  >
                    <span>{email.read ? '📭' : '📬'}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.from}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.subject}
                    </span>
                    <span>{email.date}</span>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {selectedEmail !== null && (
                <div
                  style={{
                    height: '150px',
                    borderTop: '2px solid #808080',
                    padding: '12px',
                    background: 'white',
                    overflow: 'auto',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {FAKE_EMAILS[selectedEmail].subject}
                  </div>
                  <div style={{ color: '#808080', marginBottom: '8px', fontSize: '11px' }}>
                    From: {FAKE_EMAILS[selectedEmail].from} | {FAKE_EMAILS[selectedEmail].date}
                  </div>
                  <div style={{ lineHeight: '1.5' }}>
                    {FAKE_EMAILS[selectedEmail].body}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Compose View */
          <div style={{ flex: 1, background: 'white', display: 'flex', flexDirection: 'column' }}>
            {/* To field */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderBottom: '1px solid #e0e0e0',
                gap: '8px',
              }}
            >
              <label style={{ fontWeight: 'bold', minWidth: '60px' }}>To:</label>
              <div
                className="win95-sunken"
                style={{ flex: 1, padding: '3px 6px', fontSize: '12px' }}
              >
                {personalInfo.email}
              </div>
            </div>

            {/* Subject */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderBottom: '1px solid #e0e0e0',
                gap: '8px',
              }}
            >
              <label style={{ fontWeight: 'bold', minWidth: '60px' }}>Subject:</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Your message subject..."
                style={{
                  flex: 1,
                  padding: '3px 6px',
                  fontSize: '12px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  border: '2px inset #c0c0c0',
                  outline: 'none',
                }}
              />
            </div>

            {/* Attachments row (contact links) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderBottom: '1px solid #e0e0e0',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <label style={{ fontWeight: 'bold', minWidth: '60px' }}>Links:</label>
              <a
                href={personalInfo.linkedin}
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: '#f0f0f0',
                  border: '1px solid #c0c0c0',
                  textDecoration: 'none',
                  color: '#000080',
                  fontSize: '11px',
                }}
              >
                📎 LinkedIn
              </a>
              <a
                href={personalInfo.github}
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: '#f0f0f0',
                  border: '1px solid #c0c0c0',
                  textDecoration: 'none',
                  color: '#000080',
                  fontSize: '11px',
                }}
              >
                📎 GitHub
              </a>
              <a
                href={`mailto:${personalInfo.email}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: '#f0f0f0',
                  border: '1px solid #c0c0c0',
                  textDecoration: 'none',
                  color: '#000080',
                  fontSize: '11px',
                }}
              >
                📎 Email
              </a>
            </div>

            {/* Message Body */}
            <textarea
              value={formData.message}
              onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
              placeholder="Type your message here..."
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontFamily: "'IBM Plex Mono', monospace",
                border: 'none',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.5',
              }}
            />

            {/* Send button */}
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <button
                className="win95-button"
                onClick={handleSend}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 'bold',
                  padding: '4px 16px',
                  fontSize: '12px',
                }}
              >
                📤 Send
              </button>
              {sent && (
                <span style={{ color: 'green', fontSize: '12px' }}>
                  Message sent! (Opening email client...)
                </span>
              )}
            </div>
          </div>
        )}
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
          {view === 'inbox'
            ? `${FAKE_EMAILS.length} message(s), ${FAKE_EMAILS.filter((e) => !e.read).length} unread`
            : 'Composing new message'}
        </span>
        <span>umesh.OS Mail</span>
      </div>
    </div>
  );
}
