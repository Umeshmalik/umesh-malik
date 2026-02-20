export interface Experience {
  company: string;
  location: string;
  role: string;
  period: string;
  highlights: string[];
  icon: string;
}

export interface Skill {
  name: string;
  category: 'frontend' | 'backend' | 'tools' | 'concepts' | 'ai';
  proficiency: number; // 0-100
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  url?: string;
  highlights: string[];
}

export const personalInfo = {
  name: 'Umesh Malik',
  title: 'Senior Frontend Engineer | Full-Stack Developer',
  location: 'Gurugram, Haryana, India',
  email: 'umesh.malik.works@gmail.com',
  linkedin: 'https://linkedin.com/in/umesh-malik',
  github: 'https://github.com/Umeshmalik',
  website: 'https://umesh-malik.com',
};

export const experiences: Experience[] = [
  {
    company: 'Expedia Group',
    location: 'Gurugram, Haryana, India',
    role: 'Software Development Engineer 2',
    period: 'June 2024 - Present',
    icon: '🌐',
    highlights: [
      'Core frontend engineer for enterprise Workflow Orchestration Platform, architecting scalable solutions using React, TypeScript, and modern tooling (ESLint, Prettier, Vite)',
      'Migrated legacy Vue.js codebase to modern React stack, significantly improving maintainability and developer velocity through component-based architecture and TypeScript adoption',
      'Created reusable, scalable React component library to accelerate feature development across the platform, establishing design patterns and development standards',
      'Built visual workflow diagram editor using React and state management libraries, enabling business users to design complex workflows through intuitive drag-and-drop interface',
      'Wrote comprehensive unit and integration tests using Jest and React Testing Library to ensure code quality and prevent regressions',
    ],
  },
  {
    company: 'Tekion Corp',
    location: 'Bangalore, Karnataka, India',
    role: 'Software Engineer',
    period: 'April 2023 - May 2024',
    icon: '🚗',
    highlights: [
      'Rebuilt Finance & Insurance module to improve UI/UX and accessibility standards, serving thousands of automotive dealerships with enhanced user experience and compliance',
      'Led comprehensive code refactoring initiative to simplify codebase structure, reduce technical debt, and improve overall application performance',
      'Owned end-to-end implementation of localization and internationalization using language translation tools, enabling product expansion into new geographic markets',
      'Participated in code reviews, knowledge sharing sessions, and onboarding of new engineers, fostering best practices and team growth',
    ],
  },
  {
    company: 'BYJU\'S (Think & Learn)',
    location: 'India (Remote)',
    role: 'Module Lead',
    period: 'March 2022 - April 2023',
    icon: '📚',
    highlights: [
      'Led technical development for Order & Payment Validation modules, processing $10M+ in monthly transactions with high reliability and uptime',
      'Built and maintained critical Pincode and Address Management module handling ~19,000+ zipcode entries with real-time validation and search capabilities',
      'Mentored junior engineers on coding best practices, debugging complex production issues, and onboarding processes to accelerate team effectiveness',
      'Collaborated with product and business teams to translate requirements into technical specifications and deliver features aligned with business objectives',
    ],
  },
  {
    company: 'BYJU\'S (Think & Learn)',
    location: 'India (Remote)',
    role: 'Associate Software Engineer',
    period: 'July 2021 - February 2022',
    icon: '💻',
    highlights: [
      'Built Wallet and Bonus Points modules fully integrated with orders platform, enhancing customer engagement and loyalty programs',
      'Created flexible configuration systems to enable/disable features via admin settings, allowing business teams to control feature rollouts dynamically',
      'Delivered hands-on full-stack development using React.js, Node.js, Express, MongoDB, and PostgreSQL with RESTful API integration',
      'Recognized as Performer of the Quarter (January 2022) for exemplary performance in software engineering',
    ],
  },
];

