// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import remarkCallouts from 'remark-callouts';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://sleepychaos.github.io',
  base: '/ChaosBlog',
  integrations: [sitemap()],
  markdown: {
    // Obsidian 语法兼容:callout 引用块与 $...$/$$...$$ 数学公式
    processor: unified({
      remarkPlugins: [remarkCallouts, remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: {
      // 双主题:输出 --shiki-dark 变量,暗色模式下由 CSS 切换
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
