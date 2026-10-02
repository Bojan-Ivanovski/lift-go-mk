import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://liftgomk.lolmystuped.chatgpt.site',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  compressHTML: true,
});
