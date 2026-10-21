import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export function publicSite(raw = '') {
    if (!raw.trim()) return null;
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || /^(localhost|127\.0\.0\.1)$/.test(url.hostname)) throw new Error('SITE_URL debe ser una URL pública HTTPS sin credenciales, query ni fragmento.');
    url.pathname = url.pathname.replace(/\/*$/, '/');
    return url;
}
const escape = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export function seoPlugin(site) {
    let output;
    return {
        name: 'pixel-wake-public-metadata',
        configResolved(config) { output = resolve(config.root, config.build.outDir); },
        transformIndexHtml(html) {
            if (!site) return html;
            const href = site.href, image = new URL('social-preview.png', site).href;
            const data = { '@context': 'https://schema.org', '@type': 'VideoGame', name: 'Pixel Wake', alternateName: 'Pixel Wake game',
                url: href, description: 'Arcade marítimo en pixel art y simulador introductorio de atraque 3D con doble hélice, jugables desde el navegador.',
                genre: ['Arcade', 'Endless runner', 'Simulation'], gamePlatform: 'Web browser', applicationCategory: 'Game', operatingSystem: 'Any',
                inLanguage: 'es', isAccessibleForFree: true, image };
            return html.replace('<!-- PUBLIC_SITE_METADATA -->', `<link rel="canonical" href="${escape(href)}" />\n<meta property="og:url" content="${escape(href)}" />\n<meta property="og:image" content="${escape(image)}" />\n<meta name="twitter:image" content="${escape(image)}" />\n<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
        },
        async writeBundle() {
            const robots = `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${new URL('sitemap.xml', site).href}\n` : ''}`;
            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site ? `\n  <url><loc>${escape(site.href)}</loc></url>\n` : ''}</urlset>\n`;
            await Promise.all([writeFile(resolve(output, 'robots.txt'), robots), writeFile(resolve(output, 'sitemap.xml'), sitemap)]);
        }
    };
}
