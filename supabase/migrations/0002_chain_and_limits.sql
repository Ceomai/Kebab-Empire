-- Kebab Empire — sıralama zinciri ve kötüye kullanım sınırları

-- Her kayıt için son doğrulanmış günün sonundaki oyun durumu. Yalnızca doğrulama fonksiyonu
-- (servis rolü) okur ve yazar; istemciye hiçbir politika açılmaz.
create table public.chain_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  save_id text not null,
  day int not null,
  end_envelope jsonb not null check (octet_length(end_envelope::text) < 2000000),
  updated_at timestamptz not null default now(),
  primary key (user_id, save_id)
);
alter table public.chain_state enable row level security;

-- Basit hız sınırı yardımcısı: son `win` içinde `col` sahibinin `tbl` tablosuna eklediği satır sayısı
create or replace function public.rate_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if tg_table_name = 'day_results' then
    select count(*) into n from public.day_results where user_id = new.user_id and created_at > now() - interval '1 hour';
    if n >= 40 then raise exception 'çok sık gün sonucu gönderildi' using errcode = 'P0001'; end if;
  elsif tg_table_name = 'events' then
    select count(*) into n from public.events where user_id = new.user_id and created_at > now() - interval '1 day';
    if n >= 1500 then raise exception 'günlük ölçüm sınırı' using errcode = 'P0001'; end if;
  elsif tg_table_name = 'errors' then
    select count(*) into n from public.errors where created_at > now() - interval '1 minute';
    if n >= 300 then raise exception 'hata raporu sınırı' using errcode = 'P0001'; end if;
    if new.user_id is not null then
      select count(*) into n from public.errors where user_id = new.user_id and created_at > now() - interval '1 hour';
      if n >= 30 then raise exception 'hata raporu sınırı' using errcode = 'P0001'; end if;
    end if;
  elsif tg_table_name = 'saves' then
    if tg_op = 'UPDATE' and old.updated_at > now() - interval '5 seconds' then raise exception 'çok sık kayıt' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
create trigger day_results_rate before insert on public.day_results for each row execute function public.rate_guard();
create trigger events_rate before insert on public.events for each row execute function public.rate_guard();
create trigger errors_rate before insert on public.errors for each row execute function public.rate_guard();
create trigger saves_rate before update on public.saves for each row execute function public.rate_guard();
create index if not exists events_user_time_idx on public.events (user_id, created_at);
create index if not exists errors_time_idx on public.errors (created_at);
create index if not exists day_results_user_time_idx on public.day_results (user_id, created_at);

-- Takma ad: yalnızca harf, rakam, boşluk ve birkaç işaret
alter table public.profiles add constraint display_name_chars check (display_name ~ '^[[:alnum:] çğıöşüÇĞİÖŞÜäöüßÄÖÜ._-]+$');

-- Veri silme zincir durumunu da kapsasın
create or replace function public.delete_my_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'oturum yok'; end if;
  delete from public.chain_state where user_id = auth.uid();
  delete from public.events where user_id = auth.uid();
  delete from public.errors where user_id = auth.uid();
  delete from public.day_results where user_id = auth.uid();
  delete from public.saves where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;
