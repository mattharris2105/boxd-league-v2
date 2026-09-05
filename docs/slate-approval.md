# Weekly slate approval — your runbook

How new films get into BOXD each week, and how you sign off on their prices.

---

## One-time setup

1. **Let the Action open PRs.** GitHub repo → **Settings → Actions → General →
   Workflow permissions**:
   - select **Read and write permissions**
   - tick **Allow GitHub Actions to create and approve pull requests**
   - Save.
   (Without this the weekly scan runs but can't open the PR.)

2. **Nothing else.** It reuses the `SUPABASE_SERVICE_KEY` secret that's already
   set. No new keys.

3. *(Optional)* If you want the opening-weekend projections researched for you
   instead of doing it by hand: in Claude Code run `/schedule`, weekly, with the
   prompt `Follow agents/weekly-slate.md for the boxd-league-v2 repo`.

---

## What happens automatically

- **Every Sunday ~07:17 UTC** the *Weekly slate scan* Action runs.
- It compares the theatrical release calendar against the films already in the
  database and opens (or updates) a pull request titled **"Weekly slate
  proposal"**.
- The PR contains one file: `proposals/slate-<date>.md` with two tables —
  1. **New films to add** (wide releases + buzzy limited releases in the next 16
     weeks that aren't in the slate)
  2. **Slate films still missing a projection**
- **No database writes happen.** Nothing is live until you act.

---

## Your job each week (~10 min)

### Step 1 — open the PR and read the file

Each candidate row looks like:

| Release | Title | Distributor | Type | est_m | Research |
|---|---|---|---|---|---|
| 2026-11-06 | Dr. Seuss' The Cat in the Hat | Warner Bros. | Wide | _?_ | [tracking] · [TN] |

### Step 2 — decide, per row

- **Don't want it** (event cinema, single-city awards run, wrong film) → delete
  the row.
- **Want it** → replace `_?_` with an **opening-weekend estimate in $M**. Click
  the *tracking* link for a real number; if there's none yet, pick one from
  comparable films and move on. This is the number the whole economy keys off,
  so it's the thing you're really approving.

### Step 3 — approve the price

You don't type a price. `base_price` is derived from your `est_m` by the shared
`calcIPOprice` formula, clamped to **$7M–$105M**. Use this table to sanity-check
what your estimate will produce:

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

If a resulting price looks wrong, the fix is to adjust `est_m`, not to override
the price. If you genuinely want a manual price for one film, say so in the PR
and it'll be set directly.

### Step 4 — apply

Two ways:

- **Hand it to Claude** — comment on the PR or start a session: *"apply the
  slate proposal in this PR."* It inserts the new films, sets `est_m` +
  `base_price`, recomputes each film's week/phase, runs the tests and the build,
  and pushes. You just merge.
- **Do it yourself** — follow the "How to apply the approved rows" checklist at
  the bottom of the proposal file.

### Step 5 — if there's nothing to add

Close the PR without merging. Next Sunday's run opens a fresh one.

---

## Where money never moves without you

- The scan is **read-only** on the database.
- New films and prices reach players **only after you merge**.
- Weekend box-office results are a **separate** automated job (the Monday
  *Weekly box-office ingest* Action) and don't touch film pricing setup.
