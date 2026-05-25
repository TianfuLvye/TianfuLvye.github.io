import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    ssr: {
      // three / R3F 只在客户端渲染，SSR 时不要尝试解析
      noExternal: ['@react-three/fiber', '@react-three/drei', 'three'],
    },
  },
});
