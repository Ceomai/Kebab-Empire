// Kebab Empire — gün sonucu doğrulama
// İstemci gün sonucunu day_results'a yazar ve bu fonksiyonu { id } ile çağırır.
// Fonksiyon sabah kaydını hamle günlüğüyle yeniden oynatır; tutarsa satırı doğrulanmış işaretler.
// Ağır alanlar (sabah kaydı, günlük) doğrulamadan sonra silinir.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { GAME as KE } from './game.js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const url = Deno.env.get('SUPABASE_URL')!;
    const user = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await user.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: 'oturum yok' }), { status: 401, headers: cors });
    const { id } = await req.json();
    if (!Number.isSafeInteger(id) || id <= 0) return new Response(JSON.stringify({ error: 'geçersiz istek' }), { status: 400, headers: cors });
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: row, error } = await admin.from('day_results').select('*').eq('id', id).eq('user_id', u.user.id).single();
    if (error || !row) return new Response(JSON.stringify({ error: 'kayıt yok' }), { status: 404, headers: cors });
    if (row.verified) return new Response(JSON.stringify({ ok: true, note: 'zaten doğrulanmış' }), { headers: cors });
    const morning = row.morning ?? {};
    // zincir: bu kaydın son doğrulanmış gün sonu durumu
    const { data: chain } = await admin.from('chain_state').select('day, end_envelope').eq('user_id', u.user.id).eq('save_id', row.save_id).maybeSingle();
    const r = KE.verifyChain(chain ? chain.end_envelope : null, morning.envelope, row.action_log ?? [], morning.todayRule, { day: row.day, served: row.served, revenue: Number(row.revenue), reputation: Number(row.reputation) }, row.race ?? null, new Date());
    if (r.ok && r.end) await admin.from('chain_state').upsert({ user_id: u.user.id, save_id: row.save_id, day: r.end.day, end_envelope: r.end, updated_at: new Date().toISOString() });
    await admin.from('day_results').update({ verified: r.ok, verify_note: r.note, morning: null, action_log: null }).eq('id', id);
    delete r.end;
    return new Response(JSON.stringify(r), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'doğrulama hatası' }), { status: 500, headers: cors });
  }
});
