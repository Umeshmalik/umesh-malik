// Single source of truth for all time-based dynamic values.
// Everything computes from these constants at runtime.

const CAREER_START = new Date('2021-07-01');
const SITE_LAUNCH_YEAR = 2024;

function now() {
  return new Date();
}

/** Years of professional experience (rounded down) */
export function getYearsOfExperience(): number {
  const diff = now().getTime() - CAREER_START.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/** OS version derived from years of experience (e.g. 4 years -> v4.0) */
export function getOSVersion(): string {
  return `v${getYearsOfExperience()}.0`;
}

/** Current year */
export function getCurrentYear(): number {
  return now().getFullYear();
}

/** Copyright string e.g. "2024-2026" or just "2024" if same year */
export function getCopyright(): string {
  const current = getCurrentYear();
  return current > SITE_LAUNCH_YEAR
    ? `${SITE_LAUNCH_YEAR}-${current}`
    : `${SITE_LAUNCH_YEAR}`;
}

/** Relative date string like "2 days ago", "3 weeks ago" */
export function getRelativeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Time-of-day period */
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimePeriod(): TimePeriod {
  const hour = now().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function getTimeGreeting(): string {
  switch (getTimePeriod()) {
    case 'morning': return 'Good morning';
    case 'afternoon': return 'Good afternoon';
    case 'evening': return 'Good evening';
    case 'night': return 'Late night coding?';
  }
}

export function getDesktopTint(): string {
  switch (getTimePeriod()) {
    case 'morning': return '#1a8080'; // sunrise teal tint
    case 'afternoon': return '#008080'; // standard teal
    case 'evening': return '#005555'; // darker teal with warm tones
    case 'night': return '#001a1a'; // extra dark
  }
}

export function getTerminalPromptSuffix(): string {
  return getTimePeriod();
}

/** Summary text with dynamic years */
export function getSummary(): string {
  const years = getYearsOfExperience();
  return `Frontend-focused Full-Stack Engineer with ${years}+ years of experience building scalable, high-performance web applications. Specialized in React ecosystem with deep expertise in TypeScript, modern JavaScript, component architecture, and state management. Leverages AI-powered development tools (Cursor AI, Claude, GitHub Copilot) to amplify productivity and ship faster. Demonstrated success in leading large-scale frontend migrations, architecting reusable component systems, and mentoring engineering teams while delivering mission-critical features across fintech, automotive, and travel domains.`;
}
