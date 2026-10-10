"""Firefox responsive checks using its built-in WebDriver (Marionette) protocol.

Start the site and headless Firefox as described in docs/responsive-design.md.
No Python packages or browser automation dependencies are required.
"""
import argparse
import json
from browser_driver import BrowserDriver

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:4323/lift-go-mk/')
parser.add_argument('--port', type=int, default=2829)
parser.add_argument('--output', default='/tmp/liftgo-responsive')
args = parser.parse_args()
driver = BrowserDriver(args.url, args.port, args.output)
command, js = driver.command, driver.js
viewport, navigate, screenshot = driver.viewport, driver.navigate, driver.screenshot
output = driver.output

measurement = """return {
    viewport: innerWidth, height: innerHeight,
    overflow: document.documentElement.scrollWidth > innerWidth,
    smallText: [...document.querySelectorAll('main p:not(.eyebrow):not(.step-kicker), footer a, footer p, nav a')]
      .filter(e => e.getBoundingClientRect().width && parseFloat(getComputedStyle(e).fontSize) < 14)
      .map(e => e.className),
    clippedText: [...document.querySelectorAll('h1,h2,h3,p,.button,.underlined-link')]
      .filter(e => { const box = e.getBoundingClientRect(); if (!box.width) return false;
        const range = document.createRange(); range.selectNodeContents(e);
        return [...range.getClientRects()].some(r => r.width && (r.right > box.right + 3 || r.left < box.left - 3));
      }).map(e => ({tag:e.tagName, class:e.className, text:e.textContent.trim().slice(0,60)})),
    cards: [...document.querySelectorAll('.media-trigger')].filter(e => e.getBoundingClientRect().width)
      .map(e => {const r=e.getBoundingClientRect(); return {width:r.width,height:r.height};}),
    headings: [...document.querySelectorAll('h1,h2')].map(e => ({text:e.textContent.trim(),size:getComputedStyle(e).fontSize})),
};"""
results = []
failures = []


def check(route, width, mode='default'):
    result = js(measurement)
    result.update(route=route or 'home', requestedWidth=width, mode=mode)
    results.append(result)
    if result['overflow'] or result['smallText'] or result['clippedText']:
        failures.append(result)
        print('FAIL:', route, width, mode, result['clippedText'], flush=True)
    if width >= 3000 and mode == 'default':
        if not route:
            assert js("return document.querySelector('.hero-image').getBoundingClientRect().width > 600 && document.querySelector('.hero-copy').getBoundingClientRect().width > 600;"), result
        if route in ('cena/', 'kontakt/', 'contact/'):
            assert js("return document.querySelector('.quote-form').getBoundingClientRect().width > 800 && document.querySelector('.quote-aside').getBoundingClientRect().width > 400;"), result
    cards = result['cards']
    if cards:
        assert len({(round(c['width'], 2), round(c['height'], 2)) for c in cards}) == 1, result
        assert all(abs(c['width']/c['height'] - 16/9) < .001 for c in cards), result
    return result


