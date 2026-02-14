import { getPostBySlug, getAllPosts, getRelatedPosts } from '$lib/utils/blog';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const post = await getPostBySlug(params.slug);
	const allPosts = await getAllPosts();
	const relatedPosts = getRelatedPosts(allPosts, post);

	return {
		post,
		relatedPosts
	};
};
