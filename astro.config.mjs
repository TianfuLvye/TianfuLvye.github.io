import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { remarkObsidianImages } from './src/lib/remark-obsidian-images.ts';
import { remarkObsidianWikilinks } from './src/lib/remark-obsidian-wikilinks.ts';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    remarkPlugins: [remarkObsidianImages, remarkObsidianWikilinks],
  },
  vite: {
    ssr: {
      // three / R3F 只在客户端渲染，SSR 时不要尝试解析
      noExternal: ['@react-three/fiber', '@react-three/drei', 'three'],
    },
  },
});
