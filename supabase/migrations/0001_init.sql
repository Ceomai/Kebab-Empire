-- Kebab Empire — ilk şema
-- Kimlik: Supabase Auth (anonim giriş + isteğe bağlı e-posta bağlama). Her tablo satır güvenliği (RLS) ile korunur.


-- Oyuncu profili: yalnızca liderlikte görünecek takma ad ve rıza bilgileri
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Esnaf' check (char_length(display_name) between 2 and 24),
  consent_analytics boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profil: kendini oku" on public.profiles for select using (auth.uid() = id);
create policy "profil: kendini ekle" on public.profiles for insert with check (auth.uid() = id);
create policy "profil: kendini güncelle" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Bulut kaydı: oyuncu başına bir yuva, 2 MB sınırı
create table public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save_id text not null,
  version int not null,
  day int not null check (day > 0),
  save jsonb not null check (octet_length(save::text) < 2000000),
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
create policy "kayıt: sahibi okur" on public.saves for select using (auth.uid() = user_id);
create policy "kayıt: sahibi yazar" on public.saves for insert with check (auth.uid() = user_id);
create policy "kayıt: sahibi günceller" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kayıt: sahibi siler" on public.saves for delete using (auth.uid() = user_id);

-- Gün sonuçları: liderlik tablosunun ham verisi. Doğrulama fonksiyonu sabah durumu + hamle
-- günlüğünü yeniden oynatır; tutarsa verified = true olur ve ağır alanlar boşaltılır.
create table public.day_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  save_id text not null,
  day int not null check (day > 0),
  game_month text not null check (game_month ~ '^\d{4}-\d{2}$'),
  mode text not null check (mode in ('doner', 'kebap')),
  district text not null,
  served int not null check (served >= 0 and served < 5000),
  revenue numeric not null check (revenue >= 0 and revenue < 50000000),
  reputation numeric not null check (reputation between 0 and 100),
  morning jsonb check (morning is null or octet_length(morning::text) < 2000000),
  action_log jsonb check (action_log is null or jsonb_typeof(action_log) = 'array'),
  verified boolean not null default false,
  verify_note text,
  created_at timestamptz not null default now(),
  unique (user_id, save_id, day)
);
create index day_results_month_idx on public.day_results (game_month, mode) where verified;
alter table public.day_results enable row level security;
create policy "sonuç: sahibi ekler" on public.day_results for insert with check (auth.uid() = user_id and verified = false);
create policy "sonuç: sahibi okur" on public.day_results for select using (auth.uid() = user_id);
-- verified alanını yalnızca servis rolü (doğrulama fonksiyonu) değiştirebilir: güncelleme politikası yok.

-- Aylık liderlik: yalnızca doğrulanmış günler, takma adla
create or replace view public.leaderboard_month with (security_invoker = false) as
select r.game_month, r.mode, (r.user_id = auth.uid()) as is_me, coalesce(p.display_name, 'Esnaf') as display_name,
       sum(r.revenue)::bigint as revenue, sum(r.served)::int as served, max(r.reputation)::numeric(5,1) as reputation,
       count(*)::int as days
from public.day_results r
left join public.profiles p on p.id = r.user_id
where r.verified
group by r.game_month, r.mode, r.user_id, p.display_name;
revoke all on public.leaderboard_month from anon, authenticated;
grant select on public.leaderboard_month to anon, authenticated;

-- Semt şampiyonları: her ay her semtte en yüksek doğrulanmış ciro
create or replace view public.district_champions with (security_invoker = false) as
select distinct on (game_month, district) game_month, district, mode, display_name, revenue
from (
  select r.game_month, r.district, r.mode, coalesce(p.display_name, 'Esnaf') as display_name, sum(r.revenue)::bigint as revenue
  from public.day_results r left join public.profiles p on p.id = r.user_id
  where r.verified
  group by r.game_month, r.district, r.mode, r.user_id, p.display_name
) t
order by game_month, district, revenue desc;
revoke all on public.district_champions from anon, authenticated;
grant select on public.district_champions to anon, authenticated;

-- Kullanım ölçümleri (yalnızca rıza verenlerden; okuma yalnızca panelden/servis rolüyle)
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  session_id text not null check (char_length(session_id) <= 40),
  name text not null check (name ~ '^[a-z0-9_.]{2,40}$'),
  props jsonb not null default '{}' check (octet_length(props::text) < 4000),
  app_version text check (char_length(app_version) <= 20),
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "ölçüm: rıza veren ekler" on public.events for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.consent_analytics));

-- Hata raporları (kişisel veri içermez)
create table public.errors (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  message text not null check (char_length(message) <= 500),
  stack text check (char_length(stack) <= 4000),
  context jsonb check (context is null or octet_length(context::text) < 4000),
  app_version text check (char_length(app_version) <= 20),
  created_at timestamptz not null default now()
);
alter table public.errors enable row level security;
create policy "hata: herkes ekler" on public.errors for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());

-- Uzaktan ayar: herkes okur, yalnızca panelden değişir
create table public.remote_config (
  id int primary key default 1 check (id = 1),
  config jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.remote_config enable row level security;
create policy "ayar: herkes okur" on public.remote_config for select using (true);
insert into public.remote_config (id, config) values (1, '{"version": 1}') on conflict do nothing;

-- KVKK: oyuncu kendi bütün verisini tek çağrıyla silebilir (hesap dahil)
create or replace function public.delete_my_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'oturum yok'; end if;
  delete from public.events where user_id = auth.uid();
  delete from public.errors where user_id = auth.uid();
  delete from public.day_results where user_id = auth.uid();
  delete from public.saves where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_data() from public;
grant execute on function public.delete_my_data() to authenticated;

-- Eski ölçüm ve hata kayıtlarını 180 günde temizle (pg_cron açıksa zamanlanır)
create or replace function public.purge_old_telemetry() returns void language sql security definer set search_path = public as $$
  delete from public.events where created_at < now() - interval '180 days';
  delete from public.errors where created_at < now() - interval '180 days';
$$;
