import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  base: process.env.BASE_PATH || '/',
  build: {
    format: 'directory',
  },
  image: {
    domains: ['filer.eco-counter-tools.com'],
  },
});
