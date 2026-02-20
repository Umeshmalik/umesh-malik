/**
 * Centralized site configuration.
 * Single source of truth for all SEO, feed, and sitemap generation.
 */
export const siteConfig = {
	url: 'https://umesh-malik.com',
	alternateUrl: 'https://umesh-malik.in',
	title: 'Umesh Malik - Senior Frontend Engineer',
	description:
		'Portfolio and professional website of Umesh Malik, Senior Frontend Engineer at Expedia Group',
	language: 'en-US',
	locale: 'en_US',
	author: {
		name: 'Umesh Malik',
		email: 'ask@umesh-malik.com',
		jobTitle: 'Senior Frontend Engineer',
		company: 'Expedia Group',
		x: '@lumeshmalik',
		linkedin: 'https://linkedin.com/in/umesh-malik',
		github: 'https://github.com/Umeshmalik'
	},
	ogImage: '/blog/default-cover.jpg',
	logo: '/logo.svg',
	copyright: (year: number) => `Copyright ${year} Umesh Malik`,
	/** Static pages and their sitemap metadata */
	staticPages: [
		{ path: '', priority: 1.0, changefreq: 'weekly' as const },
		{ path: '/blog', priority: 0.9, changefreq: 'daily' as const },
		{ path: '/projects', priority: 0.9, changefreq: 'monthly' as const },
		{ path: '/about', priority: 0.8, changefreq: 'monthly' as const },
		{ path: '/resume', priority: 0.7, changefreq: 'monthly' as const },
		{ path: '/faq', priority: 0.6, changefreq: 'monthly' as const },
		{ path: '/contact', priority: 0.6, changefreq: 'monthly' as const },
		{ path: '/uses', priority: 0.5, changefreq: 'monthly' as const },
		{ path: '/resources', priority: 0.5, changefreq: 'monthly' as const },
		{ path: '/ai-summary', priority: 0.5, changefreq: 'monthly' as const },
		{ path: '/press', priority: 0.4, changefreq: 'monthly' as const },
		// Retro Portfolio (microfrontend sub-app)
		{ path: '/projects/retro-portfolio', priority: 0.7, changefreq: 'monthly' as const },
		{ path: '/projects/retro-portfolio/about', priority: 0.5, changefreq: 'monthly' as const },
		{ path: '/projects/retro-portfolio/experience', priority: 0.5, changefreq: 'monthly' as const },
		{ path: '/projects/retro-portfolio/projects', priority: 0.5, changefreq: 'monthly' as const },
		{ path: '/projects/retro-portfolio/skills', priority: 0.5, changefreq: 'monthly' as const },
		{ path: '/projects/retro-portfolio/contact', priority: 0.5, changefreq: 'monthly' as const }
	]
} as const;

export type SiteConfig = typeof siteConfig;
