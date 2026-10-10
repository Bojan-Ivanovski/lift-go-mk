# SEO and AI search audit

## Implemented in this repository

| Finding | Change |
| --- | --- |
| Subpages reused the homepage description | Unique Macedonian titles/descriptions for Home, Services, Gallery and Quote/Contact in `src/data/seo.ts` |
| Quote and contact aliases duplicated the same content | `/kontakt/` canonicalizes to `/cena/`; `/contact/` redirects directly to `/cena/` with Astro's static refresh, canonical and noindex output |
| Social preview image URLs were relative | Absolute Open Graph/Twitter URLs, image dimensions and descriptive alternative text |
| Business markup was a standalone incomplete entity description | Linked LocalBusiness, WebSite, WebPage/CollectionPage/ContactPage, Service and breadcrumb JSON-LD, with stable IDs |
| Service answers were harder to extract | A visible Services FAQ and matching FAQ JSON-LD share `src/data/faqs.ts` |
| Sitemap included duplicate contact content | Only four canonical pages, with no invented modification dates |
| Important video links depended on JavaScript | No-JavaScript media links and a factual text index of the authentic media |
| No compact machine-readable business summary | Generated `/llms.txt` from the same business, service, FAQ and media data; linked from the document head |
| Business email was absent from the CMS schema | Added the existing email field so editing business details retains the published contact address |

The main brand, service area, phone, Instagram, media and Macedonian language
are preserved. Prices, ratings, certifications, capacity, availability, precise
address, opening hours and video upload dates have not been invented.

## AI search approach

The useful foundation is crawlable HTML, clear service descriptions, canonical
URLs, internal links and structured data consistent with visible content.
Google explicitly says no special AI files/schema are required for AI Overviews
or AI Mode. Indexing or citation cannot be guaranteed.

`llms.txt` is an optional reading aid based on a community proposal. It is not a
crawler access policy, a guaranteed ranking signal, or a substitute for the
actual HTML. It contains factual information and links, without instructions
attempting to influence an AI's recommendations.

The existing wildcard allow policy is preserved. OpenAI distinguishes
OAI-SearchBot (search discovery) from GPTBot (training); permitting search does
not require a separate decision to permit training. No new training policy was
introduced by this redesign.

## Hosting and owner follow-up

- Live check of `https://bojan-ivanovski.github.io/robots.txt` returned **404**.
  A missing robots file ordinarily does not block crawling. The generated
  `/lift-go-mk/robots.txt` cannot control the origin: robots policies belong at
  the domain root. Merge its sitemap/policy into the root site's robots file if
  you control it, or use a custom domain with a root deployment. Do not replace
  other projects' existing policies. Root hosting was not changed here.
- Submit `https://bojan-ivanovski.github.io/lift-go-mk/sitemap-index.xml` directly
  in Google Search Console and Bing Webmaster Tools after deployment. The
  project-folder robots file does not provide automatic root sitemap discovery.
- Verify the site in those accounts and inspect the canonical pages. Use actual
  crawl/indexing reports to measure discovery; AI citations are not predictable.
- Maintain a real Google Business Profile and consistent business details if
  available. No external accounts/profiles were created or edited.
- Provide a verified address and hours only if appropriate for this business.
  LocalBusiness markup without an address does not satisfy Google's local rich
  result requirements. Current markup identifies the service-area business.
- Provide the original video publication dates before enabling Google-targeted
  VideoObject rich-result markup. The current site exposes real video URLs and
  captions, without fabricating required upload dates.
- FAQ markup describes visible answers. Google retired FAQ rich results in 2026;
  the markup does not promise an enhanced search appearance.
- GitHub Pages serves static redirect HTML, not a configurable HTTP 301. The
  generated contact redirect has canonical/noindex and immediate navigation.
- This audit implements code changes; search engines see them after deployment.
  External rich-result validation and webmaster-account submission still need
  the published site and account access.

## Verification

Run after building:

```sh
npm run build
npm run test:seo
```

The static checks cover unique metadata, language and H1 count, canonical aliases,
absolute sharing URLs, JSON-LD parsing and entity IDs, matching visible FAQ
answers, existing internal link/fragment targets, canonical sitemap URLs, robots
and the generated `llms.txt`. They do not certify rich-result eligibility.

## Primary references

- [Google: search documentation updates, including FAQ retirement](https://developers.google.com/search/updates)
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: robots.txt location and scope](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)
- [Bing: webmaster guidelines for search and AI grounding](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a)
- [OpenAI: crawler roles and controls](https://developers.openai.com/api/docs/bots)
- [llms.txt proposal](https://llmstxt.org/)
