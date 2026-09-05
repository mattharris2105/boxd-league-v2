-- Weekly slate-scan writes candidate films here; the commissioner approves or
-- dismisses each one from the in-app Commissioner / Suggestions tab. Approving
-- a row copies it into films; nothing here is ever shown to players.
-- ASCII only on purpose - the Supabase SQL editor has choked on smart
-- punctuation pasted from this file before.

create table if not exists film_suggestions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  kind          text not null default 'new',
  status        text not null default 'pending',
  film_id       text references films(id) on delete cascade,
  title         text not null,
  dist          text,
  genre         text,
  release_date  date,
  release_type  text,
  est_m         numeric,
  est_src       text,
  tmdb_id       integer,
  tmdb_title    text,
  tmdb_year     text,
  notes         text,
  dedupe_key    text unique,
  reviewed_at   timestamptz,
  reviewed_by   text
);

create index if not exists film_suggestions_status_idx on film_suggestions (status);

alter table film_suggestions enable row level security;

drop policy if exists film_suggestions_rw on film_suggestions;

create policy film_suggestions_rw on film_suggestions
  for all to authenticated using (true) with check (true);
