import type { APIRoute } from 'astro';
import { absoluteUrl, siteLink } from '../data/seo';

export const prerender = true;

// Only an origin-root /robots.txt controls crawling. On GitHub project Pages,
// this output is a ready-to-copy policy for the owner's root site/domain.
export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      '# LiftGoMK public pages are available to search and AI search crawlers.',
      'User-agent: *',
      'Allow: /',
      `Disallow: ${siteLink('admin/')}`,
      '',
      `Sitemap: ${absoluteUrl(site, 'sitemap-index.xml')}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
