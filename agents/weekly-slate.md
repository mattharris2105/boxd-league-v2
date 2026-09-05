# Weekly slate-maintenance agent

Run this once a week (Sunday evening / Monday morning). It keeps the BOXD film
slate current: adds newly-dated films and gives every near-term film a real
opening-weekend projection.

## What to do

1. **Pull the diff.** Run `node scripts/slate-scan.mjs --weeks 16`. It reads the
   `films` table, scrapes the forward calendar, and writes
   `proposals/slate-<today>.md` with two tables:
   - **New films to add** — in the calendar within 16 weeks, not in the slate.
   - **Slate films still missing a projection** — already added, `est_m` is null,
     release is inside the window.

2. **Triage the new-film list.** Drop anything that is not a genuine US/UK
   theatrical release a player could reasonably pick: single-city awards
   qualifying runs with no expansion, concert/event cinema, faith-circuit
   four-wall bookings, foreign-language titles with no US distributor. Keep wide
   releases and limited releases from A24 / Neon / Focus / Searchlight / SPC /
   MUBI / Netflix / Apple / Amazon MGM with real awards or commercial buzz.

3. **Research a projection for every kept film** (new *and* the "missing a
   projection" list):
   - Search `"<title>" opening weekend box office projection tracking` and
     `<title> tracking Boxoffice Pro`. Prefer a named tracking figure from
     Boxoffice Pro, Deadline, THR, Variety, The Numbers.
   - If there is no tracking yet, pick a number from 2–3 named comps (same
     franchise, director, genre, budget tier, release slot) and say so.
   - Record `est_m` ($M, domestic opening weekend), a `src` of `track` or
     `gauge`, and a one-line justification with the comps.
   - Do **not** trust a single scraped number blindly — cross-check it against
     the comps and flag anything that looks off.

4. **Fill in the proposal file.** Replace each `_?_` with the number. For new
   films also confirm distributor, release type, exact date, and add a `genre`.

5. **Open a PR** with the completed `proposals/slate-<today>.md`. Do **not**
   write to the database. Matt reviews the PR.

## Applying an approved proposal (after Matt says go)

For each row in the merged proposal:

- **New film** → `INSERT` into `films`: `title`, `dist`, `genre`, `est_m`,
  `release_date`, `base_price = calcIPOprice(est_m)` (from
  `src/lib/marketValue.js`), `active = true`. Then
  `node scripts/recompute-week-phase.mjs --commit` to set `week` / `phase`.
- **Existing film** → `PATCH films?id=eq.<id>` with `est_m` and the new
  `base_price`.

Then `node scripts/marketValue.test.mjs` and `npm run build` before pushing.

## Guardrails

- Read-only on Supabase until Matt approves the proposal.
- Real-world dates and box-office numbers are always proposed in the table
  first, never applied directly from the web.
- One proposal file per run, named by date; don't overwrite last week's.
