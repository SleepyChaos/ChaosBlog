# 文档目录规范

`documents/` 是本博客**唯一的内容源**。只要按本规范把 Markdown 文件放进来,博客前端就会自动读取,无需手动挂载任何页面或路由。

规范刻意与 Hexo / Jekyll 的约定保持兼容(`title` / `date` / `tags` / `draft` 等字段名一致),将来迁移到任何主流博客系统成本都很低。

## 目录结构

```text
documents/
├── posts/     # 博客文章,一篇一个 .md 文件
├── pages/     # 独立页面(如 about.md → /about/),文件名即 URL slug
└── README.md  # 本规范
```

## 文件命名

- **文章**:推荐 `YYYY-MM-DD-slug.md`,如 `2026-08-28-my-first-post.md`。日期前缀可省略,也不作为文章日期的来源(日期以 frontmatter 的 `date` 为准);有前缀时,前缀会自动从 URL slug 中去掉,如上例的 URL 是 `/posts/my-first-post/`。
- **页面**:直接用 slug 命名,如 `about.md` → `/about/`。slug 不能与内置路由(`posts`、`tags`、`404`、`index`)冲突。
- slug 允许中文(浏览器会自动编码),但推荐用小写英文和连字符。

## frontmatter 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 文章标题 |
| `date` | 文章✅ | 发布日期,如 `2026-08-28` 或 `2026-08-28 15:30:00` |
| `description` | 建议 | 一句话摘要,显示在列表和 RSS 中 |
| `tags` | 可选 | 标签数组,如 `[技术, 随笔]` |
| `draft` | 可选 | `true` 表示草稿,不出现在任何页面和 RSS,默认 `false` |
| `updated` | 可选 | 最后更新时间 |
| `slug` | 可选 | 覆盖由文件名推导的 URL slug(不推荐,留空即可) |

兼容别名(会自动识别,但建议用标准字段):`pubDate` → `date`、`summary` → `description`、`published: false` → `draft: true`、`updatedDate` → `updated`。

> 用 `npm run new` 生成的文件自带完整 frontmatter,不需要手写。

## 图片

放在 `public/images/` 下,文中用绝对路径引用(带站点 base 前缀):

```md
![说明文字](/ChaosBlog/images/example.png)
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run new -- "标题"` | 新建文章(默认草稿状态) |
| `npm run new -- "标题" --tags 技术,随笔` | 新建文章并指定标签 |
| `npm run new -- "页面名" --page --slug about` | 新建独立页面 |
| `npm run content:check` | 校验所有文档是否符合规范(错误会使构建前检查失败) |
| `npm run content:export` | 导出框架无关的 `content-manifest.json` |

写完文章 → `draft` 改为 `false` → `git push`,约一分钟后自动上线。

## 迁移指南(给未来的自己)

内容与展示已解耦,迁移博客模板时:

1. **文章零成本**:把整个 `documents/` 目录拷贝到新项目即可,内容不需要任何改动。
2. **只需对接口**:新模板里实现与 `src/lib/content.ts` 相同的函数(`getAllPosts` / `getPostBySlug` / `getAllTags` / `getAllPages` / `renderPost`…,函数签名见该文件注释),前端页面只依赖这些函数。
3. **或者更简单**:运行 `npm run content:export` 得到 `content-manifest.json`(包含所有文章/页面的元数据和源文件路径),任何语言/框架的前端都能直接消费这份 JSON。
