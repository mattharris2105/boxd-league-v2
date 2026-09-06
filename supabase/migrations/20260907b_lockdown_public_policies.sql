-- ============================================================================
-- BOXD security lockdown, part 2
-- ----------------------------------------------------------------------------
-- Part 1 added scoped policies but the database was full of pre-existing
-- {public}-role policies ("allow anyone") that made RLS a no-op, because
-- PostgreSQL ORs permissive policies together.
--
-- This migration:
--   1. drops EVERY {public}-role policy in the public schema
--   2. turns RLS on for the two tables that had it off (showtimes_cache,
--      sabotages)
--   3. re-applies the scoped policies from part 1 to the tables it missed
--   4. for any table left with RLS on and no policy (which would lock it to
--      nobody-but-service), adds a "logged-in users only" fallback -- except
--      api_tokens, which must stay service-only.
--
-- Run the whole file once. Then re-run the verification query:
--   select tablename, policyname, roles::text, cmd from pg_policies
--   where schemaname='public' and (roles::text like '%anon%' or roles::text='{public}');
-- It must come back EMPTY. Then smoke-test the app.
--
-- Depends on boxd_is_any_commish() / boxd_apply_rls() from
-- 20260907_security_rls.sql -- run that first if you haven't.
-- ============================================================================

-- 1. drop every {public} (== "everyone, incl. anonymous") policy ------------
do $$
declare r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public' and roles::text = '{public}'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- helper: enable RLS + a plain "must be logged in" read/write policy. Used for
-- the secondary tables (comments, likes, reactions, legacy features) where a
-- per-user column isn't worth guessing -- the goal is just to remove anonymous
-- access. api_tokens is never passed here.
create or replace function boxd_lock_authed(p_table text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', p_table);
  execute format('drop policy if exists %I on public.%I', p_table || '_read', p_table);
  execute format('drop policy if exists %I on public.%I', p_table || '_write', p_table);
  execute format('drop policy if exists %I on public.%I', p_table || '_auth_all', p_table);
  execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)',
                 p_table || '_auth_all', p_table);
exception when undefined_table then
  raise notice 'no such table: %', p_table;
end $$;

-- 2. RLS on for the tables that had it off --------------------------------
alter table if exists public.showtimes_cache enable row level security;
alter table if exists public.sabotages       enable row level security;

-- 3. tables part 1 didn't cover -----------------------------------------
-- shared game state -> commissioner writes, players read
select boxd_apply_rls('movie_of_week',      null, true);
select boxd_apply_rls('distributor_access', null, true);
-- everything else -> logged-in only (kills anonymous access; no per-user scope).
-- Deliberately NOT in this list, because they keep the stricter owner /
-- commissioner scoping from part 1: rosters, transactions, phase_budgets,
-- forecasts, friday_forecasts, marquee_picks, activity_feed, profiles,
-- results, weekly_grosses, film_values, films, league_config, news_signals,
-- weekend_winners, leagues, league_members.
select boxd_lock_authed('film_picks');
select boxd_lock_authed('film_comments');
select boxd_lock_authed('film_reviews');
select boxd_lock_authed('review_comments');
select boxd_lock_authed('comment_likes');
select boxd_lock_authed('reactions');
select boxd_lock_authed('screenings');
select boxd_lock_authed('screening_attendees');
select boxd_lock_authed('booking_clicks');
select boxd_lock_authed('marketing_events');
select boxd_lock_authed('polls');
select boxd_lock_authed('poll_votes');
select boxd_lock_authed('chips');
select boxd_lock_authed('oscar_predictions');
select boxd_lock_authed('sealed_bids');
select boxd_lock_authed('auteur_declarations');
select boxd_lock_authed('powers');
select boxd_lock_authed('sabotages');
select boxd_lock_authed('trades');
select boxd_lock_authed('showtimes_cache');

-- 4. make sure RLS is enabled on every table in public ------------------
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' and rowsecurity = false
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
    raise notice 'RLS enabled: %', r.tablename;
  end loop;
end $$;

-- 5. fallback: any table now left with zero policies gets a
--    logged-in-users-only policy, so a live feature doesn't silently break.
--    api_tokens is deliberately excluded (service-role only, deny everyone).
do $$
declare r record;
begin
  for r in
    select t.tablename
    from pg_tables t
    left join pg_policies p on p.schemaname = t.schemaname and p.tablename = t.tablename
    where t.schemaname = 'public'
      and t.tablename <> 'api_tokens'
    group by t.tablename
    having count(p.policyname) = 0
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      r.tablename || '_auth_all', r.tablename);
    raise notice 'fallback policy added: %', r.tablename;
  end loop;
end $$;
