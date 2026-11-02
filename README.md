# Chaos's Blog

个人博客,基于 [Astro](https://astro.build) 构建,部署在 GitHub Pages。

**线上地址**:<https://sleepychaos.github.io/ChaosBlog/>

## 本地预览

需要 Git、Node.js 22.12.0 或更新版本，以及 npm。仓库包含 `package-lock.json`，使用锁文件安装：

```bash
git clone https://github.com/SleepyChaos/ChaosBlog.git
cd ChaosBlog
npm ci
npm run content:check
npm run build
npm run preview
```

打开终端给出的预览地址，站点使用 `/ChaosBlog/` 基路径。日常开发可运行 `npm run dev`；内容约定见 [documents/README.md](documents/README.md)。

## 写新文章

文档目录 `documents/` 是唯一的内容源,规范见 [documents/README.md](documents/README.md)。最方便的方式:

```bash
npm run new -- "文章标题"              # 生成草稿,自动带好 frontmatter
npm run new -- "标题" --tags 技术,随笔  # 顺便指定标签
npm run content:check                  # 发布前校验规范
```

把生成文件里的 `draft` 改为 `false`，通过内容检查后提交并推送到 `main`，由部署工作流构建发布。也可以直接把符合规范的 `.md` 文件放进 `documents/posts/`,前端自动读取,无需手动挂载。

## 内容架构(为模板迁移设计)

- `documents/` — 唯一内容源,固定规范,与博客框架无关(兼容 Hexo/Jekyll 字段习惯)
- `src/lib/content.ts` — 内容读取器,前端唯一的对接接口
- `npm run content:export` — 导出框架无关的 `content-manifest.json`,任何模板可直接消费

将来换博客模板时文章零改动,只需在新模板里按同样签名实现读取接口(或直接读 manifest JSON)。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm ci` | 按锁文件安装依赖 |
| `npm run dev` | 本地开发,http://localhost:4321/ChaosBlog/ |
| `npm run build` | 构建到 `./dist/` |
| `npm run preview` | 本地预览构建结果 |
| `npm run new` | 新建文章/页面(内容写入器) |
| `npm run content:check` | 校验 documents/ 规范 |
| `npm run content:export` | 导出 content-manifest.json |

## 部署

推送到 `main` 后，[部署工作流](.github/workflows/deploy.yml)负责构建并发布到 GitHub Pages；实际结果以 Actions 的完成状态为准。修改域名或仓库名时，应同时核对 `astro.config.mjs` 的站点地址与基路径。

`documents/` 是站点读取的内容源，`inbox/` 用于同步接入。同步规则见 [内容规范](documents/README.md)，不要把未选入发布范围的笔记直接放入公开文章目录。

## 功能

- 🌗 明暗主题切换(跟随系统,手动切换会记住偏好)
- 🏷️ 标签系统与按年份归档
- 📡 RSS 订阅(`/rss.xml`)与 sitemap
- 🎨 代码高亮双主题(Shiki)
- 📱 移动端适配

## 项目结构

```text
documents/  Markdown 文章、页面与内容约定
src/        Astro 页面、组件、布局和样式
scripts/    内容创建、校验、同步与导出
public/     不经构建处理的静态资源
```

## 内容与复用

文章、代码和引用资源应分别保留来源说明。仓库目前没有根目录许可证文件；第三方资料及组件遵循各自的授权，不将其视为统一由本站重新授权。
