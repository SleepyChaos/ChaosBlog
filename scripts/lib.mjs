/**
 * 内容规范共享库:三个内容脚本(new / check / export)共用的解析与校验逻辑。
 * 规范文档:documents/README.md
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const DOCS_DIR = path.join(ROOT, 'documents');
export const POSTS_DIR = path.join(DOCS_DIR, 'posts');
export const PAGES_DIR = path.join(DOCS_DIR, 'pages');

/** 规范允许的 frontmatter 字段(schema 字段的超集,含别名) */
export const KNOWN_FIELDS = [
  'title',
  'date',
  'pubDate',
  'updated',
  'updatedDate',
  'description',
  'summary',
  'tags',
  'draft',
  'published',
  'slug',
];

/** 页面 slug 不能占用这些内置路由 */
export const RESERVED_SLUGS = new Set(['posts', 'tags', '404', 'index', 'rss.xml', 'sitemap-index.xml', 'api']);

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

export function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.md$/i.test(f))
    .sort();
}

/** 文件名 → slug:去掉 .md 后缀和可选的 YYYY-MM-DD- 前缀 */
export function slugFromFilename(file) {
  return file.replace(/\.md$/i, '').replace(DATE_PREFIX, '');
}

/** 标题 → 推荐的 slug:空白转连字符,去掉文件系统/URL 非法字符,保留中文 */
export function sanitizeSlug(input) {
  const cleaned = input
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=~^[\]()、,。;:!?"'《》【】·]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'untitled';
}

/**
 * 读取并校验单个文档。
 * 返回 { kind, file, rel, errors, warnings, doc },doc 为归一化后的数据。
 */
export function parseDoc(kind, file) {
  const dir = kind === 'posts' ? POSTS_DIR : PAGES_DIR;
  const abs = path.join(dir, file);
  const rel = `documents/${kind}/${file}`;
  const { data, content } = matter(fs.readFileSync(abs, 'utf8'));
  const errors = [];
  const warnings = [];

  // title 必填
  if (typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('缺少 title');
  }

  // date 必填(文章),接受 date/pubDate 别名
  let date = null;
  const rawDate = data.date ?? data.pubDate;
  if (rawDate === undefined) {
    if (kind === 'posts') errors.push('缺少 date(或别名 pubDate)');
  } else {
    date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) errors.push(`date 无法解析:${rawDate}`);
  }

  const tags = data.tags ?? [];
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) {
    errors.push('tags 必须是字符串数组,如 [技术, 随笔]');
  }

  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    errors.push('draft 必须是布尔值');
  }

  // slug:取 frontmatter 的 slug 字段,否则由文件名推导
  const slug = typeof data.slug === 'string' && data.slug ? data.slug : slugFromFilename(file);
  if (/\s/.test(slug)) errors.push(`slug 含空格:「${slug}」,请修改文件名或用 slug 字段覆盖`);
  if (kind === 'pages' && RESERVED_SLUGS.has(slug.toLowerCase())) {
    errors.push(`页面 slug「${slug}」与内置路由冲突,请改名`);
  }

  // 别名提示(不是错误,但规范推荐用标准字段)
  if (data.pubDate !== undefined) warnings.push('「pubDate」是别名,规范推荐用 date');
  if (data.summary !== undefined) warnings.push('「summary」是别名,规范推荐用 description');
  if (data.published !== undefined) warnings.push('「published」是别名,规范推荐用 draft');
  if (data.updatedDate !== undefined) warnings.push('「updatedDate」是别名,规范推荐用 updated');
  if (data.slug !== undefined && data.slug !== slugFromFilename(file)) {
    warnings.push(`slug 字段覆盖了文件名推导值,最终 URL slug 为「${slug}」`);
  }

  // 未知字段:最常见的拼写错误来源(如 tag 写成单数)
  for (const key of Object.keys(data)) {
    if (!KNOWN_FIELDS.includes(key)) warnings.push(`未知字段「${key}」,将被忽略(检查是否拼写错误)`);
  }

  // 本地图片存在性检查
  const imageRefs = [...content.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]);
  for (const src of imageRefs) {
    if (/^(https?:)?\/\//.test(src)) continue;
    let fsPath;
    if (src.startsWith('/')) {
      fsPath = path.join(ROOT, 'public', src.replace(/^\/ChaosBlog/, ''));
    } else {
      fsPath = path.resolve(path.dirname(abs), src);
    }
    if (!fs.existsSync(fsPath)) {
      warnings.push(`图片不存在:${src}(建议放 public/images/ 并用 /ChaosBlog/images/… 引用)`);
    }
  }

  return {
    kind,
    file,
    rel,
    errors,
    warnings,
    doc: {
      slug,
      title: typeof data.title === 'string' ? data.title : '',
      description: data.description ?? data.summary ?? '',
      date,
      tags: Array.isArray(tags) ? tags : [],
      draft: data.draft === true || data.published === false,
    },
  };
}

/** 读取整个 documents/ 目录并做跨文件校验(slug 去重) */
export function loadAll() {
  const posts = listMarkdown(POSTS_DIR).map((f) => parseDoc('posts', f));
  const pages = listMarkdown(PAGES_DIR).map((f) => parseDoc('pages', f));

  const seen = new Map();
  for (const item of [...posts, ...pages]) {
    const key = `${item.kind}/${item.doc.slug}`;
    if (seen.has(key)) {
      item.errors.push(`slug「${item.doc.slug}」与 ${seen.get(key)} 重复`);
    } else {
      seen.set(key, item.rel);
    }
  }

  return { posts, pages };
}
