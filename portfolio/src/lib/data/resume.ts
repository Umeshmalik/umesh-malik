export interface ExperienceEntry {
	type: 'experience';
	company: string;
	role: string;
	period: string;
	location: string;
	description: string;
	highlights: string[];
	tech: string[];
	year: number;
	isCurrent: boolean;
}

export interface EducationEntry {
	type: 'education';
	degree: string;
	field: string;
	institution: string;
	period: string;
	year: number;
	isCurrent: boolean;
}

export type TimelineEntry = ExperienceEntry | EducationEntry;

export const experience: ExperienceEntry[] = [
	{
		type: 'experience',
		company: 'Expedia Group',
		role: 'Software Development Engineer 2',
		period: 'June 2024 - Present',
		location: 'Gurugram, Haryana',
		description:
			'Core software engineer for enterprise Workflow Orchestration Platform. Led migration from Vue.js to React, built reusable component libraries, and created visual workflow diagram editors.',
		highlights: [
			'Led Vue.js to React migration improving developer velocity by 3x',
			'Built reusable component library accelerating feature development',
			'Created visual workflow diagram editor with drag-and-drop interface',
			'Comprehensive testing with Jest and React Testing Library'
		],
		tech: ['React', 'TypeScript', 'Jest', 'React Testing Library'],
		year: 2024,
		isCurrent: true
	},
	{
		type: 'experience',
		company: 'Tekion Corp',
		role: 'Software Engineer',
		period: 'April 2023 - May 2024',
		location: 'Bengaluru, India',
		description:
			'Rebuilt Finance & Insurance modules serving thousands of automotive dealerships. Implemented internationalization and accessibility improvements.',
		highlights: [
			'Rebuilt F&I module serving thousands of dealerships',
			'Implemented internationalization enabling product expansion',
			'Led accessibility improvements achieving WCAG compliance',
			'Conducted code refactoring initiatives improving maintainability'
		],
		tech: ['React', 'TypeScript', 'i18n', 'WCAG'],
		year: 2023,
		isCurrent: false
	},
	{
		type: 'experience',
		company: "BYJU'S (Think & Learn)",
		role: 'Module Lead',
		period: 'March 2022 - April 2023',
		location: 'Bengaluru, India',
		description:
			'Led Order & Payment Validation modules processing $10M+ monthly transactions. Built Pincode Management system handling 19,000+ entries.',
		highlights: [
			'Led payment validation processing $10M+ monthly transactions',
			'Built Pincode Management system with 19,000+ entries',
			'Mentored 5+ junior engineers on best practices',
			'Achieved 99.9% system uptime'
		],
		tech: ['React', 'JavaScript', 'Node.js', 'MongoDB'],
		year: 2022,
		isCurrent: false
	},
	{
		type: 'experience',
		company: "BYJU'S (Think & Learn)",
		role: 'Associate Software Engineer',
		period: 'July 2021 - February 2022',
		location: 'Bengaluru, India',
		description:
			'Built Wallet and Bonus Points modules. Recognized as Performer of the Quarter (January 2022).',
		highlights: [
			'Built Wallet and Bonus Points modules from scratch',
			'Recognized as Performer of the Quarter (January 2022)',
			'Delivered features ahead of schedule'
		],
		tech: ['React', 'JavaScript', 'CSS', 'REST APIs'],
		year: 2021,
		isCurrent: false
	}
];

export const education: EducationEntry[] = [
	{
		type: 'education',
		degree: 'Master of Computer Application (MCA)',
		field: 'Computer Science',
		institution: 'Deenbandhu Chhotu Ram University of Science and Technology',
		period: '2021 - 2023',
		year: 2021,
		isCurrent: false
	},
	{
		type: 'education',
		degree: 'Bachelor of Computer Application (BCA)',
		field: 'Computer Science',
		institution: 'Deenbandhu Chhotu Ram University of Science and Technology',
		period: '2018 - 2021',
		year: 2018,
		isCurrent: false
	}
];

