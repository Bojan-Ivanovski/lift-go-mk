import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://liftgomk.lolmystuped.chatgpt.site',
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  compressHTML: true,
});
