# Weekly slate-maintenance agent

Run this once a week (Sunday evening / Monday morning). It keeps the BOXD film
slate current: adds newly-dated films and gives every near-term film a real
opening-weekend projection. Everything it produces lands in the in-app
**Commissioner → Suggestions** queue for Matt to approve — it never writes to
`films` directly.

## What to do

1. **Run the scan.** `node scripts/slate-scan.mjs --weeks 16`. It reads the
   `films` table, scrapes the forward calendar, looks up a TMDB id per new
   title, and upserts `film_suggestions` rows (`status = 'pending'`):
   - **kind `new`** — in the calendar within 16 weeks, not in the slate
   - **kind `estimate`** — already in the slate, `est_m` is null, releasing soon

   Rows already proposed once (approved or dismissed) are skipped.

2. **Triage the new-film rows.** For each one that is *not* a genuine US/UK
   theatrical release a player could pick — single-city awards qualifying runs
   with no expansion, concert/event cinema, faith-circuit four-wall bookings,
   foreign-language titles with no US distributor — set its `status` to
   `dismissed` in `film_suggestions` (so it doesn't clutter Matt's queue). Keep
   wide releases and limited releases from A24 / Neon / Focus / Searchlight /
   SPC / MUBI / Netflix / Apple / Amazon MGM with real awards or commercial
   buzz.

3. **Research a projection for every kept row** (both kinds):
   - Search `"<title>" opening weekend box office projection tracking` and
     `<title> tracking Boxoffice Pro`. Prefer a named figure from Boxoffice Pro,
     Deadline, THR, Variety, The Numbers.
   - If there's no tracking yet, derive one from 2–3 named comps (same
     franchise, director, genre, budget tier, release slot).
   - Write the number into the row's `est_m`, put `track` or `gauge` plus a
     one-line justification with the comps into `est_src` / `notes`.
   - Don't trust a single scraped number blindly — cross-check against the comps
     and flag anything that looks off in `notes`.
   - For `kind = new`, also sanity-check `tmdb_id` / `tmdb_title` / `tmdb_year`
     against the real film; fix `tmdb_id` in the row if the match is wrong.

4. **Stop there.** Leave every researched row as `status = 'pending'` with
   `est_m` filled. Matt opens Commissioner → Suggestions, eyeballs each one, and
   taps Approve (which inserts the film / sets the estimate) or Dismiss.

## Guardrails

- Only ever write to `film_suggestions`. Never touch `films`, `results`,
  `film_values`, or any gameplay table.
- Real-world dates and box-office numbers are proposed for review, never
  applied — the approve step is Matt's.
- One scan per run. Don't re-queue rows the scan already skipped.
