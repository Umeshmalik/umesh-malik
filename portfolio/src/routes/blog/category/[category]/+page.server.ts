import { getAllPosts, getPostsByCategory } from '$lib/utils/blog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const allPosts = await getAllPosts();
	const posts = getPostsByCategory(allPosts, params.category);
	const category = params.category.charAt(0).toUpperCase() + params.category.slice(1);

	return {
		posts,
		category
	};
};
