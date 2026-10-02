/**
 * inbox/ 同步器:把各源仓库推送到 inbox/<仓库名>/ 的 Markdown 转换为博客文章草稿。
 *   npm run sync:inbox(由 sync-inbox workflow 调用,也可本地手动执行)
 *
 * 约定(源仓库 README 有说明,这里只认规则):
 *   - 源仓库 public/ 下的 .md 会被其 workflow 原样推送到本仓库 inbox/<仓库名>/
 *   - frontmatter `publishable: false` → 跳过,不同步;已同步过的草稿一并删除
 *   - frontmatter `publish: true` → 直接发布(draft: false);否则一律落为草稿
 *   - 源文件删除 → 对应文章删除(草稿和已发布一视同仁:public/ 是显式上传区,从源删除即撤回发布)
 *
 * 幂等:documents/.sync-manifest.json 记录 源路径 → 目标文件 与内容指纹。
 * 不改动正文内容(%% 注释等 Obsidian 方言只在输出里提醒),格式转换只碰 frontmatter 和文件名。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { ROOT, POSTS_DIR, parseDoc, sanitizeSlug } from './lib.mjs';

const INBOX_DIR = path.join(ROOT, 'inbox');
const MANIFEST_FILE = path.join(ROOT, 'documents', '.sync-manifest.json');

function loadManifest() {
  if (fs.existsSync(MANIFEST_FILE)) {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  }
  return {};
}

/** inbox/<repo>/ 递归列出所有 markdown,返回 [{ repo, relPath, abs }] */
function scanInbox() {
  const files = [];
  if (!fs.existsSync(INBOX_DIR)) return files;
  for (const repo of fs.readdirSync(INBOX_DIR)) {
    const repoDir = path.join(INBOX_DIR, repo);
    if (!fs.statSync(repoDir).isDirectory()) continue;
    const walk = (dir, rel) => {
      for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const relPath = rel ? `${rel}/${name}` : name;
        if (fs.statSync(abs).isDirectory()) {
          walk(abs, relPath);
        } else if (/\.md$/i.test(name)) {
          files.push({ repo, relPath, abs });
        } else {
          console.log(`  ! 忽略非 Markdown 文件:inbox/${repo}/${relPath}`);
        }
      }
    };
    walk(repoDir, '');
  }
  return files;
}

function normalizeDate(raw) {
  if (raw !== undefined && raw !== null && raw !== '') {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    console.log(`  ! date 无法解析(${raw}),回退为今天`);
  }
  return new Date().toISOString().slice(0, 10);
}

function normalizeTags(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
  return [];
}

