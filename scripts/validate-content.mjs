/** Refuse to deploy broken CMS edits; GitHub Pages retains the previous build. */
import { readFileSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';

const site = JSON.parse(readFileSync('src/content/site.json', 'utf8'));
const errors = [];
function text(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    errors.push(`${name}: внеси текст (до ${max} знаци).`);
  }
}
function asset(value, name, extensions, maxMB) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${name}: избери датотека.`);
    return;
  }
  const relative = value.replace(/^\/lift-go-mk\//, '').replace(/^\/+/, '');
  const root = resolve('public');
  let path;
  try {
    path = resolve(root, decodeURIComponent(relative));
    if (!path.startsWith(root + sep) || !extensions.includes(extname(path).toLowerCase())) {
      throw new Error('Invalid media path');
    }
    const file = statSync(path);
    if (!file.isFile() || file.size > maxMB * 1024 * 1024) throw new Error('Invalid media file');
  } catch {
    errors.push(
      `${name}: датотеката недостасува, има погрешен формат или е поголема од ${maxMB} MB.`,
    );
  }
}
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
text(site.hero?.description, 'Опис на почетната страница', 260);
text(site.hero?.imageAlt, 'Опис на главната фотографија', 180);
asset(site.hero?.image, 'Главна фотографија', imageExtensions, 5);
for (const key of ['services', 'steps']) {
  if (!Array.isArray(site[key]) || site[key].length !== 3) {
    errors.push(`${key}: задржи ги трите ставки.`);
    continue;
  }
  for (const [index, item] of site[key].entries()) {
    text(item.title, `${key} ${index + 1} — наслов`, 80);
    text(item.text, `${key} ${index + 1} — опис`, 350);
  }
}
for (const [key, limit] of [
  ['videos', 30],
  ['photos', 50],
]) {
  if (!Array.isArray(site[key]) || site[key].length > limit) {
    errors.push(`${key}: дозволени се најмногу ${limit} ставки.`);
    continue;
  }
  for (const [index, item] of site[key].entries()) {
    const name = `${key} ${index + 1}`;
    text(item.title, `${name} — наслов`, 80);
    if (item.description) text(item.description, `${name} — опис`, 250);
    if (!['Мебел', 'Преселби', 'Материјали'].includes(item.category)) {
      errors.push(`${name}: избери категорија.`);
    }
    if (item.visible !== undefined && typeof item.visible !== 'boolean') {
      errors.push(`${name}: видливоста мора да биде вклучена или исклучена.`);
    }
    if (key === 'videos') {
      asset(item.video, `${name} — видео`, ['.mp4'], 25);
      asset(item.thumbnail, `${name} — насловна фотографија`, imageExtensions, 5);
    } else {
      asset(item.image, `${name} — фотографија`, imageExtensions, 5);
    }
  }
}
if (!/^(?:0|\+389)[2-9](?:[ -]?\d){6,7}$/.test(site.business?.phoneDisplay ?? '')) {
  errors.push('Телефон: внеси македонски телефонски број.');
}
if (
  !/^https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/.test(site.business?.instagram ?? '')
) {
  errors.push('Instagram: внеси целосен линк до профилот.');
}
if (errors.length) {
  console.error(
    `CMS content cannot be published:\n${errors.map((error) => `- ${error}`).join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log('CMS content valid: contact, three services/steps, gallery and local media files.');
}
