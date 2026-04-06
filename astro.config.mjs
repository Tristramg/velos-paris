import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'static',
  base: process.env.BASE_PATH || '/',
  build: {
    format: 'directory',
  },
  image: {
    domains: ['filer.eco-counter-tools.com'],
  },
});
