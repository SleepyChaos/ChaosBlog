#!/usr/bin/env node
/**
 * 写入器:按 documents/ 规范生成新文章/页面的脚手架。
 *
 * 用法:
 *   npm run new -- "文章标题"                    # 新建文章 documents/posts/2026-08-28-文章标题.md
 *   npm run new -- "标题" --slug my-slug        # 指定 URL slug
 *   npm run new -- "标题" --tags 技术,随笔      # 指定标签(逗号分隔)
 *   npm run new -- "页面标题" --page            # 新建独立页面 documents/pages/标题.md
 *   npm run new -- "关于我" --page --slug about
 */
import fs from 'node:fs';
import path from 'node:path';
import { POSTS_DIR, PAGES_DIR, sanitizeSlug } from './lib.mjs';

const args = process.argv.slice(2);
const positionals = [];
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--slug') flags.slug = args[++i];
  else if (args[i] === '--tags') flags.tags = args[++i];
  else if (args[i] === '--page') flags.page = true;
  else positionals.push(args[i]);
}

const title = positionals[0];
if (!title) {
  console.error('用法:npm run new -- "标题" [--slug my-slug] [--tags 技术,随笔] [--page]');
  process.exit(1);
}

const kind = flags.page ? 'pages' : 'posts';
const dir = flags.page ? PAGES_DIR : POSTS_DIR;
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const slug = flags.slug || sanitizeSlug(title);
const filename = flags.page ? `${slug}.md` : `${dateStr}-${slug}.md`;
const abs = path.join(dir, filename);

if (fs.existsSync(abs)) {
  console.error(`✗ 文件已存在:${path.relative(process.cwd(), abs)}`);
  process.exit(1);
}

const tags = (flags.tags || '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);
const tagsYaml = tags.length ? `\n    - ${tags.join('\n    - ')}` : '[]';

const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${dateStr}
description: ""
tags: ${tagsYaml}
draft: true
---
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(abs, `${frontmatter}\n正文从这里开始。\n`);

console.log(`✓ 已创建:${path.relative(process.cwd(), abs)}`);
console.log('  新文章默认 draft: true,写完后改成 false 才会发布。');
console.log('  发布前建议运行:npm run content:check');
