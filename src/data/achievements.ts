export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const achievements: Achievement[] = [
  {
    id: 'first-boot',
    title: 'First Boot',
    description: 'Welcome to umesh.OS!',
    icon: '🖥️',
  },
  {
    id: 'power-user',
    title: 'Power User',
    description: 'Used the terminal',
    icon: '⌨️',
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Visited all pages',
    icon: '🗺️',
  },
  {
    id: 'hacker',
    title: 'Hacker',
    description: 'Entered the Konami code',
    icon: '👾',
  },
  {
    id: 'gamer',
    title: 'Gamer',
    description: 'Played Snake',
    icon: '🎮',
  },
  {
    id: 'detective',
    title: 'Detective',
    description: 'Found 5 easter eggs',
    icon: '🔍',
  },
  {
    id: 'start-menu',
    title: 'Start Me Up',
    description: 'Opened the Start Menu',
    icon: '🪟',
  },
  {
    id: 'right-clicker',
    title: 'Right Clicker',
    description: 'Used the context menu',
    icon: '🖱️',
  },
];
