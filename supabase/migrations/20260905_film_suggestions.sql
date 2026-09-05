-- Weekly slate-scan writes candidate films here; the commissioner approves or
-- dismisses each one from the in-app Commissioner → Suggestions tab. Approving a
-- row copies it into `films`; nothing here is ever shown to players.

create table if not exists film_suggestions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  kind          text not null default 'new',        -- 'new' = add a film · 'estimate' = fill est_m on an existing film
  status        text not null default 'pending',    -- 'pending' · 'approved' · 'dismissed'
  film_id       text references films(id) on delete cascade,  -- set when kind = 'estimate'
  title         text not null,
  dist          text,
  genre         text,
  release_date  date,
  release_type  text,                               -- 'Wide' / 'Limited' / 'IMAX' as scraped
  est_m         numeric,                            -- opening-weekend projection ($M), null until researched
  est_src       text,                               -- 'track' / 'gauge' + short note
  tmdb_id       integer,                            -- proposed TMDB id (for the poster)
  tmdb_title    text,                               -- what that id actually resolves to, for a sanity check
  tmdb_year     text,
  notes         text,                               -- reasoning / comps / research links
  dedupe_key    text unique,                        -- title|release_date, stops re-runs duplicating a row
  reviewed_at   timestamptz,
  reviewed_by   text
);

create index if not exists film_suggestions_status_idx on film_suggestions (status);

alter table film_suggestions enable row level security;

-- Same trust model as the `films` table: the app authenticates with the anon
-- key and gates the Commissioner UI client-side. The weekly Action uses the
-- service key and bypasses RLS.
drop policy if exists film_suggestions_rw on film_suggestions;
create policy film_suggestions_rw on film_suggestions
  for all to authenticated using (true) with check (true);
