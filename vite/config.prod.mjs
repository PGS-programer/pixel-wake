import { defineConfig, loadEnv } from 'vite';
import { publicSite, seoPlugin } from './seo.mjs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const site = publicSite(process.env.SITE_URL || env.SITE_URL || '');
    return {
    base: site?.pathname || './',
    plugins: [seoPlugin(site)],
    build: {
        rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
        minify: 'terser',
        terserOptions: { compress: { passes: 2 }, mangle: true, format: { comments: false } }
    }
    };
});
