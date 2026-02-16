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

	// Find the display name from the categories list
	const categories = getAllCategories(allPosts);
	const matched = categories.find((cat) => cat.slug === params.category);
	const category = matched?.name ?? params.category;

	return {
		posts,
		category
	};
};
