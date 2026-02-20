import { getPostBySlug } from '$lib/utils/blog';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, data }) => {
	// Server load (prerendered as JSON) provides metadata, related posts, tags, etc.
	// Universal load only imports the single post's content component.
	const post = await getPostBySlug(params.slug);

	return {
		post,
		relatedPosts: data.relatedPosts ?? [],
		prevPost: data.prevPost ?? null,
		nextPost: data.nextPost ?? null,
		tagCounts: data.tagCounts ?? []
	};
};
