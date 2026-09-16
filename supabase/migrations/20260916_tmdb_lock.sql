-- A manually-fixed poster/tmdb_id was getting clobbered by an automated
-- sync-metadata run (the scheduled cron skips already-set tmdb_id, but a
-- --refresh run re-fetches everything by title search, including films the
-- host already corrected by hand). This adds a lock the host controls from
-- the Films editor: once set, no automation touches that film's tmdb_id
-- again, refresh or not.
alter table films add column if not exists tmdb_locked boolean not null default false;