command('WebDriver:NewSession', {'capabilities': {'alwaysMatch': {'acceptInsecureCerts': True}}})
try:
    # Capture script errors during navigation, including initial module execution.
    command('Marionette:SetContext', {'value': 'chrome'})
    js("""window.liftgoErrors = [];
      window.liftgoErrorListener = {observe(message) {
        try { const error = message.QueryInterface(Ci.nsIScriptError);
          if (error.sourceName?.includes('127.0.0.1') && error.category?.includes('JavaScript') && !(error.flags & 1))
            window.liftgoErrors.push(error.errorMessage);
        } catch {}
      }};
      Services.console.registerListener(window.liftgoErrorListener);""")
    command('Marionette:SetContext', {'value': 'content'})
    widths = (320,360,375,390,430,568,640,768,820,932,960,1024,1280,1440,1920,2560,3000,3200,3440,3840)
    for route in ('','uslugi/','galerija/','cena/','kontakt/','contact/'):
        navigate(route)
        for width in widths:
            viewport(width)
            result = check(route, width)
            assert result['viewport'] == width, result
            if width in (390,768,1440,3840) and route in ('','uslugi/','galerija/','cena/'):
                screenshot(f'{route.strip("/") or "home"}-{width}')
        for width, height in ((568,320),(844,390),(932,430)):
            viewport(width,height)
            check(route,width,'landscape')
        for mode, text_zoom, full_zoom in (('text-200%',2,1),('zoom-200%',1,2),('zoom-400%',1,4)):
            viewport(1280,900,text_zoom,full_zoom)
            check(route,1280,mode)
        print('Layout checks:', route or 'home', flush=True)
        viewport(390)
        js("document.querySelector('.menu-toggle').click();")
        assert js("return document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true' && document.activeElement.closest('nav') !== null;")
        # Send a real Escape key through WebDriver.
        command('WebDriver:PerformActions', {'actions':[{'type':'key','id':'keyboard','actions':[{'type':'keyDown','value':'\ue00c'},{'type':'keyUp','value':'\ue00c'}]}]})
        assert js("return document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false' && document.activeElement.classList.contains('menu-toggle');")
    navigate('uslugi/')
    viewport(320)
    js("document.querySelector('.service-more summary').click();")
    assert js("return document.querySelector('.service-more').open;")
    check('uslugi/',320,'expanded-service')
    navigate('galerija/')
    viewport(390)
    js("document.querySelector('[data-filter=Фотографии]').click();")
    assert js("return [...document.querySelectorAll('.project-card')].filter(e=>!e.hidden).length===1;")
    js("document.querySelector('[data-filter=Сите]').click(); document.querySelector('.media-trigger').click();")
    assert js("const d=document.querySelector('dialog');return d.open && d.querySelector('video').muted && !d.querySelector('.project-frame-svg') && getComputedStyle(d.querySelector('video')).clipPath==='none';")
    js("document.querySelector('.media-close').click();")
    assert js("return !document.querySelector('dialog').open && document.activeElement.classList.contains('media-trigger');")
    js("document.querySelector('[data-kind=image]').click();")
    assert js("return !!document.querySelector('dialog[open] img');")
    js("document.querySelector('.media-close').click();")
    navigate('cena/')
    viewport(390)
    assert js("return document.querySelectorAll('.floor-choice').length===10 && !document.querySelector('[data-floor=\"0\"]') && document.querySelector('[data-floor=\"10\"]')!==null && document.querySelector('.floor-display').tagName==='DIV';")
    js("document.querySelector('.floor-display').click();")
    assert js("return document.querySelector('[name=floor]').value==='';")
    js("document.querySelector('[name=city]').value='Скопје'; document.querySelector('[name=name]').value='Тест'; document.querySelector('[name=customerPhone]').value='071234567'; document.querySelector('[name=customerEmail]').value='test@example.com'; document.querySelector('[name=details]').value='Гардеробер'; document.querySelector('#quote-form').requestSubmit();")
    assert js("return !document.querySelector('#floor-error').hidden && document.activeElement.classList.contains('floor-choice');")
    js("document.querySelector('[data-floor=\"3\"]').click(); document.querySelector('input[name=items]').click();")
    assert js("return document.querySelector('#floor-error').hidden && document.querySelector('[name=floor]').value==='3' && document.querySelector('#quote-live-summary').textContent.includes('3. кат') && document.querySelector('#quote-live-summary').textContent.includes('Мебел');")
    js("document.querySelector('[data-floor=\"10\"]').click();")
    assert js("return document.querySelector('[name=floor]').value==='10' && document.querySelector('#quote-live-summary').textContent.includes('10. кат');")
    assert js("return [...document.querySelectorAll('.floor-choice')].every(e=>e.getBoundingClientRect().height>=44);")
    js("document.querySelector('[name=city]').focus();")
    assert js("return getComputedStyle(document.querySelector('.mobile-bar')).display==='none';")
    assert js("return getComputedStyle(document.querySelector('#quote-summary-title')).textAlign==='left';")
    command('Marionette:SetContext', {'value':'chrome'})
    errors = js('return window.liftgoErrors;')
    js('Services.console.unregisterListener(window.liftgoErrorListener);')
    command('Marionette:SetContext', {'value':'content'})
    report = {'layouts':results,'failures':failures,'scriptErrors':errors,'interactions':'passed'}
    (output/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    assert not failures, f'{len(failures)} responsive checks failed; see {output}/report.json'
    assert not errors, errors
    print(f'PASS: {len(results)} layout checks; menu, service disclosure, filters, video/photo modals, floor validation and live summary. No local script errors.',flush=True)
finally:
    command('WebDriver:DeleteSession')
    driver.close()
