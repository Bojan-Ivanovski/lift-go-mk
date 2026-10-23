# LiftGoMK client editor

## Chosen approach

Use the hosted **Pages CMS** editor with email-only collaborators. The client does not need a GitHub account, a personal access token or repository permissions. The owner connects a GitHub App once; invited editors authenticate through their email inbox. Content stays in this repository and the existing GitHub Actions workflow publishes it to GitHub Pages.

Official documentation: [email collaborators](https://pagescms.org/docs/configuration/collaborators/), [authentication](https://pagescms.org/docs/development/authentication/), [owner setup](https://pagescms.org/docs/quick-start/).

The previous Sveltia token login has been removed from `/admin/`. That address now provides a Macedonian starting page, one editor button and short instructions. The hosted editor's interface is controlled by Pages CMS; its built-in labels may be in English. Our section labels, field labels and help are in Macedonian.

## Status: account activation and real publishing still required

The repository configuration and website integration are prepared locally. **Do not hand the CMS to the client until the checklist below is complete.** A static configuration cannot install the GitHub App, register an invitation or prove email delivery.

### Owner activation

1. Commit and deploy this CMS configuration after review. `.pages.yml` must be available on `main` for the hosted editor to read it.
2. Open [Pages CMS](https://app.pagescms.org/) and sign in with the GitHub account that owns this repository.
3. Install its GitHub App with access to **only `Bojan-Ivanovski/lift-go-mk`**.
4. Open that repository on the `main` branch. Confirm the four configured sections appear.
5. In collaborator management, invite the approved editor email. The temporary editor email supplied in this session belongs to the owner; replace it with the client's email when ready. Invitations live in Pages CMS, not in `.pages.yml`.
6. Open the invitation in a separate browser profile that is not signed in to GitHub. Confirm email-only access works and settings/collaborator management are unavailable.

### Handoff acceptance checklist

- [ ] Owner has connected the GitHub App to this repository only.
- [ ] Temporary editor receives the invitation and can sign in through email.
- [ ] An uninvited email cannot edit the repository.
- [ ] Each small form saves without changing fields belonging to other forms. `settings.content.merge: true` is essential.
- [ ] Change a description, save, and confirm the GitHub Actions deployment succeeds and the live page updates. Restore the text afterwards.
- [ ] Upload a small JPEG and an MP4 with a cover photo; confirm thumbnails and viewer playback on the live site.
- [ ] Hide and show a project; confirm gallery counts/filters and the homepage update.
- [ ] Verify hero replacement and telephone updates, including the actual `tel:` link.
- [ ] Repeat email sign-in and one content edit on a phone.
- [ ] Show the client how to save, wait for deployment, view the site and request help.
- [ ] Replace the temporary editor invitation with the client's invitation when handing over access.

Do not describe hosted authentication, invitations or real publishing as verified until these actions actually succeed. No invitation was sent during the local implementation.

## Four editing tasks

| Section                        | Editable content                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| 01 · Фотографии и видеа        | Add photos/videos, enter titles and categories, upload video covers, show/hide projects       |
| 02 · Главна фотографија и опис | Replace the homepage image, describe the image for accessibility, edit the short introduction |
| 03 · Опис на услугите          | Edit descriptions for the existing three services and three steps                             |
| 04 · Телефон и Instagram       | Enter one phone number and the Instagram profile link                                         |

Fixed headings, branding, pricing rules, SEO configuration, workflow files and email-provider credentials are outside the client schema. Service/step titles are read-only and both lists are restricted to three items, so service details cannot lose their corresponding content. The telephone link is derived from the displayed phone number in `src/data/site.ts`.

The contact recipient is configured separately for FormSubmit through `PUBLIC_FORMSUBMIT_RECIPIENT`. Changing a public email address alone does not change that recipient; this setting is intentionally not exposed.

## Media and publishing protections

- `.pages.yml` uses separate image/video pickers and randomized upload names to reduce accidental overwrites. Image fields allow JPEG, PNG and WebP; videos allow MP4.
- Every video requires a cover image, so thumbnails do not depend on mobile video loading or autoplay.
- Projects have a visibility toggle: hiding is reversible and usually preferable to deleting.
- Files and photos/videos are still backed by Git history. An owner can restore a previous content version; the client does not need to manage Git.
- `src/utils/mediaPath.ts` normalizes prefixed upload URLs before rendering. This avoids duplicated `/lift-go-mk/` paths in cards, viewer sources and social image metadata.
- `npm run build` validates content before building: required descriptions, the three-item lists, phone/Instagram formats, categories, local media existence, extension and maximum file size. Missing or oversized media cannot replace a working deployment.
- Suggested upload sizes: images under 2 MB, videos under 20 MB. Build ceilings are 5 MB for images and 25 MB for videos. These ceilings are enforced during the build, **not by the hosted upload UI**. A failed build requires owner intervention; GitHub Pages keeps the previous successful deployment.
- Saving content starts deployment; it does not mean the live site has updated immediately. The admin instructions explain the delay without promising a fixed duration.

Pages CMS collaborators cannot manage configuration or invitations according to its documented permissions. The UI restrictions here are usability protections, not a custom authorization system; provider access controls govern repository writes.

## Maintenance

```sh
npm run validate:content
npm run lint
npm run format:check
npm run build
```

The website has no additional runtime dependencies for this CMS. Pages CMS hosts the authentication/editor service, so its availability and email delivery remain external dependencies. The website itself remains static on GitHub Pages.

Do not remove `settings.content.merge: true`: all four editors intentionally update separate portions of `src/content/site.json`. [Pages CMS documents preservation of unmanaged fields](https://pagescms.org/docs/configuration/settings/).
