/* Oyunun ortak ad alanı: tipi types/ke.d.ts'te (KENamespace) */
interface Window {
  KE: KENamespace;
}
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_TURNSTILE_SITEKEY?: string;
  readonly VITE_CONTACT_EMAIL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module 'virtual:pwa-register' {
  export function registerSW(o?: any): (reload?: boolean) => Promise<void>;
}
declare module '*.css';

/** Marka ayarı: derlemede Vite define ile brands/<id>.json içeriği */
declare const __BRAND__: any;
