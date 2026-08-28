# Chaos's Blog

个人博客,基于 [Astro](https://astro.build) 构建,部署在 GitHub Pages。

**线上地址**:<https://sleepychaos.github.io/ChaosBlog/>

## 写新文章

文档目录 `documents/` 是唯一的内容源,规范见 [documents/README.md](documents/README.md)。最方便的方式:

```bash
npm run new -- "文章标题"              # 生成草稿,自动带好 frontmatter
npm run new -- "标题" --tags 技术,随笔  # 顺便指定标签
npm run content:check                  # 发布前校验规范
```

把生成文件里的 `draft` 改为 `false`,git push 即自动上线。也可以直接把符合规范的 `.md` 文件放进 `documents/posts/`,前端自动读取,无需手动挂载。

## 内容架构(为模板迁移设计)

- `documents/` — 唯一内容源,固定规范,与博客框架无关(兼容 Hexo/Jekyll 字段习惯)
- `src/lib/content.ts` — 内容读取器,前端唯一的对接接口
- `npm run content:export` — 导出框架无关的 `content-manifest.json`,任何模板可直接消费

将来换博客模板时文章零改动,只需在新模板里按同样签名实现读取接口(或直接读 manifest JSON)。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 本地开发,http://localhost:4321/ChaosBlog/ |
| `npm run build` | 构建到 `./dist/` |
| `npm run preview` | 本地预览构建结果 |
| `npm run new` | 新建文章/页面(内容写入器) |
| `npm run content:check` | 校验 documents/ 规范 |
| `npm run content:export` | 导出 content-manifest.json |

## 部署

push 到 `main` 分支后,GitHub Actions(`.github/workflows/deploy.yml`)会自动构建并发布到 GitHub Pages,约一分钟生效。

## 功能

- 🌗 明暗主题切换(跟随系统,手动切换会记住偏好)
- 🏷️ 标签系统与按年份归档
- 📡 RSS 订阅(`/rss.xml`)与 sitemap
- 🎨 代码高亮双主题(Shiki)
- 📱 移动端适配
