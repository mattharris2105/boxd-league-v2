-- ============================================================================
-- BOXD security lockdown
-- ----------------------------------------------------------------------------
-- Before this migration the core tables were reachable with the public anon
-- key (it ships in the JS bundle). This puts row-level security on every table:
--   * anonymous (logged-out) requests get nothing
--   * player-owned rows can only be written by their owner (or the commissioner,
--     who legitimately writes on players' behalf during phase advance)
--   * shared game state (results, films, league_config, ...) is read-only to
--     players and writable only by the commissioner
--   * league invite codes are no longer enumerable; joining goes through an RPC
--
-- ASCII only. Run the whole file once in the Supabase SQL editor. Watch the
-- output for "SKIPPED <table>: column ... does not exist" notices -- that means
-- I guessed an owner-column name wrong for an empty table; tell me which and
-- it's a one-line fix. Then smoke-test the app (log in, buy a film, open the
-- commissioner panel, advance a phase on a test league).
-- ============================================================================

-- ---------- helpers ---------------------------------------------------------
create or replace function boxd_is_any_commish()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from leagues where commissioner_id = auth.uid())
      or exists (select 1 from league_members
                 where user_id = auth.uid() and role = 'commissioner');
$$;

create or replace function boxd_is_commish(p_league uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from leagues
                 where id = p_league and commissioner_id = auth.uid())
      or exists (select 1 from league_members
                 where league_id = p_league and user_id = auth.uid() and role = 'commissioner');
$$;

-- Applies a standard read-all / owner-write (or commissioner-write) policy pair
-- to a table, skipping gracefully if the table or owner column doesn't exist.
create or replace function boxd_apply_rls(p_table text, p_owner_col text, p_shared boolean default false)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', p_table);
  execute format('drop policy if exists %I on public.%I', p_table || '_read', p_table);
  execute format('drop policy if exists %I on public.%I', p_table || '_write', p_table);
  execute format('create policy %I on public.%I for select to authenticated using (true)',
                 p_table || '_read', p_table);
  if p_shared then
    execute format($f$create policy %I on public.%I for all to authenticated
                       using (boxd_is_any_commish()) with check (boxd_is_any_commish())$f$,
                   p_table || '_write', p_table);
  else
    execute format($f$create policy %I on public.%I for all to authenticated
                       using (%I = auth.uid() or boxd_is_any_commish())
                       with check (%I = auth.uid() or boxd_is_any_commish())$f$,
                   p_table || '_write', p_table, p_owner_col, p_owner_col);
  end if;
exception
  when undefined_column or undefined_table then
    raise notice 'SKIPPED %: %', p_table, sqlerrm;
end $$;

-- ---------- player-owned tables (owner writes; commissioner may too) --------
select boxd_apply_rls('profiles',            'id');
select boxd_apply_rls('rosters',             'player_id');
select boxd_apply_rls('transactions',        'player_id');
select boxd_apply_rls('phase_budgets',       'player_id');
select boxd_apply_rls('forecasts',           'player_id');
select boxd_apply_rls('friday_forecasts',    'player_id');
select boxd_apply_rls('marquee_picks',       'player_id');
select boxd_apply_rls('chips',               'player_id');
select boxd_apply_rls('oscar_predictions',   'player_id');
select boxd_apply_rls('sealed_bids',         'player_id');
select boxd_apply_rls('auteur_declarations', 'player_id');
select boxd_apply_rls('activity_feed',       'user_id');
select boxd_apply_rls('poll_votes',          'user_id');
select boxd_apply_rls('polls',               'created_by');
select boxd_apply_rls('news_signals',        'created_by');
select boxd_apply_rls('film_reviews',        'user_id');
select boxd_apply_rls('review_comments',     'user_id');
select boxd_apply_rls('screenings',          'user_id');

-- ---------- shared game state (players read; commissioner writes) -----------
select boxd_apply_rls('results',        null, true);
select boxd_apply_rls('weekly_grosses', null, true);
select boxd_apply_rls('film_values',    null, true);
select boxd_apply_rls('films',          null, true);
select boxd_apply_rls('league_config',  null, true);
select boxd_apply_rls('weekend_winners',null, true);
select boxd_apply_rls('sync_log',       null, true);

-- ---------- leagues + membership ------------------------------------------
alter table public.leagues enable row level security;
drop policy if exists leagues_read on public.leagues;
drop policy if exists leagues_write on public.leagues;
-- you can see a league only if it's public, you run it, or you're a member.
-- private league invite codes are therefore not enumerable by outsiders.
create policy leagues_read on public.leagues for select to authenticated using (
  is_public = true
  or commissioner_id = auth.uid()
  or exists (select 1 from league_members m where m.league_id = leagues.id and m.user_id = auth.uid())
);
create policy leagues_write on public.leagues for all to authenticated
  using (commissioner_id = auth.uid()) with check (commissioner_id = auth.uid());

alter table public.league_members enable row level security;
drop policy if exists lm_read on public.league_members;
drop policy if exists lm_self_join on public.league_members;
drop policy if exists lm_commish on public.league_members;
create policy lm_read      on public.league_members for select to authenticated using (true);
create policy lm_self_join on public.league_members for insert to authenticated
  with check (user_id = auth.uid());
create policy lm_commish   on public.league_members for all to authenticated
  using (boxd_is_commish(league_id)) with check (boxd_is_commish(league_id));

-- ---------- join / preview by code (bypass RLS in a controlled way) --------
create or replace function boxd_league_preview(p_code text)
returns table (name text, member_count int)
language sql stable security definer set search_path = public as $$
  select l.name, l.member_count from leagues l
  where upper(l.invite_code) = upper(trim(p_code)) limit 1;
$$;

create or replace function boxd_join_league(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into v_id from leagues where upper(invite_code) = upper(trim(p_code)) limit 1;
  if v_id is null then raise exception 'No league with that code'; end if;
  insert into league_members (league_id, user_id, role)
  values (v_id, auth.uid(), 'player') on conflict do nothing;
  update leagues set member_count = coalesce(member_count, 0)
    + (select count(*) from league_members where league_id = v_id) - coalesce(member_count, 0)
  where id = v_id;
  return v_id;
end $$;

grant execute on function boxd_league_preview(text) to anon, authenticated;
grant execute on function boxd_join_league(text)   to authenticated;

-- keep leagues.member_count correct from a trigger, so the client never has to
-- UPDATE the leagues table just to bump a counter (which RLS now forbids for
-- non-commissioners).
create or replace function boxd_sync_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update leagues set member_count = (
    select count(*) from league_members
    where league_id = coalesce(new.league_id, old.league_id)
  ) where id = coalesce(new.league_id, old.league_id);
  return null;
end $$;
drop trigger if exists trg_member_count on league_members;
create trigger trg_member_count after insert or delete on league_members
  for each row execute function boxd_sync_member_count();

-- ---------- belt-and-braces: strip any leftover anon grants ----------------
-- The app requires login; nothing is read before auth except the preview RPC
-- above (which is SECURITY DEFINER and unaffected). If you later want the
-- public /boxd-widget.js to work again, add a narrow anon SELECT policy to the
-- specific aggregate view it needs -- do not re-open whole tables.
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
