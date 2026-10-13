/** WebKit regressions. Device profiles simulate screens, not historical iOS engines. */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';
const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://127.0.0.1:4327/lift-go-mk/' },
    module: { type: 'string', default: 'playwright' },
    executable: { type: 'string' },
    output: { type: 'string', default: '/tmp/liftgo-iphone-check' },
  },
});
const { webkit, devices } = await import(values.module);
await mkdir(values.output, { recursive: true });
const browser = await webkit.launch({
  headless: true,
  ...(values.executable ? { executablePath: values.executable } : {}),
});
const base = values.url.replace(/\/?$/, '/');
const errors = [];
async function imageLoaded(page, selector = '.hero-image img') {
  await page.waitForFunction((s) => {
    const image = document.querySelector(s);
    return image?.complete && image.naturalWidth > 0 && image.getBoundingClientRect().height > 0;
  }, selector);
}
async function layout(page) {
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    'Horizontal overflow',
  );
  assert(await page.locator('h1').isVisible(), 'Missing heading');
}
async function newPage(options = {}) {
  const context = await browser.newContext({ ...devices['iPhone 13 Pro'], ...options });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  return { context, page };
}
try {
  for (const [width, height] of [
    [320, 568],
    [375, 667],
    [390, 844],
    [414, 896],
    [844, 390],
    [768, 1024],
    [1440, 900],
    [3840, 1200],
  ]) {
    const { context, page } = await newPage({
      viewport: { width, height },
      isMobile: width < 1024,
    });
    for (const route of ['', 'uslugi/', 'galerija/', 'cena/', 'kontakt/']) {
      await page.goto(base + route);
      await layout(page);
      if (!route) {
        await imageLoaded(page);
        assert(
          (await page.locator('.hero-image img').evaluate((i) => i.currentSrc)).endsWith('.webp'),
        );
        await page
          .locator('.hero-image')
          .screenshot({ path: `${values.output}/hero-${width}.png` });
      }
      if (route === 'galerija/') {
        await page.locator('.media-trigger[data-kind=image]').click();
        await imageLoaded(page, 'dialog img');
        await page.locator('.media-close').click();
      }
      if (route === 'cena/') {
        await page.locator('[data-floor="10"]').click();
        assert.equal(await page.locator('[name=floor]').inputValue(), '10');
        await page.locator('[name=city]').focus();
        assert(
          await page.locator('body').evaluate((b) => b.classList.contains('form-field-focused')),
        );
      }
    }
    await context.close();
    console.log('WebKit layouts and media:', width, height);
  }
  // WebP selection/decoding failure must recover using the JPEG img sources.
  for (const [name, matcher] of [
    ['webp-failure', /\.webp(?:\?|$)/],
    ['optimized-images-failure', /\/_astro\/.*\.(?:webp|jpeg)(?:\?|$)/],
  ]) {
    const { context, page } = await newPage();
    await page.route(matcher, (route) => route.abort());
    await page.goto(base);
    await imageLoaded(page);
    const source = await page.locator('.hero-image img').evaluate((i) => i.currentSrc);
    assert(/\.jpe?g$/.test(source), source);
    if (name === 'optimized-images-failure') assert(source.endsWith('/hero-apartment.jpg'), source);
    await page.locator('.hero-image').screenshot({ path: `${values.output}/${name}.png` });
    await context.close();
    console.log('Recovered:', name);
  }
  // JPEG must work without JS and when the browser declines the WebP source type.
  for (const supported of [true, false]) {
    const { context, page } = await newPage({ javaScriptEnabled: false });
    if (!supported)
      await page.route(base, async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: (await response.text()).replaceAll('type="image/webp"', 'type="image/unsupported"'),
        });
      });
    await page.goto(base);
    await imageLoaded(page);
    await layout(page);
    if (!supported)
      assert(
        (await page.locator('.hero-image img').evaluate((i) => i.currentSrc)).endsWith('.jpeg'),
      );
    await context.close();
    console.log('No-JS image:', supported ? 'WebP' : 'JPEG');
  }
  // An absent optional API must not prevent media/frame/form initialization.
  {
    const { context, page } = await newPage();
    await page.addInitScript(() =>
      Object.defineProperty(window, 'ResizeObserver', { value: undefined }),
    );
    await page.goto(base);
    await imageLoaded(page);
    assert((await page.locator('.project-frame-base').first().getAttribute('d')).startsWith('M'));
    await page.goto(base + 'cena/');
    await page.locator('[data-floor="3"]').click();
    assert.equal(await page.locator('[name=floor]').inputValue(), '3');
    await context.close();
    console.log('No ResizeObserver: frame and form remain functional');
  }
  {
    const { context, page } = await newPage();
    await page.addInitScript(() =>
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: undefined }),
    );
    await page.goto(base + 'galerija/');
    assert(!(await page.locator('.media-dialog').isVisible()));
    await page.locator('.media-trigger[data-kind=image]').click();
    await page.waitForURL('**/hero-apartment.jpg');
    await context.close();
    console.log('No dialog API: original media remains accessible');
  }
  assert.deepEqual(errors, [], 'Client JavaScript errors');
  console.log(
    'PASS: WebKit layouts, normal media, JPEG recovery, no-JS/format fallback, optional API fallbacks. No physical iPhone/Instagram session was tested.',
  );
} finally {
  await browser.close();
}
