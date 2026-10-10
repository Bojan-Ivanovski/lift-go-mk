"""Check crawlable metadata, JSON-LD and discovery files in the static build."""
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, urljoin, unquote
import xml.etree.ElementTree as ET

root = Path('dist')
assert root.is_dir(), 'Run npm run build first.'
content = json.loads(Path('src/content/site.json').read_text())


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.meta, self.links, self.ids, self.scripts = {}, [], set(), []
        self.title, self.lang, self.h1 = '', '', 0
        self.all_text = []
        self.in_title = False
        self.in_schema = False
        self.schema_text = ''
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'html':
            self.lang = attrs.get('lang')
        if tag == 'meta':
            self.meta[attrs.get('name') or attrs.get('property') or attrs.get('http-equiv')] = attrs.get('content')
        if tag in ('link', 'a') and attrs.get('href'):
            self.links.append(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'h1':
            self.h1 += 1
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_schema = True
            self.schema_text = ''

    def handle_data(self, text):
        if self.in_title:
            self.title += text
        if self.in_schema:
            self.schema_text += text
        else:
            self.all_text.append(text)

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        if tag == 'script' and self.in_schema:
            self.scripts.append(json.loads(self.schema_text))
            self.in_schema = False

    @property
    def canonical(self):
        return next(link['href'] for link in self.links if link.get('rel') == 'canonical')


routes = ('', 'uslugi/', 'galerija/', 'cena/')
pages = {route: Page((root / route / 'index.html').read_text()) for route in routes}
home = pages[''].canonical
base = urlparse(home).path
for route, page in pages.items():
    assert page.lang == 'mk' and page.h1 == 1, route
    assert page.canonical == urljoin(home, route), route
    assert page.title and page.meta.get('description'), route
    assert 'noindex' not in page.meta['robots'], route
    assert page.meta['og:url'] == page.canonical, route
    assert page.meta['og:title'] == page.title == page.meta['twitter:title'], route
    assert page.meta['og:description'] == page.meta['description'] == page.meta['twitter:description'], route
    assert page.meta['og:image'] == page.meta['twitter:image'], route
    assert urlparse(page.meta['og:image']).scheme == 'https', route
    assert page.meta.get('og:image:alt') and page.meta.get('twitter:image:alt'), route
    assert len(page.scripts) == 1, route
    data = page.scripts[0]
    assert data['@context'] == 'https://schema.org', route
    graph = data['@graph']
    assert len({node['@id'] for node in graph}) == len(graph), route
    business = next(node for node in graph if node['@type'] == 'LocalBusiness')
    assert business['telephone'] == content['business']['phoneInternational'], route
    assert business['email'] == content['business']['email'], route
    assert business['areaServed']['name'] == content['business']['location'], route
    assert all(key not in business for key in ('aggregateRating', 'review', 'address', 'openingHours', 'geo', 'priceRange')), route
    assert len([node for node in graph if node['@type'] == 'Service']) == len(content['services']), route
    assert next(node for node in graph if node['@id'] == page.canonical+'#webpage')['description'] == page.meta['description'], route
    for link in page.links:
        target = urlparse(urljoin(page.canonical, link['href']))
        if target.netloc != urlparse(home).netloc or target.scheme not in ('http','https'):
            continue
        assert target.path.startswith(base), (route, link)
        path = unquote(target.path[len(base):])
        file = root / path
        if target.path.endswith('/'):
            file /= 'index.html'
        assert file.is_file(), (route, link)
        if target.fragment and file.suffix == '.html':
            destination = Page(file.read_text())
            assert unquote(target.fragment) in destination.ids, (route, link)
    print('SEO page:', route or 'home')

assert len({page.title for page in pages.values()}) == 4
assert len({page.meta['description'] for page in pages.values()}) == 4
alias = Page((root/'kontakt/index.html').read_text())
assert alias.canonical == pages['cena/'].canonical
redirect = Page((root/'contact/index.html').read_text())
assert redirect.canonical == pages['cena/'].canonical
assert 'cena/' in redirect.meta['refresh'] and 'noindex' in redirect.meta['robots']
namespace = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = [node.text for node in ET.parse(root/'sitemap-0.xml').findall('.//s:loc',namespace)]
assert set(urls) == {page.canonical for page in pages.values()}
assert ET.parse(root/'sitemap-index.xml').find('.//s:loc',namespace).text == urljoin(home,'sitemap-0.xml')
faq = next(node for node in pages['uslugi/'].scripts[0]['@graph'] if node['@type']=='FAQPage')
visible = re.sub(r'\s+', ' ', ' '.join(pages['uslugi/'].all_text))
for question in faq['mainEntity']:
    assert re.sub(r'\s+',' ',question['name']) in visible
    assert re.sub(r'\s+',' ',question['acceptedAnswer']['text']) in visible
llms = (root/'llms.txt').read_text()
for value in (content['business']['name'],content['business']['phoneDisplay'],content['business']['email'],*urls):
    assert value in llms, value
robots = (root/'robots.txt').read_text()
assert 'Allow: /' in robots and 'Disallow: /\n' not in robots
assert urljoin(home,'sitemap-index.xml') in robots
assert all(urlparse(url).path.rstrip('/') == base.rstrip('/') or 'admin/' not in url for url in urls)
print('PASS: unique metadata, canonical aliases, absolute social images, JSON-LD/visible FAQ agreement, internal links, sitemap, robots and llms.txt.')
