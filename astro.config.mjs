// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sleepychaos.github.io',
  base: '/ChaosBlog',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 双主题:输出 --shiki-dark 变量,暗色模式下由 CSS 切换
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
