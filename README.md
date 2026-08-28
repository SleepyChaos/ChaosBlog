# Chaos's Blog

个人博客,基于 [Astro](https://astro.build) 构建,部署在 GitHub Pages。

**线上地址**:<https://sleepychaos.github.io/ChaosBlog/>

## 写新文章

在 `src/content/blog/` 下新建 `.md` 文件,写好 frontmatter 即可:

```md
---
title: 文章标题
description: 一句话摘要(会显示在列表和 RSS 里)
pubDate: 2026-08-28
tags: [技术, 随笔]
draft: false
---

正文从这里开始……
```

`draft: true` 的文章不会出现在任何页面和 RSS 里。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 本地开发,http://localhost:4321/ChaosBlog/ |
| `npm run build` | 构建到 `./dist/` |
| `npm run preview` | 本地预览构建结果 |

## 部署

push 到 `main` 分支后,GitHub Actions(`.github/workflows/deploy.yml`)会自动构建并发布到 GitHub Pages,约一分钟生效。

## 功能

- 🌗 明暗主题切换(跟随系统,手动切换会记住偏好)
- 🏷️ 标签系统与按年份归档
- 📡 RSS 订阅(`/rss.xml`)与 sitemap
- 🎨 代码高亮双主题(Shiki)
- 📱 移动端适配
