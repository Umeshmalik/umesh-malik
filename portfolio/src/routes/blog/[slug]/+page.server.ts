import {
	getAllPosts,
	getRelatedPosts,
	getAdjacentPosts,
	getTagCounts
} from '$lib/utils/blog';
import type { PageServerLoad, EntryGenerator } from './$types';

export const entries: EntryGenerator = async () => {
	const posts = getAllPosts();
	return posts.map((post) => ({ slug: post.slug! }));
};

export const load: PageServerLoad = async ({ params }) => {
	const allPosts = getAllPosts();
	const postMeta = allPosts.find((p) => p.slug === params.slug);

	if (!postMeta) {
		return { status: 404 };
	}

	const relatedPosts = getRelatedPosts(allPosts, postMeta);
	const { prev: prevPost, next: nextPost } = getAdjacentPosts(allPosts, postMeta);
	const tagCounts = getTagCounts(allPosts, postMeta.tags);

	return {
		postMeta,
		relatedPosts,
		prevPost,
		nextPost,
		tagCounts
	};
};