/** 取正文第一个像“内容”的段落(跳过标题、代码块、引用块/callout),截断 120 字,作为列表/RSS 摘要 */
function deriveDescription(content) {
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('>')) continue;
    const plain = t.replace(/[*_`~]/g, '');
    return plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;
  }
  return '';
}

/** 生成目标文章的完整文本 */
function renderPost({ title, date, description, tags, draft, content }) {
  return matter.stringify(content.trimEnd() + '\n', {
    title,
    date,
    ...(description ? { description } : {}),
    ...(tags.length ? { tags } : {}),
    draft,
  });
}

function parseTargetDraft(targetFile) {
  const abs = path.join(POSTS_DIR, targetFile);
  if (!fs.existsSync(abs)) return null;
  try {
    return parseDoc('posts', targetFile).doc.draft;
  } catch {
    return null;
  }
}

export function main() {
  const manifest = loadManifest();
  const nextManifest = {};
  const stats = { synced: 0, updated: 0, unchanged: 0, published: 0, skipped: 0, deleted: 0 };
  const seenSources = new Set();

  for (const { repo, relPath, abs } of scanInbox()) {
    const sourceKey = `${repo}/${relPath}`;
    const { data: fm, content } = matter(fs.readFileSync(abs, 'utf8'));
    console.log(`\n检查 inbox/${sourceKey}`);

    if (fm.publishable === false) {
      console.log('  - publishable: false,跳过不同步');
      stats.skipped++;
      handleRemoval(manifest, nextManifest, sourceKey, stats, '已标记 publishable: false');
      continue;
    }
    seenSources.add(sourceKey);

    const title = typeof fm.title === 'string' && fm.title.trim() ? fm.title.trim() : path.basename(relPath).replace(/\.md$/i, '');
    const date = normalizeDate(fm.date ?? fm.pubDate);
    const tags = normalizeTags(fm.tags);
    const description = typeof fm.description === 'string' && fm.description ? fm.description : deriveDescription(content);
    const draft = fm.publish !== true;
    if (!draft) console.log('  - publish: true,将直接发布');

    // slug 推导:目录参与命名,但文件名自带的日期前缀去掉(目标文件名已含解析后的日期)
    const parts = relPath.replace(/\.md$/i, '').split('/');
    const stem = parts.pop().replace(/^\d{4}-\d{2}-\d{2}-/, '');
    let slug = sanitizeSlug(parts.concat(stem).join('-'));
    let target = `${date}-${slug}.md`;

    // 目标文件名变化(日期或路径变了):删除旧文件,内容随新文件重新落库
    const prev = manifest[sourceKey];
    if (prev && prev.target && prev.target !== target && fs.existsSync(path.join(POSTS_DIR, prev.target))) {
      fs.unlinkSync(path.join(POSTS_DIR, prev.target));
      console.log(`  - 目标文件名变化:${prev.target} → ${target}(旧文件已删除)`);
    }
    // slug 撞上其他来源:加仓库前缀
    if (prev?.target !== target && fs.existsSync(path.join(POSTS_DIR, target))) {
      slug = sanitizeSlug([repo, ...parts, stem].join('-'));
      target = `${date}-${slug}.md`;
    }

    const text = renderPost({ title, date, description, tags, draft, content });
    const targetAbs = path.join(POSTS_DIR, target);
    const existed = fs.existsSync(targetAbs);
    if (existed && fs.readFileSync(targetAbs, 'utf8') === text) {
      stats.unchanged++;
      console.log(`  = 内容无变化:${target}`);
    } else {
      fs.writeFileSync(targetAbs, text);
      if (existed && prev?.target === target) {
        stats.updated++;
        console.log(`  √ 已更新:${target}${draft ? '' : '(发布状态)'}`);
      } else {
        if (draft) stats.synced++;
        else stats.published++;
        console.log(`  √ 已写入:${target}${draft ? '(草稿)' : '(直接发布)'}`);
      }
    }
    if (/%/.test(content.replace(/```[\s\S]*?```/g, ''))) {
      console.log('  ! 正文含 %% 注释(Obsidian 方言),发布前请手动处理');
    }
    nextManifest[sourceKey] = { target, hash: crypto.createHash('sha256').update(text).digest('hex').slice(0, 16) };
  }

  // 删除检查:清单里有、本次扫描没见到的源,即视为源端已撤回。
  // handleRemoval 按清单删除对应文章,无需额外的目录存在性护栏。
  for (const [sourceKey, entry] of Object.entries(manifest)) {
    if (seenSources.has(sourceKey)) continue;
    handleRemoval(manifest, nextManifest, sourceKey, stats, '源文件已删除');
  }

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(nextManifest, null, 2) + '\n');

  console.log(
    `\n同步完成:新增草稿 ${stats.synced},更新 ${stats.updated},无变化 ${stats.unchanged},直接发布 ${stats.published},跳过 ${stats.skipped},删除文章 ${stats.deleted}`,
  );
}

/** 源端不再提供该文件时:删除对应文章(草稿和已发布一视同仁,public/ 的删除即撤回发布) */
function handleRemoval(manifest, nextManifest, sourceKey, stats, reason) {
  const entry = manifest[sourceKey];
  if (!entry?.target) return;
  const abs = path.join(POSTS_DIR, entry.target);
  if (!fs.existsSync(abs)) return;
  const wasPublished = parseTargetDraft(entry.target) === false;
  fs.unlinkSync(abs);
  stats.deleted++;
  console.log(`  - ${reason},已删除${wasPublished ? "已发布文章" : "草稿"}:${entry.target}`);
}

main();
