import { personalInfo } from './resume';
import { getOSVersion, getYearsOfExperience, getCopyright } from './dynamic';

export interface CommandResult {
  output: string;
  action?: 'navigate' | 'matrix' | 'snake' | 'clear';
  target?: string;
}

function getNeofetch() {
  return `
    ██╗   ██╗███╗   ███╗
    ██║   ██║████╗ ████║     umesh@malik.os
    ██║   ██║██╔████╔██║     ──────────────
    ██║   ██║██║╚██╔╝██║     OS: umesh.OS ${getOSVersion()}
    ╚██████╔╝██║ ╚═╝ ██║     Host: The Internet
     ╚═════╝ ╚═╝     ╚═╝     Kernel: React 19 + Astro 5
                              Uptime: ${getYearsOfExperience()}+ years
                              Packages: React, TypeScript, Node.js
                              Shell: terminal.exe
                              Resolution: Pixel Perfect
                              Theme: Win95 Retro [CRT]
                              AI: Cursor + Claude (vibe coded)
                              CPU: Caffeine-Powered Brain
                              Memory: Stack Overflow Bookmarks
`;
}

export function executeCommand(input: string, history: string[]): CommandResult {
  const trimmed = input.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];

  switch (cmd) {
    case 'help':
      return {
        output: `Available commands:
  help        - Show this help message
  about       - Navigate to About page
  experience  - Navigate to Experience page
  projects    - Navigate to Projects page
  skills      - Navigate to Skills page
  contact     - Navigate to Contact page
  whoami      - Display user info
  neofetch    - System information
  ai          - How this site was built with AI
  ls          - List pages
  clear       - Clear terminal
  history     - Show command history
  matrix      - Enter the Matrix
  snake       - Play Snake game
  echo [text] - Echo text
  date        - Show current date
  pwd         - Print working directory
  cat [file]  - Read a file`,
      };

    case 'about':
      return { output: 'Navigating to about.exe...', action: 'navigate', target: '/about' };

    case 'experience':
    case 'career':
      return { output: 'Navigating to career.exe...', action: 'navigate', target: '/experience' };

    case 'projects':
      return { output: 'Navigating to projects.exe...', action: 'navigate', target: '/projects' };

    case 'skills':
      return { output: 'Navigating to skills.exe...', action: 'navigate', target: '/skills' };

    case 'contact':
    case 'mail':
      return { output: 'Navigating to mail.exe...', action: 'navigate', target: '/contact' };

    case 'whoami':
      return {
        output: `${personalInfo.name}
${personalInfo.title}
${personalInfo.location}
Email: ${personalInfo.email}
GitHub: ${personalInfo.github}
LinkedIn: ${personalInfo.linkedin}`,
      };

    case 'neofetch':
      return { output: getNeofetch() };

    case 'ai':
    case 'vibe':
      return {
        output: `
  ╔══════════════════════════════════════════════╗
  ║          AI-POWERED DEVELOPMENT              ║
  ╠══════════════════════════════════════════════╣
  ║                                              ║
  ║  This entire website was vibe-coded using:   ║
  ║                                              ║
  ║  > Cursor IDE + Claude AI                    ║
  ║    The human describes the vision,           ║
  ║    AI handles the implementation.            ║
  ║                                              ║
  ║  > GitHub Copilot                            ║
  ║    Inline completions & suggestions          ║
  ║                                              ║
  ║  > AI Prompt Engineering                     ║
  ║    Crafting precise instructions for          ║
  ║    complex multi-file architectures          ║
  ║                                              ║
  ║  HOW IT WAS BUILT:                           ║
  ║  1. Fed resume PDF to Claude in Cursor       ║
  ║  2. Described the retro OS vision            ║
  ║  3. AI scaffolded Astro + React + Three.js   ║
  ║  4. Iterated: "make it smoother",            ║
  ║     "add multi-window", "add easter eggs"    ║
  ║  5. 30+ components in a single session       ║
  ║                                              ║
  ║  PHILOSOPHY:                                 ║
  ║  AI doesn't replace developers —             ║
  ║  it amplifies creative engineers who          ║
  ║  know what to build and how to direct AI.    ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝`,
      };

    case 'ls':
      return {
        output: `about.exe    career.exe    projects.exe
skills.exe   mail.exe      terminal.exe
snake.exe    README.md     .secrets`,
      };

    case 'clear':
      return { output: '', action: 'clear' };

    case 'history':
      return {
        output: history.map((h, i) => `  ${i + 1}  ${h}`).join('\n') || 'No history yet.',
      };

    case 'matrix':
      return { output: 'Entering the Matrix...', action: 'matrix' };

    case 'snake':
      return { output: 'Launching snake.exe...', action: 'snake' };

    case 'echo':
      return { output: parts.slice(1).join(' ') || '' };

    case 'date':
      return { output: new Date().toString() };

    case 'pwd':
      return { output: 'C:\\Users\\Umesh\\Desktop' };

    case 'cat':
      if (parts[1] === 'readme.md' || parts[1] === 'README.md') {
        return {
          output: `# umesh.OS ${getOSVersion()}
Welcome to Umesh Malik's personal operating system.
Built with Astro, React, Three.js, and lots of caffeine.
Type 'help' for available commands.`,
        };
      }
      if (parts[1] === '.secrets') {
        return { output: 'Nice try! 🕵️ Achievement unlocked: Detective' };
      }
      return { output: `cat: ${parts[1] || ''}: No such file or directory` };

    case 'sudo':
      return { output: 'Nice try, but you are not in the sudoers file. This incident will be reported. 😏' };

    case 'rm':
      return { output: 'Permission denied. This is a read-only filesystem... or is it? 👀' };

    case 'cd':
      return { output: `bash: cd: ${parts[1] || '~'}: Not a real filesystem!` };

    case 'exit':
    case 'quit':
      return { output: 'You can check out any time you like, but you can never leave! 🎸' };

    case '':
      return { output: '' };

    default:
      return { output: `'${cmd}' is not recognized as an internal or external command.\nType 'help' for available commands.` };
  }
}
