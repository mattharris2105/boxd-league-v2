-- Run in the Supabase SQL editor.
-- Mutable store for third-party API tokens that rotate (Data Thistle's
-- access/refresh pair). Edge functions + the refresh job read/write this;
-- it is NOT exposed to the browser (RLS on, no policies).

create table if not exists api_tokens (
  provider           text primary key,
  access_token       text not null,
  refresh_token      text not null,
  access_expires_at  timestamptz,
  refresh_expires_at timestamptz,
  updated_at         timestamptz not null default now()
);

alter table api_tokens enable row level security;
-- no policies -> only the service role (edge functions, scripts) can touch it
