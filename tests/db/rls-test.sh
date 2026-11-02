#!/usr/bin/env bash
# RLS ve kısıt testleri: geçici bir veritabanına shim + bütün migration'ları uygular, iki kullanıcıyla dener.
# Kullanım: tests/db/rls-test.sh   (yerel PostgreSQL gerekir; postgres kullanıcısıyla çalışır)
set -u
DB=kebab_rls_test
P="psql -X -q -v ON_ERROR_STOP=1 -d $DB"
cd "$(dirname "$0")/../.."
su postgres -c "dropdb --if-exists $DB && createdb $DB" >/dev/null
su postgres -c "$P -f tests/db/supabase-shim.sql" >/dev/null
for f in supabase/migrations/*.sql; do su postgres -c "$P -f $f" >/dev/null || { echo "MIGRATION HATASI: $f"; exit 1; }; done
pass=0; fail=0
A=11111111-1111-1111-1111-111111111111; B=22222222-2222-2222-2222-222222222222
su postgres -c "$P -c \"insert into auth.users(id) values ('$A'),('$B'); insert into public.profiles(id, display_name, consent_analytics) values ('$A','Ayşe',true),('$B','Bora',false);\"" >/dev/null
# as USER SQL → komutu belirtilen kullanıcı olarak çalıştırır; EXPECT ok|fail ; çıktı kontrolü isteğe bağlı
t() {
  local name="$1" user="$2" expect="$3" sql="$4" want="${5:-}"
  local role=authenticated; [ "$user" = anon ] && role=anon; [ "$user" = service ] && role=service_role
  local sub=""; [ "$user" = A ] && sub=$A; [ "$user" = B ] && sub=$B
  local out
  out=$(su postgres -c "$P -At -c \"begin; set local role $role; select set_config('request.jwt.claim.sub', '$sub', true); $sql; commit;\"" 2>&1)
  local rc=$?
  local ok=0
  if [ "$expect" = ok ] && [ $rc -eq 0 ]; then ok=1; fi
  if [ "$expect" = fail ] && [ $rc -ne 0 ]; then ok=1; fi
  if [ $ok = 1 ] && [ -n "$want" ] && ! echo "$out" | tail -n +2 | grep -qx -- "$want"; then ok=0; fi
  if [ $ok = 1 ]; then pass=$((pass+1)); echo "  ✓ $name"; else fail=$((fail+1)); echo "  ✗ $name  (rc=$rc) → $(echo "$out" | tr '\n' ' ' | cut -c1-160)"; fi
}
row() { echo "insert into public.day_results(user_id, save_id, day, game_month, mode, district, served, revenue, reputation $1) values ('$2', 's1', $3, '2026-03', 'doner', 'kadiceşme', 100, 50000, 40 $4)"; }
echo "== profiller"
t "A kendi profilini okur" A ok "select count(*) from public.profiles" "1"
t "A, B'nin profilini göremez" A ok "select count(*) from public.profiles where id='$B'" "0"
t "A, B'nin adını değiştiremez" A ok "update public.profiles set display_name='Hack' where id='$B' returning 1" ""
t "A kötü karakterli ad yazamaz" A fail "update public.profiles set display_name='<script>' where id='$A'"
t "anon profilleri okuyamaz" anon ok "select count(*) from public.profiles" "0"
echo "== gün sonuçları"
t "A kendi sonucunu ekler" A ok "$(row '' $A 1 '')"
t "A, B adına sonuç ekleyemez" A fail "$(row '' $B 1 '')"
t "A doğrulanmış sonuç ekleyemez" A fail "$(row ', verified' $A 2 ', true')"
t "A sonucunu sonradan doğrulanmış yapamaz" A ok "update public.day_results set verified=true where user_id='$A' returning 1" ""
t "A sonucunu silemez (kayıt tutulur)" A ok "delete from public.day_results where user_id='$A' returning 1" ""
t "B, A'nın sonuçlarını göremez" B ok "select count(*) from public.day_results" "0"
t "ciro sınırı (50M) aşılırsa reddedilir" A fail "insert into public.day_results(user_id, save_id, day, game_month, mode, district, served, revenue, reputation) values ('$A','s1',3,'2026-03','doner','x',1,60000000,40)"
t "geçersiz mod reddedilir" A fail "insert into public.day_results(user_id, save_id, day, game_month, mode, district, served, revenue, reputation) values ('$A','s1',4,'2026-03','pizza','x',1,1,40)"
t "aynı gün iki kez eklenemez" A fail "$(row '' $A 1 '')"
t "yarış kimliği biçimi denetlenir" A fail "$(row ', race' $A 5 ", 'hafta-1'")"
t "geçerli yarış kimliği kabul" A ok "$(row ', race' $A 6 ", '2026-W45'")"
t "çok uzun hamle günlüğü reddedilir" A fail "$(row ', action_log' $A 7 ", (select jsonb_agg(x) from generate_series(1,20001) x)")"
t "hamle günlüğü dizi olmalı" A fail "$(row ', action_log' $A 8 ", '{\\\"a\\\":1}'::jsonb")"
echo "== liderlik görünümleri"
su postgres -c "$P -c \"insert into public.day_results(user_id, save_id, day, game_month, mode, district, served, revenue, reputation, verified) values ('$B','s2',1,'2026-03','doner','kadiceşme',100,77000,40,true), ('$B','r1',1,'2026-03','doner','kadiceşme',100,99000,40,true); update public.day_results set race='2026-W45' where save_id='r1';\"" >/dev/null
t "aylık sıralama yalnızca doğrulanmışı gösterir" A ok "select count(*) from public.leaderboard_month" "1"
t "aylık sıralamaya yarış günleri girmez" A ok "select revenue from public.leaderboard_month" "77000"
t "yarış sıralaması ayrı" anon ok "select revenue from public.leaderboard_race where race='2026-W45'" "99000"
t "sıralama kimlik sızdırmaz (user_id sütunu yok)" A fail "select user_id from public.leaderboard_month"
t "huni görünümü oyunculara kapalı" A fail "select * from public.funnel_days"
t "zincir durumu oyunculara kapalı" A ok "select count(*) from public.chain_state" "0"
echo "== ölçüm, hata, ayar"
t "rızası olan A ölçüm ekler" A ok "insert into public.events(user_id, session_id, name) values ('$A','s','day_end')"
t "rızası olmayan B ölçüm ekleyemez" B fail "insert into public.events(user_id, session_id, name) values ('$B','s','day_end')"
t "A başkası adına ölçüm ekleyemez" A fail "insert into public.events(user_id, session_id, name) values ('$B','s','day_end')"
t "ölçümler oyunculara okunmaz" A ok "select count(*) from public.events" "0"
t "anon hata raporu ekler" anon ok "insert into public.errors(message) values ('x')"
t "anon başkası adına hata ekleyemez" anon fail "insert into public.errors(user_id, message) values ('$A','x')"
t "uzun hata mesajı reddedilir" anon fail "insert into public.errors(message) values (repeat('x',600))"
t "uzaktan ayar herkese okunur, yazılamaz" A fail "insert into public.remote_config(id, config) values (1, '{}')"
echo "== kayıtlar ve silme"
t "A kendi bulut kaydını yazar" A ok "insert into public.saves(user_id, save_id, version, day, save) values ('$A','s1',4,3,'{}')"
t "B, A'nın kaydını göremez" B ok "select count(*) from public.saves" "0"
t "B, A'nın kaydını ezemez" B ok "update public.saves set day=99 where user_id='$A' returning 1" ""
t "çok büyük bulut kaydı reddedilir" A fail "insert into public.saves(user_id, save_id, version, day, save) values ('$A','s9',4,3, jsonb_build_object('x', repeat('y', 2100000)))"
t "A verisini siler" A ok "select public.delete_my_data()"
t "A'nın verisi gitti" service ok "select count(*) from public.day_results where user_id='$A'" "0"
t "B'nin verisi duruyor" service ok "select count(*) from public.day_results where user_id='$B'" "2"
t "anon delete_my_data çağıramaz" anon fail "select public.delete_my_data()"
echo
echo "SONUÇ: $pass geçti, $fail başarısız"
su postgres -c "dropdb --if-exists $DB" >/dev/null
[ $fail -eq 0 ]
