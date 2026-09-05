-- Tighten film_suggestions: the app only ever reads/writes it while logged in
-- (Commissioner panel), so it does not need to be reachable with the public
-- anon key. Drops anon access, keeps full access for authenticated users and
-- the service role (the weekly Action).
-- ASCII only - the SQL editor has choked on smart punctuation from these files.

revoke all on film_suggestions from anon;

alter table film_suggestions enable row level security;

drop policy if exists fs_rw on film_suggestions;
drop policy if exists film_suggestions_rw on film_suggestions;

create policy fs_rw on film_suggestions
  for all to authenticated
  using (true) with check (true);
