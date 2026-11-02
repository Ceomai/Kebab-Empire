-- Hamle günlüğü boyut sınırı: sunucu doğrulaması günlüğü yeniden oynatır; çok büyük bir günlük
-- işlemciyi gereksiz yorar. Bir gün için 20.000 hamle ve 1 MB fazlasıyla yeter.
alter table public.day_results drop constraint if exists day_results_action_log_check;
alter table public.day_results add constraint day_results_action_log_limit
  check (action_log is null or (jsonb_typeof(action_log) = 'array' and jsonb_array_length(action_log) <= 20000 and octet_length(action_log::text) < 1000000));
