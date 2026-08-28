#!/usr/bin/env node
/**
 * 校验器:检查 documents/ 下的所有文档是否符合规范。
 *   npm run content:check
 * 有错误时退出码为 1,可用于 CI 或提交前检查。
 */
import { loadAll } from './lib.mjs';

const { posts, pages } = loadAll();
let errorCount = 0;
let warnCount = 0;

for (const item of [...posts, ...pages]) {
  const draft = item.doc.draft ? ' [草稿]' : '';
  if (item.errors.length === 0 && item.warnings.length === 0) {
    console.log(`✓ ${item.rel}${draft}`);
    continue;
  }
  console.log(`\n${item.rel}${draft}`);
  for (const e of item.errors) {
    console.log(`  ✗ ${e}`);
    errorCount++;
  }
  for (const w of item.warnings) {
    console.log(`  ! ${w}`);
    warnCount++;
  }
}

console.log(`\n共 ${posts.length} 篇文章、${pages.length} 个页面:${errorCount} 个错误,${warnCount} 个警告`);
process.exit(errorCount > 0 ? 1 : 0);
