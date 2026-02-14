import { getPostBySlug, getAllPosts, getRelatedPosts } from '$lib/utils/blog';
import type { PageLoad } from './$types';
import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = async () => {
	const posts = await getAllPosts();
	return posts.map((post) => ({ slug: post.slug! }));
};

export const load: PageLoad = async ({ params }) => {
	const post = await getPostBySlug(params.slug);
	const allPosts = await getAllPosts();
	const relatedPosts = getRelatedPosts(allPosts, post);

	return {
		post,
		relatedPosts
	};
};
