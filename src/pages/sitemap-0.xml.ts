import type { APIRoute } from 'astro';
import { seoPages, absoluteUrl } from '../data/seo';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const pages = Object.keys(seoPages).map((route) => absoluteUrl(site, route));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`).join('\n  ')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
