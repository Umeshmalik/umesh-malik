import { getAllPosts, getPostsByTag } from '$lib/utils/blog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const allPosts = await getAllPosts();
	const posts = getPostsByTag(allPosts, params.tag);

	return {
		posts,
		tag: params.tag
	};
};
