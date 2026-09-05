-- Marquee pick: once per phase each player nominates the one roster film they
-- expect to perform best for them. That film's points are multiplied by 1.5.
-- Editable until the first film in that phase's roster has a result.
-- ASCII only - the SQL editor has choked on smart punctuation from these files.

create table if not exists marquee_picks (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid,
  player_id   uuid not null,
  phase       int  not null,
  film_id     text not null references films(id) on delete cascade,
  updated_at  timestamptz not null default now(),
  unique (league_id, player_id, phase)
);

alter table marquee_picks enable row level security;

drop policy if exists marquee_rw on marquee_picks;
create policy marquee_rw on marquee_picks
  for all to authenticated
  using (true) with check (true);
