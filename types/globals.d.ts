/* Oyunun ortak ad alanı. Alt nesneler şimdilik geniş tiplidir; dosyalar arası
   yazım hatalarını, tanımsız değişkenleri ve sözdizimi sorunlarını yakalamak için yeterlidir. */
declare var KE: any;
interface Window { KE: any; }
interface ImportMetaEnv { readonly VITE_SUPABASE_URL?: string; readonly VITE_SUPABASE_ANON_KEY?: string; readonly VITE_APP_VERSION?: string; readonly VITE_TURNSTILE_SITEKEY?: string; readonly VITE_CONTACT_EMAIL?: string; }
interface ImportMeta { readonly env: ImportMetaEnv; }
declare module 'virtual:pwa-register' { export function registerSW(o?: any): (reload?: boolean) => Promise<void>; }
declare module '*.css';
