import { getAllPosts, getPostsByTag, getAllTags } from '$lib/utils/blog';
import type { PageServerLoad, EntryGenerator } from './$types';

export const entries: EntryGenerator = async () => {
	const posts = await getAllPosts();
	const tags = getAllTags(posts);
	return tags.map((tag) => ({ tag: tag.toLowerCase() }));
};

export const load: PageServerLoad = async ({ params }) => {
	const allPosts = await getAllPosts();
	const posts = getPostsByTag(allPosts, params.tag);

	return {
		posts,
		tag: params.tag
	};
};
