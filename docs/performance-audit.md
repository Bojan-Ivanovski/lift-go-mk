# PageSpeed follow-up

## Changes

- `ResponsiveMedia.astro` generates responsive, hashed WebP images at build time.
  The hero also offers AVIF, with WebP fallback, eager loading and high priority.
  Candidate widths include 320, 480, 640, 800, 1024 and 1254 pixels.
- Gallery previews are cropped to 16:9 during generation and lazy-loaded. Full
  photo/video URLs and modal aspect ratios remain unchanged.
  Portrait preview sources preserve the previous `center 20%` focal point;
  responsive widths never exceed the source resolution.
- Manrope's Cyrillic and Latin variable fonts are hosted locally and preloaded.
  DM Mono is hosted locally and loaded when used. All fonts use `font-display:
  swap`; their licenses are included in `src/assets/fonts`.
- Small project styles are inlined into HTML, removing CSS request chains on
  initial visits. This trades shared stylesheet caching for faster first paint.
- Darkened the process numbers/body text and showcase description; restored
  brighter orange for the footer logo against its dark background.
- Added a static delivery regression check: `npm run test:performance`.

Optimized source copies live in `src/assets/images`. When replacing one of the
three mapped images, update its source there; for additional assets, extend the
map in `ResponsiveMedia.astro`. Unmapped CMS paths render their original image.
Original public JPEGs remain available for sharing previews and full viewing.

## Measured results

Lighthouse **13.5.0**, default mobile preset with simulated throttling, using the
installed Chromium-based Brave browser against the local Astro production
preview. One baseline and one final run on the same machine:

| Metric | Before | After |
| --- | ---: | ---: |
| Performance | 88 | 99 |
| Accessibility | 95 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 2.9 s | 1.1 s |
| LCP | 3.2 s | 2.0 s |
| TBT | 0 ms | 0 ms |
| CLS | 0 | 0 |
| Hero transfer | 177 KiB | 85 KiB |
| First gallery preview transfer | 85 KiB | 16 KiB |

The reported contrast failures all passed the final audit. Render-blocking
requests were eliminated in that run. Lighthouse still estimated around 28 KiB
of possible further image savings. These are lab measurements, not field data
or a promised score on deployed GitHub Pages. Re-run PageSpeed after deployment.

Raw local reports: `/tmp/liftgo-lighthouse-before.json` and
`/tmp/liftgo-lighthouse-final.json`.

## Checks

Passed lint, formatting, Astro type checks, static build, SEO checks and static
delivery checks. The final browser suite passed 157 responsive/zoom layout
checks, media playback/navigation/fullscreen tests, and mocked Web3Forms
validation, success, failure/retry and duplicate-submission checks. No live
request email was sent. Screenshots are in `/tmp/liftgo-performance-final`.

```sh
npm run build
npm run test:performance
CHROME_PATH=/opt/brave-bin/brave npm exec --yes --package=lighthouse -- \
  lighthouse http://127.0.0.1:4327/lift-go-mk/ \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/liftgo-lighthouse-final.json
```

Use your installed Chrome/Chromium path and local preview port. Lighthouse is
temporary audit tooling; no application dependencies were added.

## Hosting limitation

GitHub Pages controls its response cache headers. Astro-generated image/font
URLs are fingerprinted, but fingerprinting does not change the host's TTL. The
10-minute cache warning cannot be fixed by adding `_headers` or `.htaccess` to
this static GitHub Pages project. No service worker was added to override cache
behavior. These changes have not been deployed in this task.

## References

- [Astro 5: image optimization](https://v5.docs.astro.build/en/guides/images/)
- [Astro 5: stylesheet configuration](https://v5.docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets)
- [Google: font loading and performance](https://web.dev/articles/font-best-practices)
