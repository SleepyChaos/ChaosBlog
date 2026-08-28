---
title: 这个博客是如何搭建的
description: 用 Astro + GitHub Pages 从零搭建博客的完整记录:技术选型、目录结构和自动部署。
pubDate: 2026-08-28
tags: [技术]
---

记录一下这座博客是怎么搭起来的,给想自己动手的朋友一个参考。

## 技术选型

| 维度 | 选择 | 理由 |
| --- | --- | --- |
| 框架 | Astro | 内容型网站首选,默认零 JS,构建快 |
| 托管 | GitHub Pages | 免费、稳定,和代码仓库一体化 |
| 部署 | GitHub Actions | push 即部署,全自动 |
| 评论 | (待定) | 计划接 giscus,评论存在 GitHub Discussions |

选 Astro 的核心原因是:**博客本质上是内容站,不需要为每篇文章付出一整套 React 运行时**。Astro 默认输出纯静态 HTML,按需才加载交互组件,首屏速度天然占优。

## 目录结构

```text
/
├── public/              # 静态资源(图标等)
├── src/
│   ├── content/blog/    # 文章,一篇一个 .md 文件
│   ├── components/      # 页头、页脚组件
│   ├── layouts/         # 基础布局(含暗色模式脚本)
│   ├── pages/           # 路由:首页、文章页、标签页、关于页
│   └── styles/          # 全局样式
└── astro.config.mjs     # 站点配置
```

## 关键配置

因为托管在 `sleepychaos.github.io` 的子路径下,需要设置 `base`:

```js
export default defineConfig({
  site: 'https://sleepychaos.github.io',
  base: '/ChaosBlog',
});
```

代码高亮用了 Shiki 的双主题模式,浅色和深色各配一套,暗色模式下由 CSS 变量切换:

```css
:root[data-theme='dark'] .astro-code,
:root[data-theme='dark'] .astro-code span {
  color: var(--shiki-dark, inherit);
}
```

## 自动部署

每次 `git push` 到 `main` 分支,GitHub Actions 会自动构建并发布:

```yaml
on:
  push:
    branches: [main]
```

整个流程是:**写 Markdown → git push → 自动上线**,大概一分钟生效。写作体验和纯粹记笔记几乎一样,这正是我想要的效果。
