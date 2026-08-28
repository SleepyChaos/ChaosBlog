import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortPosts } from '../utils';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const posts = sortPosts(await getCollection('blog', ({ data }) => !data.draft));
  const base = import.meta.env.BASE_URL;

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: new URL(base, context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${base}/posts/${post.id}/`,
    })),
  });
}
