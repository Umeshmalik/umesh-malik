import { getAllPosts, getPostsByCategory, getAllCategories } from '$lib/utils/blog';
import type { PageServerLoad, EntryGenerator } from './$types';

export const entries: EntryGenerator = async () => {
	const posts = await getAllPosts();
	const categories = getAllCategories(posts);
	return categories.map((cat) => ({ category: cat.slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	const allPosts = await getAllPosts();
	const posts = getPostsByCategory(allPosts, params.category);
	const category = params.category.charAt(0).toUpperCase() + params.category.slice(1);

	return {
		posts,
		category
	};
};
