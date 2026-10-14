import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        host: '0.0.0.0',
        port: 8080,
        fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/data/**', '**/.checkpoints/**', '**/*.sqlite', '**/*.sqlite-*'] },
        proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false }, '/socket': { target: 'ws://127.0.0.1:3001', ws: true, changeOrigin: false } }
    }
});
