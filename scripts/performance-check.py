"""Guard optimized static delivery without network calls or extra dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

root = Path('dist')
assert root.is_dir(), 'Run npm run build first.'

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.images, self.sources, self.links = [], [], []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'img': self.images.append(values)
        if tag == 'source': self.sources.append(values)
        if tag == 'link': self.links.append(values)

def asset(url):
    path = unquote(urlparse(url).path).removeprefix('/lift-go-mk/').lstrip('/')
    file = root / path
    assert file.is_file(), f'Missing optimized asset: {url}'
    return file

for route in ('', 'uslugi', 'galerija', 'cena', 'kontakt'):
    html = (root / route / 'index.html').read_text()
    page = Page(html)
    assert 'fonts.googleapis.com' not in html and 'fonts.gstatic.com' not in html
    assert not any(link.get('rel') == 'stylesheet' for link in page.links), route
    fonts = [link for link in page.links if link.get('as') == 'font']
    assert len(fonts) == 2 and all(asset(link['href']).suffix == '.woff2' for link in fonts)
    for image in page.images:
        assert asset(image['src']).suffix in ('.jpg', '.jpeg'), image
        assert image.get('srcset') and image.get('sizes'), image
        for entry in image['srcset'].split(','):
            assert asset(entry.strip().split()[0]).suffix in ('.jpg', '.jpeg')
        assert int(image['width']) > 0 and int(image['height']) > 0
    for source in page.sources:
        assert source.get('type') != 'image/avif', 'Avoid early iOS AVIF/picture decoding bugs.'
        if source.get('type') == 'image/webp':
            for entry in source['srcset'].split(','):
                assert asset(entry.strip().split()[0]).suffix == '.webp'
    if route == '':
        assert page.images[0]['fetchpriority'] == 'high' and page.images[0]['loading'] == 'eager'
        assert any(source.get('type') == 'image/webp' for source in page.sources)
        assert all(image['loading'] == 'lazy' for image in page.images[1:])
    if route == 'galerija':
        assert all(image['loading'] == 'lazy' for image in page.images)
    print('Optimized delivery:', route or 'home')
    assert '@layer' not in html, 'Safari before 15.4 cannot read cascade layers.'
print('PASS: local fonts, flattened inline styles, eager WebP/JPEG hero, lazy responsive previews and valid asset URLs.')
