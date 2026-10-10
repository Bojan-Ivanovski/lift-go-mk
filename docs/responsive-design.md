# Responsive design

## Layout and readability

The site uses Astro and Tailwind CSS 4. Responsive grid utilities live on the
page/components. The shared typography, gutters and media geometry are in
`src/styles/global.css`.

- Body text: 16–18px; controls and secondary copy: 15px; metadata: 13px.
- Headlines use a shared fluid scale with rem minimums, capped sizes and
  comfortable line heights. Long words can wrap when browser text is enlarged.
- Content is centered within a 1600px reading/layout area. Full-width sections
  retain their backgrounds. Paragraphs and service descriptions have narrower
  reading widths.
- The hero and quote section use full-width wrappers. Combining a capped outer
  width with viewport-derived padding previously collapsed their columns on 4K
  screens. Do not reintroduce both constraints on the same wrapper.
- Home headings remain left aligned, except the orange section 03. Main subpage
  headings remain centered; form and service headings remain left aligned.
- Navigation becomes an expandable menu below 960px. The menu supports Escape,
  focus return, outside clicks and viewport changes.
- Gallery cards retain the shared geometric frame and uniform 16:9 dimensions.
  The full gallery has one/two/three columns; home previews have one/two.
- The quote summary follows the form on small screens. On larger screens it
  sticks beside the form when the viewport is tall enough. The mobile contact
  bar hides during form focus to give keyboards and controls room.
- Floor controls have a minimum 44px height. Missing-floor errors are announced
  and move focus to the selector.
- Content is visible without scroll observers, including on slow devices or
  when JavaScript is unavailable. Decorative media motion honors reduced motion.

## Repeatable browser checks

The current environment has Firefox, but no Playwright browser installation.
The test uses Firefox's built-in Marionette WebDriver protocol with Python's
standard library; no dependencies were added.

Start the development server:

```sh
npm run dev -- --host 127.0.0.1 --port 4323
```

Create a temporary Firefox profile and start a separate headless browser:

```sh
mkdir -p /tmp/liftgo-responsive-firefox
printf 'user_pref("marionette.port", 2829);\n' > /tmp/liftgo-responsive-firefox/user.js
firefox --headless -no-remote --profile /tmp/liftgo-responsive-firefox --marionette --remote-allow-system-access
```

In another terminal:

```sh
npm run test:responsive -- --url http://127.0.0.1:4323/lift-go-mk/
```

For production output, run `npm run build`, then
`npm run preview -- --host 127.0.0.1 --port 4325` and pass the preview URL instead.

The test uses privileged browser context only to set exact content viewport
sizes below Firefox's native minimum window width and apply real browser zoom.
It checks six routes at 320, 360, 375, 390, 430, 568, 640, 768, 820, 932, 960,
1024, 1280, 1440, 1920, 2560, 3000, 3200, 3440 and 3840px. It also checks three
landscape sizes, 200% text zoom, and 200%/400% page zoom. Assertions cover
horizontal overflow, clipped text, small body copy, uniform media dimensions,
wide-screen column collapse, navigation focus, service disclosures, gallery
filters/modals, floor validation, live summary and local JavaScript errors.

Screenshots and `report.json` are written to `/tmp/liftgo-responsive` by default.
Use `--output` to change the destination. No request email is sent by the test.

These checks do not replace testing on physical phones or a full WCAG audit.
Lighthouse and Safari/Chromium checks are not part of this Firefox test.

## Cinematic media viewer

`MediaModal.astro` provides the accessible dialog and custom control markup;
`src/scripts/mediaViewer.ts` owns each instance's video reference and synchronizes
controls through native media events. `src/styles/media-viewer.css` is isolated
from the thumbnail geometry. Native dialog focus containment is retained.

- Playback starts muted; photos and portrait/landscape video retain their ratios.
- Custom controls support seeking, volume, mute, fullscreen, buffering and retry.
- Space toggles playback, M toggles mute, F toggles fullscreen, arrows navigate,
  and Escape closes. Inputs retain native keys and buttons retain Space activation.
- Navigation uses the currently filtered set; switching releases the previous
  video. Swipes on the media stage never handle events from the seek controls.
- Closing restores the previous scroll position, overflow style and thumbnail
  focus. Motion is disabled when reduced motion is requested.
- The floor selector now offers 1–10 only. The ground-floor row is display-only;
  validation also rejects zero and out-of-range values. Its lift marker follows
  the actual selected row geometry, including after resizing.
- Scrollbars use the warm stone/orange palette; the viewer uses a dark track.

With the same Firefox/server setup, run:

```sh
npm run test:viewer -- --url http://127.0.0.1:4323/lift-go-mk/
```

The additional suite checks actual video metadata, player state, seek/volume,
control fading/focus, fullscreen, Escape, index/filter navigation, release of
previous media, error/retry feedback, and scroll/focus restoration. It captures
viewport screenshots at 320, 390, 768, 1440, 3840px and phone landscape. Swipe and
buffer/error cases include synthetic events; physical touch devices and iOS
fullscreen/volume restrictions still need a device check. No dependencies were
added; both suites share the small Marionette client in `scripts/browser_driver.py`.
