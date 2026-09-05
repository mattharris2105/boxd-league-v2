# Weekly slate approval — your runbook

How new films get into BOXD each week, and how you sign off on their prices.

---

## One-time setup

1. **Run the migration.** Apply `supabase/migrations/20260905_film_suggestions.sql`
   (Supabase dashboard → SQL editor, paste, run). This creates the
   `film_suggestions` table the scan writes to and the app reads from.

2. **Add the `TMDB_TOKEN` secret** if it isn't already set (GitHub repo →
   Settings → Secrets and variables → Actions). The scan uses it to attach the
   right poster to each new film. Without it films come in with no poster and
   you set it later in the Films tab. `SUPABASE_SERVICE_KEY` is already there.

3. *(Optional)* To have the opening-weekend projections researched for you
   instead of doing it by hand: in Claude Code run `/schedule`, weekly, prompt
   `Follow agents/weekly-slate.md for the boxd-league-v2 repo`.

---

## What happens automatically

- **Every Sunday ~07:17 UTC** the *Weekly slate scan* Action runs.
- It compares the theatrical release calendar against the films already in the
  database and inserts rows into `film_suggestions` with `status = 'pending'`:
  - **new films** — wide releases + buzzy limited releases in the next 16 weeks
    that aren't in the slate (with a looked-up TMDB id for the poster)
  - **missing projections** — films already in the slate with no `est_m`
- A row that's already been proposed once (approved *or* dismissed) is never
  re-queued.
- **No writes to `films`.** Nothing is visible to players.

---

## Your job each week (~10 min, all in the app)

Open **Commissioner → Suggestions** (the tab shows a count when there's
anything pending).

Each card shows the title, release date, distributor, the poster it will use
(with a ⚠ if the matched TMDB film's year looks off), and the tracking links.

Per card:

- **Don't want it** (event cinema, single-city awards run, wrong film) → tap
  **Dismiss**. It won't come back.
- **Want it** → type an **opening-weekend estimate ($M)** in the *Est opening*
  box, pick a **Genre** (new films only), then tap **Approve**. The card shows
  the IPO price your estimate produces before you commit.

**Approve does everything:** for a new film it inserts it into `films` with the
right phase/week/poster and the derived price, and it's live for players
immediately. For a missing projection it just sets `est_m` and re-prices that
film. The suggestion is marked approved and drops off the list.

---

## How prices are set — you approve the estimate, not the price

`base_price` is derived from the estimate you approve, via `calcIPOprice`,
clamped **$7M–$105M**:

| est_m (opening $M) | IPO price |
|---|---|
| 1  | $7M |
| 3  | $9M |
| 5  | $11M |
| 10 | $14M |
| 15 | $18M |
| 20 | $21M |
| 30 | $27M |
| 40 | $33M |
| 50 | $39M |
| 75 | $53M |
| 100 | $66M |
| 120 | $77M |
| 150 | $92M |
| 175 | $104M |
| 200+ | $105M (ceiling) |

If a price looks wrong, change the estimate. To set a price by hand for one
film, approve it then edit `base_price` directly in the **Films** tab.

The estimate itself is your judgement. The tracking links on each card
(Boxoffice Pro / Deadline / The Numbers searches) are a starting point — box
office numbers for unreleased films are soft, which is the whole reason this is
an approval step and not an automatic import.

---

## Fixing a wrong poster

A film's poster comes from its **TMDB id**. A film with no id falls back to a
title search and can grab the wrong (usually older) movie — that's where wrong
posters come from.

**Commissioner → Films → tap the film → "Poster (TMDB id)"**:
- tap **🔍 Find** to search TMDB by the film's title + release year, then click
  the correct poster thumbnail, or
- paste the id straight from `themoviedb.org/movie/<id>` and **Save Changes**.

The poster corrects immediately. New films from the weekly scan already come
with an id attached, so this is mostly for the existing back-catalogue.

---

## Where nothing moves without you

- The scan is **read-only** on `films`; it only writes to `film_suggestions`.
- New films and prices reach players **only when you tap Approve**.
- Weekend box-office results are a **separate** automated job (the Monday
  *Weekly box-office ingest* Action) and don't touch pricing setup.
