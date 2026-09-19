-- league_config.id has no real auto-increment sequence — it defaults to a
-- stuck value of 1, not nextval(). The very first league (BOXD Original
-- League) grabbed id=1 when the table was created by hand early on, and
-- every league created since then has silently failed to get a config row,
-- because createLeague()'s insert (which never specifies id) collides with
-- id=1 every single time (23505 duplicate key). This is why Cinebug had no
-- league_config row at all.
--
-- Give it a real sequence, advanced past whatever the current max id is, and
-- a unique constraint on league_id so this table can never silently end up
-- with two rows for the same league (which the app's self-heal logic in
-- updateLeagueConfig() assumes never happens).
create sequence if not exists league_config_id_seq owned by league_config.id;
select setval('league_config_id_seq', greatest((select coalesce(max(id), 0) from league_config), 1));
alter table league_config alter column id set default nextval('league_config_id_seq');
alter table league_config add constraint league_config_league_id_key unique (league_id);
