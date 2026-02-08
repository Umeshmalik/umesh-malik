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

/** Summary text with dynamic years */
export function getSummary(): string {
  const years = getYearsOfExperience();
  return `Frontend-focused Full-Stack Engineer with ${years}+ years of experience building scalable, high-performance web applications. Specialized in React ecosystem with deep expertise in TypeScript, modern JavaScript, component architecture, and state management. Leverages AI-powered development tools (Cursor AI, Claude, GitHub Copilot) to amplify productivity and ship faster. Demonstrated success in leading large-scale frontend migrations, architecting reusable component systems, and mentoring engineering teams while delivering mission-critical features across fintech, automotive, and travel domains.`;
}
