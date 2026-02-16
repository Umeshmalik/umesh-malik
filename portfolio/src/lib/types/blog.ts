export interface BlogPost {
	title: string;
	slug: string;
	description: string;
	publishDate: string;
	updatedDate?: string;
	author: string;
	category: string;
	tags: string[];
	keywords: string;
	image: string;
	imageAlt: string;
	featured: boolean;
	published: boolean;
	readingTime: string;
	content?: string;
}

export interface BlogCategory {
	name: string;
	count: number;
	slug: string;
}

export interface BlogPostModule {
	metadata: BlogPost;
	default: string;
}