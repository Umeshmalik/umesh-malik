import { error } from '@sveltejs/kit';
import type { BlogPost, BlogCategory, BlogPostModule } from '$lib/types/blog';

export async function getAllPosts(): Promise<BlogPost[]> {
	const modules = import.meta.glob('$lib/posts/*.md');
	const posts: BlogPost[] = [];

	for (const path in modules) {
		const post = (await modules[path]()) as BlogPostModule;
		const slug = path.split('/').pop()?.replace('.md', '');

		if (post.metadata?.published) {
			posts.push({
				...post.metadata,
				slug: slug ?? ''
			});
		}
	}

	return posts.sort(
		(a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
	);
}

export async function getPostBySlug(slug: string): Promise<BlogPost> {
	try {
		const modules = import.meta.glob('$lib/posts/*.md');
		const matchingPath = Object.keys(modules).find((path) => path.endsWith(`/${slug}.md`));

		if (!matchingPath) {
			throw error(404, 'Post not found');
		}

		const post = (await modules[matchingPath]()) as BlogPostModule;

		if (!post.metadata?.published) {
			throw error(404, 'Post not found');
		}

		return {
			...post.metadata,
			slug,
			content: post.default ?? ''
		};
	} catch (e: any) {
		if (e?.status === 404) throw e;
		throw error(404, 'Post not found');
	}
}

export function getPostsByCategory(posts: BlogPost[], category: string): BlogPost[] {
	return posts.filter((post) => post.category.toLowerCase() === category.toLowerCase());
}

export function getPostsByTag(posts: BlogPost[], tag: string): BlogPost[] {
	return posts.filter((post) => post.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
}

export function getFeaturedPosts(posts: BlogPost[], limit = 3): BlogPost[] {
	return posts.filter((post) => post.featured).slice(0, limit);
}

export function getRelatedPosts(
	posts: BlogPost[],
	currentPost: BlogPost,
	limit = 3
): BlogPost[] {
	const related = posts.filter((post) => {
		if (post.slug === currentPost.slug) return false;
		const sameCategory = post.category === currentPost.category;
		const sharedTags = post.tags.some((tag) => currentPost.tags.includes(tag));
		return sameCategory || sharedTags;
	});

	return related.slice(0, limit);
}

export function getAllCategories(posts: BlogPost[]): BlogCategory[] {
	const categoryMap = new Map<string, number>();

	posts.forEach((post) => {
		const count = categoryMap.get(post.category) || 0;
		categoryMap.set(post.category, count + 1);
	});

	return Array.from(categoryMap.entries()).map(([name, count]) => ({
		name,
		count,
		slug: name.toLowerCase().replace(/\s+/g, '-')
	}));
}

export function getAllTags(posts: BlogPost[]): string[] {
	const tags = new Set<string>();
	posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
	return Array.from(tags).sort();
}
