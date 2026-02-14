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
	content?: any;
}

export interface BlogCategory {
	name: string;
	count: number;
	slug: string;
}
