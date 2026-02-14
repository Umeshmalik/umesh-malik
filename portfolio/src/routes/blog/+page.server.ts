import { getAllPosts, getAllCategories, getAllTags, getFeaturedPosts } from '$lib/utils/blog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allPosts = await getAllPosts();

	return {
		posts: allPosts,
		categories: getAllCategories(allPosts),
		tags: getAllTags(allPosts),
		featuredPosts: getFeaturedPosts(allPosts)
	};
};
