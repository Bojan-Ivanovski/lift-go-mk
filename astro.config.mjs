import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://liftgomk.vocal-frog-6370.chatgpt.site',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  compressHTML: true,
});
