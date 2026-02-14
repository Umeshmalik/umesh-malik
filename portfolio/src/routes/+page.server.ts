import { getAllPosts, getFeaturedPosts } from '$lib/utils/blog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allPosts = await getAllPosts();

	return {
		featuredPosts: getFeaturedPosts(allPosts)
	};
};