export const skills: Skill[] = [
  // Frontend
  { name: 'React', category: 'frontend', proficiency: 95 },
  { name: 'TypeScript', category: 'frontend', proficiency: 92 },
  { name: 'JavaScript', category: 'frontend', proficiency: 95 },
  { name: 'Next.js', category: 'frontend', proficiency: 85 },
  { name: 'Vue.js', category: 'frontend', proficiency: 70 },
  { name: 'HTML5', category: 'frontend', proficiency: 95 },
  { name: 'CSS3', category: 'frontend', proficiency: 90 },
  { name: 'Tailwind CSS', category: 'frontend', proficiency: 88 },
  // Backend
  { name: 'Node.js', category: 'backend', proficiency: 80 },
  { name: 'Express.js', category: 'backend', proficiency: 78 },
  { name: 'MongoDB', category: 'backend', proficiency: 75 },
  { name: 'PostgreSQL', category: 'backend', proficiency: 72 },
  // Tools
  { name: 'Git', category: 'tools', proficiency: 90 },
  { name: 'Vite', category: 'tools', proficiency: 85 },
  { name: 'Webpack', category: 'tools', proficiency: 78 },
  { name: 'Jest', category: 'tools', proficiency: 82 },
  { name: 'Cypress', category: 'tools', proficiency: 70 },
  { name: 'ESLint', category: 'tools', proficiency: 85 },
  { name: 'Prettier', category: 'tools', proficiency: 85 },
  // Concepts
  { name: 'Microfrontend', category: 'concepts', proficiency: 80 },
  { name: 'Performance Opt.', category: 'concepts', proficiency: 85 },
  { name: 'Caching', category: 'concepts', proficiency: 78 },
  { name: 'Component Design', category: 'concepts', proficiency: 90 },
  // AI & AI-Assisted Development
  { name: 'Cursor AI', category: 'ai', proficiency: 92 },
  { name: 'Claude / ChatGPT', category: 'ai', proficiency: 90 },
  { name: 'GitHub Copilot', category: 'ai', proficiency: 88 },
  { name: 'AI Prompt Engineering', category: 'ai', proficiency: 85 },
  { name: 'Vibe Coding', category: 'ai', proficiency: 90 },
  { name: 'AI Code Review', category: 'ai', proficiency: 82 },
];

export const education: Education[] = [
  {
    degree: 'Master of Computer Application',
    field: 'Computer Science',
    institution: 'Deenbandhu Chhotu Ram University of Science and Technology',

  },
  {
    degree: 'Bachelor of Computer Application',
    field: 'Computer Science',
    institution: 'Deenbandhu Chhotu Ram University of Science and Technology',

  },
];

export const projects: Project[] = [
  {
    name: 'umesh.OS - This Website',
    description: 'A retro Windows 95-themed portfolio OS built entirely with AI-assisted development using Cursor AI + Claude. Proves that AI + human creativity = 10x developer output.',
    tech: ['Astro 5', 'React 19', 'Three.js', 'TypeScript', 'Tailwind 4', 'Cursor AI', 'Claude'],
    url: 'https://umesh-malik.com',
    highlights: [
      'Entire website scaffolded and built via AI pair programming in Cursor IDE',
      '3D interactive skill galaxy, boot sequences, and retro OS UI — all AI-generated with human direction',
      'Demonstrates the power of vibe coding: describing intent and letting AI handle implementation',
      '30+ components, 6 pages, 13 easter eggs — built in a single session',
    ],
  },
  {
    name: 'Chat Application',
    description: 'One-on-one real-time chat application with WebSocket integration for instant messaging capabilities',
    tech: ['React.js', 'Node.js', 'Socket.io', 'TailwindCSS', 'NextUI', 'MongoDB', 'Vite'],
    url: 'https://chat-app-client-peach.vercel.app',
    highlights: [
      'Real-time messaging with WebSocket integration',
      'JWT authentication with secure user sign-in',
      'User creation and management functionality',
    ],
  },
  {
    name: 'Workflow Orchestration Platform',
    description: 'Enterprise-grade visual workflow diagram editor enabling business users to design complex workflows',
    tech: ['React', 'TypeScript', 'Vite', 'State Management', 'Jest'],
    highlights: [
      'Visual drag-and-drop workflow designer',
      'Reusable component library',
      'Comprehensive test coverage',
    ],
  },
  {
    name: 'Finance & Insurance Module',
    description: 'Rebuilt F&I module serving thousands of automotive dealerships with improved accessibility',
    tech: ['React', 'TypeScript', 'i18n', 'Accessibility'],
    highlights: [
      'Multi-language support for global expansion',
      'WCAG accessibility compliance',
      'Performance-optimized architecture',
    ],
  },
  {
    name: 'Order & Payment System',
    description: 'Payment validation modules processing $10M+ monthly transactions',
    tech: ['React.js', 'Node.js', 'MongoDB', 'PostgreSQL'],
    highlights: [
      'High-reliability transaction processing',
      'Pincode management for 19,000+ entries',
      'Real-time validation and search',
    ],
  },
];

export const awards = [
  {
    title: 'Performer of the Quarter',
    company: 'Think & Learn Pvt. Ltd.',
    date: 'January 2022',
    description: 'Recognized for exemplary performance in Software Engineering',
  },
];
