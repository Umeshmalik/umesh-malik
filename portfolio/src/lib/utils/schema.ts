import { siteConfig } from '$lib/config/site';

const S = siteConfig;
const baseUrl = S.url;

export const personSchema = {
	'@type': 'Person',
	'@id': `${baseUrl}/#person`,
	name: S.author.name,
	givenName: 'Umesh',
	familyName: 'Malik',
	alternateName: ['Umesh Kumar Malik', 'Lucky Umesh Malik'],
	jobTitle: S.author.jobTitle,
	description:
		'Senior Frontend Engineer specializing in React, TypeScript, and modern web architecture with 4+ years of experience building scalable applications.',
	image: `${baseUrl}/images/umesh-malik.jpg`,
	url: baseUrl,
	sameAs: [S.author.linkedin, S.author.github, 'https://x.com/lumeshmalik'],
	email: `mailto:${S.author.email}`,
	address: {
		'@type': 'PostalAddress',
		addressLocality: 'Gurugram',
		addressRegion: 'Haryana',
		addressCountry: 'IN'
	},
	worksFor: {
		'@type': 'Organization',
		name: S.author.company,
		url: 'https://expediagroup.com'
	},
	alumniOf: [
		{
			'@type': 'EducationalOrganization',
			name: 'Deenbandhu Chhotu Ram University of Science and Technology',
			url: 'http://dcrustm.ac.in'
		}
	],
	knowsAbout: [
		'React',
		'TypeScript',
		'JavaScript',
		'Frontend Development',
		'Web Development',
		'SvelteKit',
		'Next.js',
		'Node.js',
		'Software Engineering',
		'Microfrontend Architecture',
		'Performance Optimization',
		'Accessibility'
	],
	knowsLanguage: ['English', 'Hindi'],
	award: 'Performer of the Quarter - Think & Learn Pvt. Ltd. (January 2022)',
	hasOccupation: {
		'@type': 'Occupation',
		name: 'Frontend Engineer',
		occupationLocation: {
			'@type': 'Country',
			name: 'India'
		},
		skills: 'React, TypeScript, JavaScript, Next.js, SvelteKit, Vue.js, Node.js, TailwindCSS'
	}
};

export const websiteSchema = {
	'@type': 'WebSite',
	'@id': `${baseUrl}/#website`,
	name: S.title,
	url: baseUrl,
	description: S.description,
	inLanguage: S.language,
	publisher: {
		'@id': `${baseUrl}/#person`
	},
	potentialAction: {
		'@type': 'SearchAction',
		target: {
			'@type': 'EntryPoint',
			urlTemplate: `${baseUrl}/blog?q={search_term_string}`
		},
		'query-input': 'required name=search_term_string'
	}
};

export const organizationSchema = {
	'@type': 'Organization',
	'@id': `${baseUrl}/#organization`,
	name: S.author.name,
	url: baseUrl,
	logo: {
		'@type': 'ImageObject',
		url: `${baseUrl}${S.logo}`,
		width: 512,
		height: 512
	},
	contactPoint: {
		'@type': 'ContactPoint',
		email: S.author.email,
		contactType: 'Professional Inquiry'
	},
	founder: {
		'@id': `${baseUrl}/#person`
	},
	sameAs: [S.author.linkedin, S.author.github, 'https://x.com/lumeshmalik']
};

export const siteNavigationSchema = {
	'@type': 'SiteNavigationElement',
	'@id': `${baseUrl}/#navigation`,
	name: 'Main Navigation',
	hasPart: [
		{ '@type': 'SiteNavigationElement', name: 'Home', url: baseUrl },
		{ '@type': 'SiteNavigationElement', name: 'About', url: `${baseUrl}/about` },
		{ '@type': 'SiteNavigationElement', name: 'Projects', url: `${baseUrl}/projects` },
		{ '@type': 'SiteNavigationElement', name: 'Blog', url: `${baseUrl}/blog` },
		{ '@type': 'SiteNavigationElement', name: 'Resume', url: `${baseUrl}/resume` },
		{ '@type': 'SiteNavigationElement', name: 'Uses', url: `${baseUrl}/uses` },
		{ '@type': 'SiteNavigationElement', name: 'Contact', url: `${baseUrl}/contact` },
		{ '@type': 'SiteNavigationElement', name: 'Resources', url: `${baseUrl}/resources` }
	]
};

export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}

export function createArticleSchema(post: {
	title: string;
	description: string;
	slug: string;
	publishDate: string;
	updatedDate?: string;
	keywords: string;
	category: string;
	tags: string[];
	image: string;
	imageAlt: string;
	readingTime: string;
}) {
	const wordCount = estimateWordCount(post.readingTime);
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description,
		image: {
			'@type': 'ImageObject',
			url: post.image || `${baseUrl}${S.ogImage}`,
			caption: post.imageAlt || post.title
		},
		datePublished: post.publishDate,
		dateModified: post.updatedDate || post.publishDate,
		wordCount,
		timeRequired: `PT${parseInt(post.readingTime)}M`,
		articleSection: post.category,
		keywords: post.keywords,
		inLanguage: S.language,
		author: {
			'@type': 'Person',
			name: S.author.name,
			url: baseUrl,
			'@id': `${baseUrl}/#person`
		},
		publisher: {
			'@type': 'Person',
			name: S.author.name,
			url: baseUrl,
			'@id': `${baseUrl}/#person`
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': `${baseUrl}/blog/${post.slug}`
		},
		isPartOf: {
			'@id': `${baseUrl}/#website`
		}
	};
}

function estimateWordCount(readingTime: string): number {
	const minutes = parseInt(readingTime) || 5;
	return minutes * 200;
}

export function createProfilePageSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'ProfilePage',
		mainEntity: {
			'@id': `${baseUrl}/#person`
		},
		dateCreated: '2024-01-01',
		dateModified: new Date().toISOString().split('T')[0]
	};
}

export function createContactPageSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'ContactPage',
		name: `Contact ${S.author.name}`,
		description:
			'Contact Umesh Malik for professional inquiries, technical collaborations, speaking engagements, or open-source projects.',
		url: `${baseUrl}/contact`,
		mainEntity: {
			'@id': `${baseUrl}/#person`
		}
	};
}

export function createCollectionPageSchema(options: {
	name: string;
	description: string;
	url: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: options.name,
		description: options.description,
		url: options.url,
		isPartOf: {
			'@type': 'WebSite',
			name: S.title,
			url: baseUrl
		},
		author: {
			'@type': 'Person',
			name: S.author.name,
			'@id': `${baseUrl}/#person`
		}
	};
}
