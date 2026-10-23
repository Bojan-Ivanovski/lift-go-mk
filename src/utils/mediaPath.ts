/** CMS uploads may include the deployment prefix; add that prefix only once. */
export function mediaPath(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const relative = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\/+/, '');
  return relative;
}

export const mediaUrl = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${mediaPath(path)}`;
