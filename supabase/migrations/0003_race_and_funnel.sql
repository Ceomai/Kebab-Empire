-- Haftalık yarış: aynı tohumla oynanan 7 günlük oyunlar. Yarış günleri aylık sıralamaya ve
-- semt şampiyonluğuna girmez; kendi haftalık sıralamaları vardır.
alter table public.day_results add column if not exists race text
  check (race is null or race ~ '^\d{4}-W\d{2}$');
create index if not exists day_results_race_idx on public.day_results (race) where verified and race is not null;

create or replace view public.leaderboard_month with (security_invoker = false) as
select r.game_month, r.mode, (r.user_id = auth.uid()) as is_me, coalesce(p.display_name, 'Esnaf') as display_name,
       sum(r.revenue)::bigint as revenue, sum(r.served)::int as served, max(r.reputation)::numeric(5,1) as reputation,
       count(*)::int as days
from public.day_results r
left join public.profiles p on p.id = r.user_id
where r.verified and r.race is null
group by r.game_month, r.mode, r.user_id, p.display_name;

create or replace view public.district_champions with (security_invoker = false) as
select distinct on (game_month, district) game_month, district, mode, display_name, revenue
from (
  select r.game_month, r.district, r.mode, coalesce(p.display_name, 'Esnaf') as display_name, sum(r.revenue)::bigint as revenue
  from public.day_results r left join public.profiles p on p.id = r.user_id
  where r.verified and r.race is null
  group by r.game_month, r.district, r.mode, r.user_id, p.display_name
) t
order by game_month, district, revenue desc;

-- Bir oyuncunun haftadaki en iyi yarışı (aynı haftada birden çok deneme olabilir: en yüksek ciroyu alır)
create or replace view public.leaderboard_race with (security_invoker = false) as
select distinct on (race, user_id) race, (user_id = auth.uid()) as is_me, display_name, revenue, days
from (
  select r.race, r.user_id, r.save_id, coalesce(p.display_name, 'Esnaf') as display_name,
         sum(r.revenue)::bigint as revenue, count(*)::int as days
  from public.day_results r left join public.profiles p on p.id = r.user_id
  where r.verified and r.race is not null and r.day <= 7
  group by r.race, r.user_id, r.save_id, p.display_name
) t
order by race, user_id, days desc, revenue desc;
revoke all on public.leaderboard_race from anon, authenticated;
grant select on public.leaderboard_race to anon, authenticated;

-- Oyuncu hunisi: kaç kişi oyunun kaçıncı gününe ulaştı (ölçüm rızası verenlerin day_end olaylarından).
-- Yalnızca servis rolü okur (panelden); oyunculara açık değildir.
create or replace view public.funnel_days with (security_invoker = true) as
with reach as (
  select coalesce(user_id::text, session_id) as who, max((props->>'day')::int) as last_day
  from public.events
  where name = 'day_end' and (props->>'day') ~ '^\d+$'
  group by 1
)
select d as day, count(*) filter (where last_day >= d)::int as players
from reach, generate_series(1, 400) as d
where d in (1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 183, 240, 300, 360, 400)
group by d
order by d;
revoke all on public.funnel_days from anon, authenticated;
