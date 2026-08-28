import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 内容来自 documents/ 目录,规范见 documents/README.md。
 * 字段兼容 Hexo/Jekyll 的常见写法:date/pubDate、description/summary、draft/published。
 * 别名的归一化在 src/lib/content.ts 中统一处理。
 */
const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date().optional(),
  pubDate: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  updatedDate: z.coerce.date().optional(),
  description: z.string().default(''),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  published: z.boolean().optional(),
  slug: z.string().optional(),
});

const pageSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  summary: z.string().optional(),
  draft: z.boolean().default(false),
  published: z.boolean().optional(),
  slug: z.string().optional(),
});

const posts = defineCollection({
  loader: glob({ base: './documents/posts', pattern: '**/*.md' }),
  schema: postSchema,
});

const pages = defineCollection({
  loader: glob({ base: './documents/pages', pattern: '**/*.md' }),
  schema: pageSchema,
});

export const collections = { posts, pages };
