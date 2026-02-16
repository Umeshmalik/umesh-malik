import { getAllPosts, getPostsByTag, getAllTags, slugify } from '$lib/utils/blog';
import type { PageServerLoad, EntryGenerator } from './$types';

export const entries: EntryGenerator = async () => {
	const posts = await getAllPosts();
	const tags = getAllTags(posts);
	return tags.map((tag) => ({ tag: slugify(tag) }));
};

export const load: PageServerLoad = async ({ params }) => {
	const allPosts = await getAllPosts();
	const posts = getPostsByTag(allPosts, params.tag);

	// Find the original display name from all tags
	const allTags = getAllTags(allPosts);
	const matched = allTags.find((t) => slugify(t) === params.tag);
	const tag = matched ?? params.tag;

	return {
		posts,
		tag
	};
};
