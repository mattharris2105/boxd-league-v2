-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Adds a real release_date to films and moves the season anchor + phase
-- boundaries into league_config so a future reset is a data change, not a
-- code deploy.

alter table films add column if not exists release_date date;

alter table league_config
  add column if not exists season_anchor date,
  add column if not exists phase1_end   date,
  add column if not exists phase2_end   date;

-- seed the current season's values (2026-09-07 reset)
update league_config
set season_anchor = coalesce(season_anchor, date '2026-09-07'),
    phase1_end    = coalesce(phase1_end,    date '2026-11-29'),
    phase2_end    = coalesce(phase2_end,    date '2027-01-31');
