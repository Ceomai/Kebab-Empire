/* Kebab Empire — bulut: Supabase ile kimlik, bulut kaydı, şehir sıralaması, ölçüm ve hata raporu.
   VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı değilse hiçbir şey göndermez; oyun tamamen yerel çalışır.
   Rıza (KVKK): bulut kaydı + sıralama ve kullanım ölçümü ayrı ayrı sorulur; ikisi de varsayılan kapalıdır.
   Hata raporları kişisel veri içermez ve rızadan bağımsız gönderilir (bulut tanımlıysa). */
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';
const CONSENT_KEY = 'kebab-empire-consent';

const C = (window.KE.CLOUD = /** @type {KE_CLOUD} */ ({
  enabled: !!(URL && KEY),
  ready: false,
  user: null,
  appVersion: APP_VERSION,
  lastError: null
}));
let sb = null;
const session = Math.random().toString(36).slice(2, 12);

C.consent = function () {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch (e) { return null; }
};
C.needsConsent = () => C.enabled && !C.consent();

/* Cloudflare Turnstile (görünmez doğrulama): toplu sahte hesap açılmasını engeller.
   VITE_TURNSTILE_SITEKEY tanımlıysa ve Supabase Auth'ta CAPTCHA açıksa kullanılır. */
const SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY;
function turnstileToken() {
  if (!SITEKEY) return Promise.resolve(null);
  return new Promise((resolve) => {
    const go = () => {
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:90';
      document.body.appendChild(box);
      /** @type {any} */ (window).turnstile.render(box, { sitekey: SITEKEY, size: 'invisible', callback: (t) => { box.remove(); resolve(t); }, 'error-callback': () => { box.remove(); resolve(null); } });
    };
    if (/** @type {any} */ (window).turnstile) return go();
    const sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    sc.async = true; sc.onload = go; sc.onerror = () => resolve(null);
    document.head.appendChild(sc);
  });
}
async function ensureUser() {
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (data.session) { C.user = data.session.user; return C.user; }
  const captchaToken = await turnstileToken();
  const r = await sb.auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
  if (r.error) throw r.error;
  C.user = r.data.user;
  return C.user;
}
async function upsertProfile(c) {
  const row = { id: C.user.id, consent_analytics: !!c.analytics, consent_at: c.at };
  if (c.name) row.display_name = c.name;
  const r = await sb.from('profiles').upsert(row);
  if (r.error) throw r.error;
}

C.init = async function () {
  if (!C.enabled) return;
  if (!sb) sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  const c = C.consent();
  C.initFailed = false;
  if (c && c.cloud) {
    try { await ensureUser(); await upsertProfile(c); C.ready = true; C.lastError = null; } catch (e) { C.lastError = e.message; C.initFailed = true; }
  }
};
/* Rıza verilmiş ama bağlantı kurulamamış: arayüz "bulut kaydını aç" yerine bağlantı hatası gösterir */
C.connectionFailed = () => !!(C.enabled && !C.ready && C.initFailed && (C.consent() || {}).cloud);
C.retry = async function () { await C.init(); return C.ready; };

/* Rıza ekranından gelir: { cloud, analytics, name } */
C.setConsent = async function (c) {
  const v = { cloud: !!c.cloud, analytics: !!(c.cloud && c.analytics), name: (c.name || '').trim().slice(0, 24) || null, at: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(v));
  if (!C.enabled) return v;
  if (v.cloud) { await ensureUser(); await upsertProfile(v); C.ready = true; C.initFailed = false; }
  else { C.ready = false; C.initFailed = false; }
  return v;
};

/* ---------- Bulut kaydı ---------- */
let saveTimer = null, pendingEnv = null;
C.queueSave = function (env) {
  if (!C.ready) return;
  pendingEnv = env;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(C.flushSave, 4000);
};
/* true: yazıldı (ya da yazılacak bir şey yoktu), false: yazılamadı; zarf bir sonraki denemeye kalır */
C.flushSave = async function () {
  if (!C.ready || !pendingEnv) return !pendingEnv;
  clearTimeout(saveTimer);
  const env = pendingEnv; pendingEnv = null;
  let err = null;
  try {
    const r = await sb.from('saves').upsert({ user_id: C.user.id, save_id: env.game.saveId, version: env.v, day: env.day, save: env, updated_at: new Date().toISOString() });
    if (r && r.error) err = r.error.message || 'kayıt yazılamadı';
  } catch (e) { err = (e && e.message) || String(e); }
  if (!err) return true;
  C.lastError = err;
  if (!pendingEnv) pendingEnv = env; // bu arada daha yeni bir kayıt gelmediyse tekrar denensin
  return false;
};
/* { save, day, updated_at } | null (bulutta kayıt yok) | { error } (bağlantı/sorgu hatası) */
C.loadSave = async function () {
  if (!C.ready) return { error: 'bulut hazır değil' };
  try {
    const r = await sb.from('saves').select('save, day, updated_at').eq('user_id', C.user.id).maybeSingle();
    if (r.error) { C.lastError = r.error.message; return { error: r.error.message }; }
    return r.data || null;
  } catch (e) { C.lastError = e.message; return { error: e.message || String(e) }; }
};

