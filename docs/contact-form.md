# Contact delivery

The combined quote/contact form submits a Macedonian request summary to FormSubmit
from the browser. It works on static GitHub Pages; no backend or new dependency
is required. Full name, email, phone and message/description are required, along
with the existing quote location and floor (1–10). The email becomes the reply-to
address. Service categories remain optional. Telephone validation accepts common
international/local formatting and requires 7–15 digits. Inline errors are linked
to their fields; the first invalid field receives focus.

`src/config/contact.ts` sends to `https://formsubmit.co/ajax/doriko6256%40goldvester.com`.
Set `PUBLIC_FORMSUBMIT_RECIPIENT` at build time to override the recipient with an
email or activated FormSubmit token. The public business email in `site.json`
continues to control contact links/metadata independently. FormSubmit requires
one-time confirmation through the recipient inbox before submissions are delivered.
Payloads use `_subject`, `_template` and the `_honey` honeypot field; the visitor's
`email` sets the reply-to address. No access key is needed.

The form includes a honeypot, blocks concurrent and identical successful
submissions and times out after 20 seconds. Inputs are locked while sending.
The form and floor visualization reset only after confirmed success; failures
preserve all entered values. Loading uses an accessible message and decorative
spinner; reduced-motion disables its rotation. Success/error messages use the
site's typography and clear, contrasting status panels.
Success is shown only after a successful HTTP response with `success: true` or `success: "true"`; explicit false values and unexpected shapes are rejected.
Network errors/timeouts are described as unconfirmed delivery, since the server
may have received the message even if the browser lost the response. No automatic
retries are made. Without JavaScript, phone/Instagram links remain available.

## Checks

Build and start the local preview, then use the Firefox setup documented in
`docs/responsive-design.md`:

```sh
npm run test:contact -- --url http://127.0.0.1:4327/lift-go-mk/
```

This test intercepts **all fetch requests** in the page and mocks API responses.
It checks required fields, email/phone validation, payload/reply-to, pending state, duplicate
protection, honeypot, API rejection, network errors, invalid responses and timeout
recovery, successful resets, keyboard submission, accessible error associations,
reduced motion and mobile/desktop layouts. It never sends a live email. Inbox delivery
requires a real submission after deployment.

[FormSubmit AJAX reference](https://formsubmit.co/ajax-documentation)
