import content from '../data/site';
import { faqs } from './faqs';
import { mediaPath } from '../utils/mediaPath';

export const seoPages = {
  '': {
    title: content.seo.title,
    description: content.seo.description,
    name: 'LiftGoMK — надворешен лифт во Скопје',
    type: 'WebPage',
  },
  'uslugi/': {
    title: 'Лифт за мебел, бела техника и материјали во Скопје — LiftGoMK',
    description:
      'Надворешно кревање мебел, бела техника и материјали за реновирање во Скопје. Дознај како работи услугата и што е потребно за проценка на пристапот.',
    name: 'Услуги на LiftGoMK',
    type: 'WebPage',
  },
  'galerija/': {
    title: 'Фото и видео галерија — надворешно кревање во Скопје | LiftGoMK',
    description:
      'Вистински фотографии и видеа од LiftGoMK на терен: кревање градежни материјали и помош при преселби. Погледни ја работата во пракса.',
    name: 'Галерија од терен',
    type: 'CollectionPage',
  },
  'cena/': {
    title: 'Понуда и контакт за надворешен лифт во Скопје — LiftGoMK',
    description: `Побарај индивидуална понуда за кревање мебел, бела техника или материјали во Скопје. Внеси локација, кат и товар или јави се на ${content.business.phoneDisplay}.`,
    name: 'Понуда и контакт',
    type: 'ContactPage',
  },
};

export const canonicalRoute = (route: string) =>
  ['kontakt/', 'contact/'].includes(route) ? 'cena/' : route;

/** URLs follow Astro's deployment origin and base path, including GitHub Pages. */
export const siteBase = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const siteLink = (path = '') => `${siteBase}${path}`;
export const absoluteUrl = (site: URL | undefined, path = '') => {
  if (!site) throw new Error('Astro site must be configured for canonical SEO URLs.');
  return new URL(siteLink(path), site).href;
};

export function structuredData(
  site: URL | undefined,
  route: string,
  title: string,
  description: string,
) {
  const url = (path = '') => absoluteUrl(site, path);
  const businessId = `${url()}#business`;
  const websiteId = `${url()}#website`;
  const pageUrl = url(route);
  const pageId = `${pageUrl}#webpage`;
  const metadata = seoPages[route as keyof typeof seoPages] ?? seoPages[''];
  const services = content.services.map((service, index) => ({
    '@type': 'Service',
    '@id': `${url('uslugi/')}#service-${index + 1}`,
    name: service.title,
    description: service.text,
    serviceType: service.title,
    provider: { '@id': businessId },
    areaServed: { '@type': 'City', name: content.business.location },
    url: `${url('uslugi/')}#usluga-${index + 1}`,
  }));
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'LocalBusiness',
      '@id': businessId,
      name: content.business.name,
      alternateName: 'Lift Go MK',
      url: url(),
      image: url(mediaPath(content.hero.image)),
      logo: url('favicon.svg'),
      telephone: content.business.phoneInternational,
      email: content.business.email,
      areaServed: { '@type': 'City', name: content.business.location },
      sameAs: [content.business.instagram],
      description: content.seo.description,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Надворешно кревање во Скопје',
        itemListElement: services.map((service) => ({
          '@type': 'Offer',
          itemOffered: { '@id': service['@id'] },
        })),
      },
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: url(),
      name: content.business.name,
      inLanguage: 'mk',
      publisher: { '@id': businessId },
    },
    {
      '@type': metadata.type,
      '@id': pageId,
      url: pageUrl,
      name: title,
      description,
      inLanguage: 'mk',
      isPartOf: { '@id': websiteId },
      about: { '@id': businessId },
      ...(route === 'cena/' ? { mainEntity: { '@id': businessId } } : {}),
      ...(route === 'uslugi/' ? { hasPart: { '@id': `${pageUrl}#faq` } } : {}),
      ...(route ? { breadcrumb: { '@id': `${pageUrl}#breadcrumbs` } } : {}),
    },
    ...services,
  ];
  if (route)
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Почетна', item: url() },
        { '@type': 'ListItem', position: 2, name: metadata.name, item: pageUrl },
      ],
    });
  if (route === 'uslugi/')
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      url: `${pageUrl}#faq`,
      inLanguage: 'mk',
      mainEntity: faqs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    });
  return { '@context': 'https://schema.org', '@graph': graph };
}
