export interface ContactChannel {
	label: string;
	value: string;
	href: string;
	description: string;
	primary: boolean;
}

export const contactChannels: ContactChannel[] = [
	{
		label: 'Email',
		value: 'lucky.umeshmalik@gmail.com',
		href: 'mailto:lucky.umeshmalik@gmail.com',
		description: 'Best way to reach me. I typically respond within 24-48 hours on weekdays.',
		primary: true
	},
	{
		label: 'LinkedIn',
		value: 'linkedin.com/in/umesh-malik',
		href: 'https://linkedin.com/in/umesh-malik',
		description: 'Connect for professional networking, endorsements, or career-related conversations.',
		primary: false
	},
	{
		label: 'GitHub',
		value: 'github.com/Umeshmalik',
		href: 'https://github.com/Umeshmalik',
		description: 'Check out my open-source work, raise issues, or collaborate on projects.',
		primary: false
	},
	{
		label: 'X',
		value: '@lumeshmalik',
		href: 'https://x.com/lumeshmalik',
		description: 'Follow for professional networking, software development tips, tech opinions, and the occasional thread on web architecture.',
		primary: false
	}
];
