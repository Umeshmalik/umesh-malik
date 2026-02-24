import { error } from '@sveltejs/kit';
import type { BlogPost, BlogCategory, BlogPostModule } from '$lib/types/blog';
import { siteConfig } from '$lib/config/site';

const DEFAULT_COVER_IMAGE = '/blog/default-cover.jpg';

// Detect available blog images at build time via Vite glob
const availableBlogImages = new Set(
	Object.keys(import.meta.glob('/static/blog/*.{jpg,jpeg,png,webp,svg}')).map((p) =>
		p.replace(/^\/static/, '')
	)
);

/** Resolve image path — validates existence on disk, falls back to default */
function resolveImage(image: string | undefined): string {
	return image && availableBlogImages.has(image) ? image : DEFAULT_COVER_IMAGE;
}

/** Resolve a raster OG image for social/Google — SVGs need a .png sibling, else default */
function resolveOgImage(image: string): string {
	if (/\.(jpe?g|png|webp)$/i.test(image)) return image;
	if (image.endsWith('.svg')) {
		const pngPath = image.replace(/\.svg$/, '.png');
		if (availableBlogImages.has(pngPath)) return pngPath;
	}
	return DEFAULT_COVER_IMAGE;
}

/** Create a URL-safe slug from a string */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// Eagerly import only metadata from all posts (tiny, no content/component)
// This avoids sequential async imports and makes getAllPosts synchronous at runtime
const postMetadataModules = import.meta.glob('$lib/posts/*.md', {
	eager: true,
	import: 'metadata'
});

// Lazy imports for full post modules (content + metadata) — only used for single post loading
const postContentModules = import.meta.glob('$lib/posts/*.md');

let _cachedPosts: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
	if (_cachedPosts) return _cachedPosts;

	const posts: BlogPost[] = [];

	for (const [path, metadata] of Object.entries(postMetadataModules)) {
		const meta = metadata as BlogPost;
		const slug = path.split('/').pop()?.replace('.md', '');

		if (meta?.published) {
			const image = resolveImage(meta.image);
			posts.push({
				...meta,
				image,
				ogImage: resolveOgImage(image),
				slug: slug ?? ''
			});
		}
	}

	_cachedPosts = posts.sort(
		(a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
	);
	return _cachedPosts;
}

export async function getPostBySlug(slug: string): Promise<BlogPost> {
	try {
		const matchingPath = Object.keys(postContentModules).find((path) =>
			path.endsWith(`/${slug}.md`)
		);

		if (!matchingPath) {
			throw error(404, 'Post not found');
		}

		const post = (await postContentModules[matchingPath]()) as BlogPostModule;

		if (!post.metadata?.published) {
			throw error(404, 'Post not found');
		}

		const image = resolveImage(post.metadata.image);
		return {
			...post.metadata,
			image,
			ogImage: resolveOgImage(image),
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
