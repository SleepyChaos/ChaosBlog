/**
 * 内容读取器(适配层)—— 前端页面唯一的内容入口。
 *
 * pages/ 下的页面只允许从这里导入内容与格式化工具,
 * astro:content 等框架专用 API 只出现在本文件。
 * 将来迁移博客模板时,只需在新模板中按同样的接口重新实现本文件
 * (或直接消费 npm run content:export 导出的 content-manifest.json),
 * 文档本身无需任何改动。
 */
import { getCollection, render, type CollectionEntry } from 'astro:content';

export interface PostSummary {
  /** URL 中的标识:来自文件名(自动去掉可选的 YYYY-MM-DD- 前缀)或 frontmatter 的 slug */
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  draft: boolean;
  /** 源文件在仓库中的路径 */
  sourcePath: string;
}

export interface PostFull extends PostSummary {
  body: string;
  /** 原始集合条目,仅供 renderPost 使用 */
  entry: CollectionEntry<'posts'>;
}

export interface PageFull {
  slug: string;
  title: string;
  description: string;
  draft: boolean;
  sourcePath: string;
  entry: CollectionEntry<'pages'>;
}

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

function normalizePost(entry: CollectionEntry<'posts'>): PostFull {
  const d = entry.data;
  const pubDate = d.pubDate ?? d.date;
  if (!pubDate) {
    throw new Error(`documents/posts/${entry.id}.md 缺少日期字段(date 或 pubDate)`);
  }
  return {
    slug: d.slug ?? entry.id.replace(DATE_PREFIX, ''),
    title: d.title,
    description: d.description || d.summary || '',
    pubDate,
    updatedDate: d.updatedDate ?? d.updated,
    tags: d.tags,
    draft: d.draft || d.published === false,
    sourcePath: `documents/posts/${entry.id}.md`,
    body: entry.body ?? '',
    entry,
  };
}

function normalizePage(entry: CollectionEntry<'pages'>): PageFull {
  const d = entry.data;
  return {
    slug: d.slug ?? entry.id,
    title: d.title,
    description: d.description || d.summary || '',
    draft: d.draft || d.published === false,
    sourcePath: `documents/pages/${entry.id}.md`,
    entry,
  };
}

/** 按发布日期从新到旧 */
export function sortPosts<T extends { pubDate: Date }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}

/** 按年份分组,组内从新到旧,返回 [年份, 文章数组] */
export function groupPostsByYear<T extends { pubDate: Date }>(posts: T[]): [number, T[]][] {
  const groups = new Map<number, T[]>();
  for (const post of sortPosts(posts)) {
    const year = post.pubDate.getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(post);
  }
  return [...groups.entries()];
}

/** 全部文章。draft: true 的文章默认不返回 */
export async function getAllPosts(includeDrafts = false): Promise<PostFull[]> {
  const posts = (await getCollection('posts')).map(normalizePost);
  return sortPosts(includeDrafts ? posts : posts.filter((p) => !p.draft));
}

export async function getPostBySlug(slug: string): Promise<PostFull | undefined> {
  return (await getAllPosts(true)).find((p) => p.slug === slug);
}

/** 统计标签及文章数,按文章数降序 */
export function getAllTags(posts: PostFull[]): [string, number][] {
  const tags = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
  }
  return [...tags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'));
}

export function getPostsByTag(posts: PostFull[], tag: string): PostFull[] {
  return sortPosts(posts.filter((p) => p.tags.includes(tag)));
}

/** 全部独立页面。draft: true 的页面默认不返回 */
export async function getAllPages(includeDrafts = false): Promise<PageFull[]> {
  const pages = (await getCollection('pages')).map(normalizePage);
  return includeDrafts ? pages : pages.filter((p) => !p.draft);
}

export async function getPageBySlug(slug: string): Promise<PageFull | undefined> {
  return (await getAllPages(true)).find((p) => p.slug === slug);
}

/** 渲染文章正文,返回含 <Content /> 的组件 */
export function renderPost(post: PostFull) {
  return render(post.entry);
}

/** 渲染页面正文,返回含 <Content /> 的组件 */
export function renderPage(page: PageFull) {
  return render(page.entry);
}

/* ================= 格式化工具 ================= */

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
