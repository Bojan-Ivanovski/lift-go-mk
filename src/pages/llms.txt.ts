import type { APIRoute } from 'astro';
import content from '../content/site.json';
import { seoPages, absoluteUrl } from '../data/seo';
import { faqs } from '../data/faqs';
import { projects } from '../data/projects';

export const prerender = true;

/** Optional factual reading aid, generated from the same data as the website. */
export const GET: APIRoute = ({ site }) => {
  const url = (path = '') => absoluteUrl(site, path);
  const text = [
    `# ${content.business.name}`,
    '',
    `> ${content.seo.description}`,
    '',
    `Јазик: македонски (mk). Услужно подрачје: ${content.business.location}.`,
    'Надворешно кревање до балкон или прозорец, зависно од товарот и пристапот до објектот.',
    'Цената е индивидуална и се потврдува со LiftGoMK. Нема објавен фиксен ценовник.',
    'Катот, товарот, пристапот и терминот се потврдуваат при договарање.',
    '',
    '## Страници',
    ...Object.entries(seoPages).map(
      ([path, page]) => `- [${page.name}](${url(path)}): ${page.description}`,
    ),
    '',
    '## Услуги',
    ...content.services.map((service) => `- ${service.title}: ${service.text}`),
    '',
    '## Контакт',
    `- Телефон: ${content.business.phoneDisplay} (${content.business.phoneInternational})`,
    `- Е-пошта: ${content.business.email}`,
    `- Instagram: ${content.business.instagram}`,
    `- Понуда и контакт: ${url('cena/')}`,
    'Формата испраќа барање за индивидуална понуда директно до LiftGoMK. Се внесуваат локација, кат, товар, термин и контакт за одговор.',
    '',
    '## Прашања и одговори',
    ...faqs.flatMap(({ question, answer }) => [`### ${question}`, answer, '']),
    '## Вистински медиуми од терен',
    ...projects.map(
      (project) =>
        `- [${project.title}](${url(project.video ?? project.image ?? '')}): ${project.description}`,
    ),
    '',
    '## Мапа на страницата',
    `- [XML sitemap](${url('sitemap-index.xml')})`,
    '',
  ].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
