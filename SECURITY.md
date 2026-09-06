# BOXD — security hardening

What the pre-release review found, what's been fixed in code, and what you have
to do in the Supabase dashboard before sharing the app with anyone.

## Deploy order

Do these in sequence. Test the app after each.

### 1. Run the RLS migration

`supabase/migrations/20260907_security_rls.sql` — paste the whole file into the
Supabase **SQL editor** and run it once.

- It puts row-level security on every table: logged-out requests get nothing,
  players can only write their own rows, shared game state (results, films,
  league_config, …) is commissioner-write only.
- Watch the output for `NOTICE: SKIPPED <table>: column "…" does not exist`.
  That means the owner-column name was guessed wrong for an empty table. Tell
  me which table + the real column and it's a one-line fix. Everything else
  still applies.
- Then smoke-test: log in, buy a film, sell one, open the Commissioner panel,
  create a second test league, join it from another account with the code,
  advance a phase. If any of those throw a `permission denied` / `row-level
  security` error, note the exact action and table.

### 2. Redeploy the `send-notification` function

`supabase/functions/send-notification/index.ts` was rewritten. It now:

- rejects calls that don't carry a real logged-in user's token (the anon key no
  longer works),
- requires the caller to be the **commissioner** of the league in the payload,
- builds the recipient list from `league_members` itself — the caller can't
  name arbitrary recipients,
- HTML-escapes every interpolated value,
- drops the `trade_proposed` path (trades are gone).

Deploy: `supabase functions deploy send-notification`
The app change that sends the user's session token instead of the anon key is
already in `src/App.js` — just push and let Vercel redeploy.

### 3. Deal with the legacy ingest functions

`scheduled-ingest` and `ingest-results` are superseded by the GitHub Actions
pipeline (`scripts/ingest-box-office.mjs` etc.). The cleanest fix is to remove
them so they're not an attack surface at all:

```
supabase functions delete scheduled-ingest
supabase functions delete ingest-results
```

If you want to keep `scheduled-ingest`, it now refuses to run unless the
request carries `X-Cron-Secret` matching a `CRON_SECRET` secret:

```
supabase secrets set CRON_SECRET=$(openssl rand -hex 24)
```

…and add `"X-Cron-Secret":"<value>"` to the `pg_cron` `http_post` headers.

### 4. Check the auth settings

Supabase dashboard → **Authentication → Providers / Settings**:

- **Confirm email** should be **on** — otherwise a bot can register unlimited
  accounts with fake addresses and each one gets a valid `authenticated` token.
- Consider setting **"Allowed email domains"** or turning on **Captcha** for
  sign-up if you get abuse.
- Under **Rate limits**, the defaults are fine for a small trial.

### 5. Remove the distributor widget (optional)

`public/boxd-widget.js` is a "paste one line into your site" embed for
distributors. It's read-only, but the RLS migration cuts off the anon access it
depends on, so it will stop working anyway. Delete `public/boxd-widget.js`
unless you have a specific plan for it.

## What was already fine

- The **service role key** is never in client code or git — only `.env.local`
  (git-ignored) and GitHub Actions secrets.
- The **anon key** and `REACT_APP_TMDB_TOKEN` are in the JS bundle, which is
  expected. With RLS on, a public anon key is safe.
- **No XSS in the app** — no `dangerouslySetInnerHTML` / `eval` / raw
  `innerHTML`; React escapes user text. External links carry
  `rel="noopener noreferrer"`.
- `api_tokens` (Data Thistle) and `film_suggestions` were already locked.
- `letterboxd_url` and `avatar_url` are now validated on save and re-checked on
  render (`src/App.js`).

## Residual risks after all of the above

- **A malicious league member** can still write to any player-owned table in
  *their own* league via the `boxd_is_any_commish()` OR clause isn't the issue —
  the issue is the read-all policy plus the fact that any authenticated user can
  read game state. For a trial with people you know this is acceptable. If you
  open it wider, tighten the player-owned write policies to drop the
  `or boxd_is_any_commish()` clause everywhere except `phase_budgets`, and scope
  reads to league co-members.
- **`send-notification` still uses `onboarding@resend.dev`** (Resend's sandbox
  sender), which only delivers to your own verified address. Notifications to
  other players won't actually arrive until you verify a real domain in Resend.
  When you do, the auth checks above are what keep it from being abused.
- **Sign-up is open.** Anyone can make an account. That's intended, but it means
  "authenticated" ≈ "anyone on the internet" — which is why the RLS scoping
  matters.
- No audit log of commissioner actions. Fine for a trial.
