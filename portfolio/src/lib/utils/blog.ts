import { error } from '@sveltejs/kit';
import type { BlogPost, BlogCategory, BlogPostModule } from '$lib/types/blog';

/** Create a URL-safe slug from a string */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

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

export function getPostsByCategory(posts: BlogPost[], categorySlug: string): BlogPost[] {
	return posts.filter((post) => slugify(post.category) === categorySlug.toLowerCase());
}

export function getPostsByTag(posts: BlogPost[], tagSlug: string): BlogPost[] {
	return posts.filter((post) => post.tags.some((t) => slugify(t) === tagSlug.toLowerCase()));
}

export function getFeaturedPosts(posts: BlogPost[], limit = 3): BlogPost[] {
	return posts.filter((post) => post.featured).slice(0, limit);
}

export function getRelatedPosts(
	posts: BlogPost[],
	currentPost: BlogPost,
	limit = 3
): BlogPost[] {
	const scored = posts
		.filter((post) => post.slug !== currentPost.slug)
		.map((post) => {
			let score = 0;
			if (post.category === currentPost.category) score += 3;
			score += post.tags.filter((tag) => currentPost.tags.includes(tag)).length;
			return { post, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			return new Date(b.post.publishDate).getTime() - new Date(a.post.publishDate).getTime();
		});

	return scored.slice(0, limit).map(({ post }) => post);
}

export function getAdjacentPosts(
	posts: BlogPost[],
	currentPost: BlogPost
): { prev: BlogPost | null; next: BlogPost | null } {
	const index = posts.findIndex((p) => p.slug === currentPost.slug);
	return {
		prev: index > 0 ? posts[index - 1] : null,
		next: index < posts.length - 1 ? posts[index + 1] : null
	};
}

export function getTagCounts(
	posts: BlogPost[],
	tags: string[]
): { name: string; slug: string; count: number }[] {
	return tags.map((tag) => ({
		name: tag,
		slug: slugify(tag),
		count: posts.filter((post) => post.tags.includes(tag)).length
	}));
}

export function getAllCategories(posts: BlogPost[]): BlogCategory[] {
	const categoryMap = new Map<string, number>();

	posts.forEach((post) => {
		const count = categoryMap.get(post.category) || 0;
		categoryMap.set(post.category, count + 1);
	});

	const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
		name,
		count,
		slug: slugify(name)
	}));

	return categories.sort((a, b) => b.count - a.count);
}

export function getAllTags(posts: BlogPost[]): string[] {
	const tags = new Set<string>();
	posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
	const tagsArray = Array.from(tags);
	return tagsArray.sort((a, b) => b.length - a.length);
}
