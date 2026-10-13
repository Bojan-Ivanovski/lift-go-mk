# iPhone and embedded browser compatibility

## Report and diagnosis

The hero image was reported missing on an iPhone 13 Pro, probably in Instagram's embedded browser. The iOS version is unknown, so the exact cause has not been confirmed on the affected device.

The previous implementation selected AVIF inside a `picture` element. AVIF arrived in iOS 16, but [WebKit documents a fix for AVIF inside `picture` in Safari 16.4](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/). This is a plausible compatibility issue. Browser feature detection can select a format without guaranteeing that a particular image will decode correctly.

The styles also depended on cascade layers, dynamic viewport units and newer layout features. [Safari 15.4 introduced cascade layers and native dialogs](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/), while [Tailwind 4 officially targets Safari 16.4 and newer](https://tailwindcss.com/docs/compatibility).

## Changes

- `ResponsiveMedia.astro` now uses WebP sources with responsive JPEG `img` fallbacks. AVIF is no longer delivered. A normal block wrapper replaces `display: contents` on the picture.
- If WebP fails, the image retries using JPEG. If an optimized image also fails, it retries the preserved public JPEG. Recovery is bounded to avoid request loops. Without JavaScript, unsupported formats still fall back through native picture selection.
- The hero stays eager with high fetch priority. Gallery thumbnails stay lazy. Original media and modal sources are preserved.
- Build-time PostCSS flattens cascade layers. All style imports are processed as one stylesheet so layer precedence stays consistent; this follows the [plugin's requirements](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-cascade-layers).
- Vite targets Safari 14 for generated JavaScript and CSS. Explicit viewport-height, aspect-ratio, clip-path and focus-state fallbacks support older rendering behavior.
- Frame initialization and the floor selector work without ResizeObserver. A browser without native dialogs opens the original media file instead of showing an unusable viewer.
- `postcss` and `@csstools/postcss-cascade-layers` are development dependencies only. No browser library was added.

These are targeted compatibility improvements, not a claim that every Tailwind 4 utility is supported on Safari 14. A completely unavailable network or blocked original image cannot be repaired by frontend fallbacks.

## Verification — October 13, 2026

Passed:

- Lint, formatting, Astro type checking and production build.
- SEO and image/performance asset checks.
- 157 existing responsive layout checks, plus menu, disclosure, gallery, floor and summary interactions.
- Existing cinematic viewer checks, including playback, seeking, volume, fullscreen, keyboard navigation, cleanup and focus restoration.
- Existing mocked contact submission checks. No real email was sent.
- Modern WebKit with an iPhone 13 Pro device profile at 320×568, 375×667, 390×844, 414×896, 844×390, 768×1024, 1440×900 and 3840×1200. Home, services, gallery, quote and contact routes were checked, with hero screenshots captured.
- Forced WebP failure, failure of all optimized image variants, JavaScript disabled, native JPEG selection, missing ResizeObserver and missing native dialog support.

Device profiles simulate viewport and device characteristics. They do not reproduce a historical iOS engine or Instagram's app integration. Physical iPhone and Instagram testing remains necessary after deployment. These changes have not been pushed or deployed as part of this compatibility review.

## Repeat the WebKit checks

With Playwright and its WebKit browser installed in a supported development environment:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4327
npm run test:iphone
```

Playwright is optional test tooling rather than a project dependency. For an external installation, pass its module path:

```sh
npm run test:iphone -- --module /path/to/node_modules/playwright/index.mjs
```

The script also supports `--url`, `--output` and `--executable`. This audit used temporary Playwright and WebKit libraries outside the repository because the host Linux distribution is not officially supported by Playwright's downloaded WebKit build.
