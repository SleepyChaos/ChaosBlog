import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** 按发布日期从新到旧排序 */
export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 按年份分组,组内从新到旧 */
export function groupByYear(posts: Post[]) {
  const groups = new Map<number, Post[]>();
  for (const post of sortPosts(posts)) {
    const year = post.data.pubDate.getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(post);
  }
  return [...groups.entries()];
}

/** 统计所有标签及文章数,按文章数降序 */
export function getAllTags(posts: Post[]) {
  const tags = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
  }
  return [...tags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
}

/** 2026-08-28 */
export function formatDateShort(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 2026 年 8 月 28 日 */
export function formatDateLong(date: Date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

/** 粗略估算阅读时长:中文按每分钟 400 字,英文按每分钟 200 词 */
export function readingTime(text: string) {
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) ?? []).length;
  const latin = (text.replace(/[\u4e00-\u9fff\u3040-\u30ff]/g, ' ').match(/[a-zA-Z0-9]+/g) ?? []).length;
  const minutes = Math.max(1, Math.round(cjk / 400 + latin / 200));
  return `约 ${minutes} 分钟读完`;
}
