import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { createRequire } from 'node:module';

/* Marka ayarı: BRAND=<id> ile brands/<id>.json okunur ve denetlenir (yoksa varsayılan Kebab Empire) */
const { loadBrand } = createRequire(import.meta.url)('./scripts/brand-validate.cjs');
const BRAND_ID = process.env.BRAND || 'default';
const BRAND = loadBrand(BRAND_ID);
const APP = Object.assign({ name: BRAND.gameName || 'Kebab Empire', themeColor: '#d7263d', background: '#ece2cb', description: 'Döner ve kebap işletme oyunu' }, BRAND.app || {});
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* markalı derlemede index.html: sekme başlığı, ana ekran adı (iOS) ve tema rengi */
const brandHtml = {
  name: 'brand-html',
  transformIndexHtml(html) {
    if (BRAND_ID === 'default') return html;
    return html
      .replace(/<title>[^<]*<\/title>/, `<title>${attr(BRAND.gameName)}</title>`)
      .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, `$1${attr(APP.name)}$2`)
      .replace(/(<meta name="theme-color" content=")[^"]*(")/, `$1${attr(APP.themeColor)}$2`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${attr(APP.description)}$2`);
  }
};

export default defineConfig({
  base: './',
  define: { __BRAND__: JSON.stringify(BRAND) },
  build: { target: 'es2020', sourcemap: true, chunkSizeWarningLimit: 900 },
  plugins: [
    brandHtml,
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
