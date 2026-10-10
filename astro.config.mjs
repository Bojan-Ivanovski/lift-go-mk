import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://bojan-ivanovski.github.io',
  base: process.env.BASE_PATH ?? '/lift-go-mk/',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  compressHTML: true,
  // Small compressed styles are delivered with HTML, avoiding blocking CSS round trips.
  build: { inlineStylesheets: 'always' },
});
