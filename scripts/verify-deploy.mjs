import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { publicSite } from '../vite/seo.mjs';
const site = publicSite(process.env.SITE_URL);
assert.ok(site, 'Falta SITE_URL: no se valida una publicación sin su URL real.');
const html = await readFile('dist/index.html', 'utf8');
assert.ok(html.includes(`rel="canonical" href="${site.href}"`), 'Canonical incorrecto');
assert.ok(html.includes('content="index, follow"'), 'Meta robots incorrecto');
assert.ok(html.includes('application/ld+json'), 'Faltan datos estructurados');
assert.ok(html.includes('<h1>Pixel Wake'), 'Falta contenido semántico');
assert.ok(!(await readFile('dist/robots.txt', 'utf8')).includes('Disallow: /'), 'Rastreo bloqueado');
assert.ok((await readFile('dist/robots.txt', 'utf8')).includes(new URL('sitemap.xml', site).href));
assert.ok((await readFile('dist/sitemap.xml', 'utf8')).includes(`<loc>${site.href}</loc>`));
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const value = match[1]; if (/^(https?:|#|data:)/.test(value)) continue;
    const pathname = new URL(value, site).pathname;
    assert.ok(pathname.startsWith(site.pathname), `Asset fuera de la base: ${value}`);
    const file = resolve('dist', decodeURIComponent(pathname.slice(site.pathname.length)));
    assert.ok(file.startsWith(resolve('dist') + '/')); assert.ok((await stat(file)).isFile(), `Falta asset: ${value}`);
}
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
for (const icon of manifest.icons) assert.ok((await stat(resolve('dist', icon.src))).isFile());
console.log(`PASS: base, assets, HTTPS canonical, robots, sitemap, structured data, manifest — ${site.href}`);
