# umesh.OS v4.0 -- Retro Portfolio Website

A Windows 95-themed personal portfolio website that boots up like a retro operating system in your browser. Built with Astro 5, React 19, Three.js, TypeScript, and Tailwind CSS 4. Fully static, zero server cost, and packed with interactive gimmicks and easter eggs designed to keep visitors exploring for 5-10 minutes.

**Live:** [umesh-malik.in](https://umesh-malik.in) | [umesh-malik.com](https://umesh-malik.com)

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| [Astro 5.17+](https://astro.build) | Static site framework with island architecture |
| [React 19](https://react.dev) | Interactive UI components (rendered as Astro islands) |
| [TypeScript 5.9](https://typescriptlang.org) | Type-safe development across the entire codebase |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling via Vite plugin |
| [React Three Fiber](https://r3f.docs.pmnd.rs) | Declarative Three.js for 3D scenes (floating shapes, skill galaxy) |
| [@react-three/drei](https://github.com/pmndrs/drei) | Helpers for R3F (OrbitControls, Text, Html overlays) |
| [GSAP](https://gsap.com) | High-performance animations and scroll triggers |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Synthesized retro sound effects (no external audio files) |
| [pnpm](https://pnpm.io) | Fast, disk-efficient package manager |
| [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) | Auto-generated sitemap for SEO |

---

## Pages (6 Total)

### 1. Home -- The Desktop (`/`)
The landing experience. First-time visitors see a **BIOS boot sequence** (POST screen, memory check, OS loading bar) before arriving at a **Windows 95 desktop** with:
- 3D floating geometric shapes in the background (React Three Fiber)
- Desktop icons: `about.exe`, `career.exe`, `projects.exe`, `skills.exe`, `mail.exe`, `terminal.exe`, `README.md`
- Centered welcome message with retro pixel font
- Double-click any icon to navigate to its page

### 2. About -- `about.exe` (`/about`)
A terminal-style biography in a draggable window:
- **Typewriter animation** for the professional summary (character by character)
- Education section (MCA + BCA from DCRUST, Sonipat)
- Awards: "Performer of the Quarter" with a glowing gold border
- Links to GitHub, LinkedIn, and email
- ASCII art footer

### 3. Experience -- `career.exe` (`/experience`)
Interactive vertical timeline of career progression:
- **Animated stats counters** at the top: 4+ years, $10M+ transactions, 19,000+ zipcodes
- Each role card has Win95 window chrome (title bar, min/max/close buttons)
- Cards "install" with a progress bar animation when scrolled into view
- Staggered bullet point reveal for each role
- Companies: Expedia Group, Tekion Corp, BYJU's (2 roles)

### 4. Projects -- `projects.exe` (`/projects`)
A retro **Windows File Explorer** UI:
- Address bar showing the current path
- Folder tree sidebar with all projects listed
- Double-click project folders to open them
- Each project contains: `README.md`, `tech-stack.txt`, `highlights.log`, `demo.lnk`
- Full project detail preview panel with tech stack tags and highlights
- Status bar showing object count

### 5. Skills -- `skills.exe` (`/skills`)
A **3D interactive skill galaxy** -- the showstopper page:
- Each skill is a glowing orb floating in 3D space
- Skills clustered by category with colored nebulae:
  - **Frontend Nebula** (green): React, TypeScript, JavaScript, Next.js, Vue.js, HTML5, CSS3, Tailwind
  - **Backend Cluster** (blue): Node.js, Express.js, MongoDB, PostgreSQL
  - **Tools Ring** (amber): Git, Vite, Webpack, Jest, Cypress, ESLint, Prettier
  - **Concepts Core** (pink): Microfrontend Architecture, Performance Optimization, Caching, Component Design
- Hover any orb to see name, proficiency %, and a progress bar
- Drag to rotate, scroll to zoom (OrbitControls)
- Auto-rotation with star field background
- Color-coded legend in the bottom-left corner

### 6. Contact -- `mail.exe` (`/contact`)
A retro **email client** (Outlook Express style):
- **Compose tab**: Pre-filled "To" field, subject input, message textarea, Send button (opens `mailto:` link)
- **Inbox tab**: 4 humorous fake emails from "recruiters" (NASA, Apple, BigTech, Startup)
- Click any email to preview it
- Contact links styled as email attachments (LinkedIn, GitHub, Email, Phone)
- Unread badge counter on inbox button

---

## Gimmicks & Easter Eggs

| Feature | How to trigger | What happens |
| :--- | :--- | :--- |
| **BIOS Boot Sequence** | Visit the site for the first time | Fake POST screen -> memory check -> OS loading bar (~5s) |
| **Interactive Terminal** | Click `terminal.exe` icon or navigate to terminal | Full CLI with 15+ commands |
| **Konami Code** | Press Up Up Down Down Left Right Left Right B A | Full-screen Matrix digital rain overlay |
| **Snake Game** | Type `snake` in terminal | Playable Snake with pixel graphics and score tracking |
| **BSOD (Blue Screen)** | Click "Shut Down" in Start Menu | Fake Blue Screen of Death for 3 seconds, then "reboots" |
| **Clippy Assistant** | Wait 30 seconds on any page | Retro paperclip pops up with tips and fun facts |
| **Screen Saver** | Stay idle for 60 seconds | Bouncing "umesh.OS" logo (DVD screensaver style) |
| **Achievement System** | Discover features | Toast notifications + localStorage persistence |
| **CRT Mode** | Toggle via TV icon in system tray | Scanlines, screen flicker, and green glow overlay |
| **Sound Effects** | Toggle via speaker icon in system tray | Synthesized beeps for clicks, typing, boot, errors, achievements |
| **Context Menu** | Right-click the desktop | Win95-style context menu (Refresh, About umesh.OS) |
| **Draggable Windows** | Drag any window title bar | Move and resize program windows freely |
| **Start Menu** | Click "Start" button in taskbar | All navigation + Shut Down option |
| **System Tray Clock** | Always visible in taskbar | Real-time clock in AM/PM format |

### Terminal Commands

```
help        - Show available commands
about       - Navigate to About page
experience  - Navigate to Experience page
projects    - Navigate to Projects page
skills      - Navigate to Skills page
contact     - Navigate to Contact page
whoami      - Display user info
neofetch    - System info in ASCII art
ls          - List "files" (pages)
clear       - Clear terminal
history     - Show command history
matrix      - Enter the Matrix (rain effect)
snake       - Launch Snake game
echo [text] - Echo text back
date        - Show current date
pwd         - Print working directory
cat [file]  - Read README.md or .secrets
sudo        - "Nice try" message
exit        - Hotel California response
```

### Achievements (8 Total)

| ID | Title | Description | How to unlock |
| :--- | :--- | :--- | :--- |
| `first-boot` | First Boot | Welcome to umesh.OS! | Visit the site |
| `power-user` | Power User | Used the terminal | Open the terminal |
| `explorer` | Explorer | Visited all pages | Navigate to all 6 pages |
| `hacker` | Hacker | Entered the Konami code | Complete the Konami sequence |
| `gamer` | Gamer | Played Snake | Start a Snake game |
| `start-menu` | Start Me Up | Opened the Start Menu | Click the Start button |
| `right-clicker` | Right Clicker | Used the context menu | Right-click the desktop |
| `detective` | Detective | Found 5 easter eggs | Discover 5 hidden features |

---

## Project Structure

```
umesh-malik/
  astro.config.mjs           # Astro config (static output, React, Tailwind, Sitemap)
  tsconfig.json               # TypeScript strict config with React JSX
  package.json                # Dependencies and scripts
  public/
    favicon.svg               # UM monogram favicon
    robots.txt                # SEO robots file
  src/
    env.d.ts                  # Astro type references
    layouts/
      Desktop.astro           # Main HTML layout (SEO meta, OG tags, global CSS import)
    pages/
      index.astro             # Home / Desktop page
      about.astro             # about.exe page
      experience.astro        # career.exe page
      projects.astro          # projects.exe page
      skills.astro            # skills.exe page
      contact.astro           # mail.exe page
    components/
      DesktopApp.tsx           # Main orchestrator (boot, taskbar, CRT, achievements, easter eggs)
      boot/
        BootSequence.tsx       # BIOS POST + OS loading animation
      desktop/
        Taskbar.tsx            # Bottom taskbar with Start button and system tray
        StartMenu.tsx          # Start menu dropdown with navigation + Shut Down
        DesktopIcon.tsx        # Double-clickable desktop icons
        ContextMenu.tsx        # Right-click context menu
        Clock.tsx              # Real-time system tray clock
      windows/
        DraggableWindow.tsx    # Draggable/resizable window with Win95 chrome
      terminal/
        Terminal.tsx           # Interactive terminal emulator with command history
      three/
        FloatingShapes.tsx     # 3D background (7 wireframe shapes + particle field)
        SkillGalaxy.tsx        # 3D skill constellation with OrbitControls
      effects/
        MatrixRain.tsx         # Matrix digital rain canvas overlay
        ScreenSaver.tsx        # Bouncing logo screensaver
        BSOD.tsx               # Blue Screen of Death
      games/
        Snake.tsx              # Playable Snake game
      ui/
        AchievementToast.tsx   # Achievement unlocked notification
        Clippy.tsx             # Retro assistant with tips
      pages/
        AboutContent.tsx       # About page content (typewriter, education, awards)
        ExperienceContent.tsx  # Experience timeline with animated counters
        ProjectsContent.tsx    # File Explorer project showcase
        ContactContent.tsx     # Email client with compose + inbox
    hooks/
      useAchievements.ts      # Achievement unlock/persistence (localStorage)
      useCRT.ts               # CRT mode toggle (localStorage)
      useSound.ts             # Sound effects via Web Audio API (localStorage)
      useKonamiCode.ts        # Konami code key sequence detector
      useIdleTimer.ts         # Idle detection for screensaver
    data/
      resume.ts               # Structured resume data (experiences, skills, education, projects, awards)
      achievements.ts          # Achievement definitions
      commands.ts              # Terminal command definitions and executor
    styles/
      global.css              # Tailwind imports, CRT effects, Win95 styles, animations, retro fonts
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ 
- [pnpm](https://pnpm.io/) v8+

### Install & Run

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:4321)
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Build Output
The `pnpm build` command generates a fully static site in the `dist/` directory. No server required. Deploy the `dist/` folder to any static hosting provider.

---

## Deployment

The site is configured for static output (`output: "static"` in `astro.config.mjs`) and can be deployed to any static hosting platform:

### Cloudflare Pages (Recommended)
```bash
# Connect your repo on Cloudflare Pages dashboard
# Build command: pnpm build
# Build output directory: dist
# Add custom domains: umesh-malik.in, umesh-malik.com
```

### Vercel
```bash
# Connect your repo on Vercel dashboard
# Framework preset: Astro
# Custom domains: umesh-malik.in, umesh-malik.com
```

### Netlify
```bash
# Connect your repo on Netlify dashboard
# Build command: pnpm build
# Publish directory: dist
```

---

## SEO

- Unique `<title>` and `<meta description>` on every page
- Open Graph and Twitter Card meta tags
- Canonical URLs pointing to `umesh-malik.in`
- Auto-generated `sitemap-index.xml` via `@astrojs/sitemap`
- `robots.txt` allowing all crawlers
- SVG favicon with "UM" monogram
- Semantic HTML structure

---

## Performance Notes

- All pages are **statically generated** at build time (zero runtime server)
- 3D scenes use Astro's `client:idle` and `client:visible` directives to lazy-load
- Boot sequence uses `client:load` for immediate interactivity
- Fonts are loaded via `@font-face` with `font-display: swap` for no render blocking
- Sound effects are synthesized via Web Audio API (no external audio file downloads)
- Total JS bundle includes Three.js (~237KB gzipped) only on pages that use 3D

---

## Fonts

| Font | Usage | Source |
| :--- | :--- | :--- |
| VT323 | Terminal text, code output | Google Fonts |
| Press Start 2P | Headings, titles, labels | Google Fonts |
| IBM Plex Mono | Body text, UI elements | Google Fonts |

---

## Color Palette

| Color | Hex | Usage |
| :--- | :--- | :--- |
| Win95 Teal | `#008080` | Desktop wallpaper background |
| Win95 Title Blue | `#000080` | Active window title bar, buttons |
| CRT Green | `#00ff41` | Terminal text, skill orbs, highlights |
| CRT Amber | `#ffb000` | Section headers, awards |
| Win95 Silver | `#c0c0c0` | Window chrome, taskbar, buttons |
| Retro Blue | `#1084d0` | Links, secondary accent |
| Alert Pink | `#ff0080` | Concepts skills, Snake food |

---

## License

This project is a personal portfolio. The code is open for reference and learning. Resume data is specific to Umesh Malik.

---

Built with mass amounts of caffeine, nostalgia, and modern web tech.
