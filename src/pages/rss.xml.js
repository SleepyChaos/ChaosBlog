import rss from '@astrojs/rss';
import { getAllPosts } from '../lib/content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const posts = await getAllPosts();
  const base = import.meta.env.BASE_URL;

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: new URL(base, context.site),
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.pubDate,
      link: `${base}/posts/${post.slug}/`,
    })),
  });
}