/* ---------- Gün sonucu ve doğrulama ---------- */
C.submitDay = async function (p) {
  if (!C.ready) return null;
  const row = {
    user_id: C.user.id, save_id: p.saveId, day: p.day, game_month: p.month, mode: p.mode, district: p.district,
    served: p.served, revenue: Math.round(p.revenue), reputation: Math.round(p.reputation * 10) / 10,
    morning: { envelope: p.morning, todayRule: p.todayRule }, action_log: p.log || []
  };
  if (p.race) row.race = p.race;
  const r = await sb.from('day_results').insert(row).select('id').single();
  if (r.error) { C.lastError = r.error.message; return null; }
  const v = await sb.functions.invoke('verify-day', { body: { id: r.data.id } });
  return v.data || null;
};

/* ---------- Sıralama ----------
   Başarıda satır dizisi döner; bağlantı/sorgu hatası ya da zaman aşımında hata fırlatır
   (arayüz "henüz sonuç yok" ile "bağlanılamadı"yı ayırabilsin). */
const TIMEOUT_MS = 10000;
function rows(q) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('zaman aşımı')), TIMEOUT_MS);
    Promise.resolve(q).then((r) => { clearTimeout(t); if (r && r.error) reject(new Error(r.error.message || 'sorgu hatası')); else resolve((r && r.data) || []); },
      (e) => { clearTimeout(t); reject(e); });
  });
}
C.leaderboard = async function (month, mode) {
  if (!sb) return [];
  return rows(sb.from('leaderboard_month').select('*').eq('game_month', month).eq('mode', mode).order('revenue', { ascending: false }).limit(20));
};
C.raceBoard = async function (week) {
  if (!sb) return [];
  return rows(sb.from('leaderboard_race').select('*').eq('race', week).order('revenue', { ascending: false }).limit(20));
};
C.champions = async function (month) {
  if (!sb) return [];
  return rows(sb.from('district_champions').select('*').eq('game_month', month));
};

/* ---------- Ölçüm ---------- */
let queue = [];
C.track = function (name, props) {
  const c = C.consent();
  if (!C.ready || !c || !c.analytics) return;
  queue.push({ user_id: C.user.id, session_id: session, name, props: props || {}, app_version: APP_VERSION });
  if (queue.length >= 20) C.flushEvents();
};
C.flushEvents = async function () {
  if (!C.ready || !queue.length) return;
  const batch = queue; queue = [];
  const r = await sb.from('events').insert(batch);
  if (r.error) C.lastError = r.error.message;
};
setInterval(() => { C.flushEvents(); }, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { C.flushEvents(); C.flushSave(); } });

/* ---------- Hata raporu ---------- */
let errCount = 0;
const seen = new Set();
C.reportError = async function (message, stack, context) {
  if (!sb || errCount >= 10) return;
  const key = String(message).slice(0, 120);
  if (seen.has(key)) return;
  seen.add(key); errCount++;
  await sb.from('errors').insert({ user_id: C.user ? C.user.id : null, message: String(message).slice(0, 500), stack: String(stack || '').slice(0, 4000), context: context || null, app_version: APP_VERSION });
};
window.addEventListener('error', (e) => { C.reportError(e.message, e.error && e.error.stack, { src: e.filename, line: e.lineno }); });
window.addEventListener('unhandledrejection', (e) => { C.reportError(e.reason && e.reason.message || String(e.reason), e.reason && e.reason.stack); });

/* ---------- Uzaktan ayar ---------- */
C.fetchConfig = async function () {
  if (!sb) return null;
  const r = await sb.from('remote_config').select('config').eq('id', 1).maybeSingle();
  return r.data ? r.data.config : null;
};

/* ---------- Hesap ---------- */
C.linkEmail = async function (email) {
  if (!C.ready) throw new Error('Önce bulut kaydını aç.');
  const r = await sb.auth.updateUser({ email });
  if (r.error) throw r.error;
};
C.deleteMyData = async function () {
  if (sb && C.user) { const r = await sb.rpc('delete_my_data'); if (r.error) throw r.error; await sb.auth.signOut(); }
  localStorage.removeItem(CONSENT_KEY);
  C.ready = false; C.user = null;
};
