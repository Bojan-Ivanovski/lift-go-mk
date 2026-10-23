/** Public recipient email or activated FormSubmit token; not a private credential. */
const recipient = import.meta.env.PUBLIC_FORMSUBMIT_RECIPIENT || 'doriko6256@goldvester.com';
export const contact = {
  endpoint: `https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`,
};
