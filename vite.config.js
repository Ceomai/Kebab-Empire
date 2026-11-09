import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';

/* Marka ayarı: BRAND=<id> ile brands/<id>.json okunur (yoksa varsayılan Kebab Empire) */
const BRAND_ID = process.env.BRAND || 'default';
const brandFile = `brands/${BRAND_ID}.json`;
if (!fs.existsSync(brandFile)) throw new Error(`Marka dosyası bulunamadı: ${brandFile}`);
const BRAND = JSON.parse(fs.readFileSync(brandFile, 'utf8'));
const APP = Object.assign({ name: 'Kebab Empire', themeColor: '#d7263d', background: '#ece2cb', description: 'Döner ve kebap işletme oyunu' }, BRAND.app || {});

export default defineConfig({
  base: './',
  define: { __BRAND__: JSON.stringify(BRAND) },
  build: { target: 'es2020', sourcemap: true, chunkSizeWarningLimit: 900 },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: APP.name,
        short_name: APP.name,
        description: APP.description,
        lang: 'tr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: APP.background,
        theme_color: APP.themeColor,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        navigateFallback: 'index.html'
      }
    })
  ],
  test: { environment: 'node', include: ['tests/**/*.test.js'] }
});
