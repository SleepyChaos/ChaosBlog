#!/usr/bin/env node
/**
 * 导出器:把 documents/ 导出为框架无关的 content-manifest.json。
 *   npm run content:export
 *
 * 将来迁移博客模板时,新前端可以直接消费这个 JSON,
 * 不需要理解 Markdown 解析细节(正文仍去 documents/ 按路径读取)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadAll, ROOT } from './lib.mjs';

const { posts, pages } = loadAll();
const broken = [...posts, ...pages].filter((p) => p.errors.length > 0);
if (broken.length > 0) {
  console.error('✗ 存在校验错误,请先运行 npm run content:check 修复后再导出:');
  for (const item of broken) {
    for (const e of item.errors) console.error(`  ${item.rel}: ${e}`);
  }
  process.exit(1);
}

const manifest = {
  conventionVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'documents/(规范见 documents/README.md)',
  posts: posts
    .map((p) => ({
      slug: p.doc.slug,
      title: p.doc.title,
      description: p.doc.description,
      date: p.doc.date ? p.doc.date.toISOString() : null,
      tags: p.doc.tags,
      draft: p.doc.draft,
      source: p.rel,
    }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date))),
  pages: pages.map((p) => ({
    slug: p.doc.slug,
    title: p.doc.title,
    description: p.doc.description,
    draft: p.doc.draft,
    source: p.rel,
  })),
};

const out = path.join(ROOT, 'content-manifest.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ 已导出 ${path.relative(process.cwd(), out)}(${posts.length} 篇文章,${pages.length} 个页面)`);
