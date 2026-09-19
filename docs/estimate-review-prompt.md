# External estimate-review prompt (Gemini / ChatGPT)

Paste the block below, then attach `boxd-films-review-2026-09-08.csv`.

Key facts it must not get wrong:
- `est_m` and `result actual_m` are both **US domestic opening weekend (3-day), $M**.
- The archive is a **deliberately inflated sandbox** — real-world opening
  records are not the ceiling. Spider-Man 175 -> 360 and Backrooms 20 -> 81
  (domestic openings) are correct, not errors.
- Calibrate on `result actual_m` only. `live price ($M)` and both IPO columns
  carry no box-office information.

---

You are a box-office analyst. I run a fantasy box-office league built on a slate
of 2026 films. Attached is a CSV of every film in it. I want your independent
view on the **domestic opening-weekend estimate** for each upcoming film versus
the estimate I already have.

## The one number that matters

`est_m (box office projection $M)` is my projected **US/Canada domestic
opening weekend (3-day) gross**, in $M. It is the only input to the film's
in-game price, so getting it right is the whole game. Your task is to produce
your own domestic opening-weekend projection per film and tell me where mine is
off.

## Column rules — do not substitute columns

| Column | Use |
|---|---|
| `phase` | `Historical` = already released (has a real result). `Phase 1/2/3` = upcoming. |
| `release_date`, `week` | Release date / game-week. |
| `rt` | Rotten Tomatoes score, blank until reviewed. |
| **`est_m (box office projection $M)`** | The estimate you are checking. Domestic 3-day opening, $M. |
| **`result actual_m ($M)`** | The ONLY actual result. Real domestic 3-day opening. Historical rows only. |
| `IPO base_price`, `IPO implied by est` | Ignore. Just `f(est_m)`. |
| `live price ($M)` | Ignore. Compressed in-game resale price (clamped 0.15x-4x of IPO), NOT a gross. Never use as the result. |

## This universe runs hotter than the real world

The archive box office is inflated on purpose. Real-world all-time opening
records (~$357M) are NOT the ceiling here. Spider-Man: Brand New Day (est 175 ->
actual 360) and Backrooms (est 20 -> actual 81) are **correct domestic
openings**, not data errors. So:

- Do not call an estimate "too high" just because it would beat a real-world
  record. In this universe it may be right.
- Instead, infer this dataset's scale from its own history.

## Step 1 — calibrate on the Historical rows

Using `est_m` vs `result actual_m` only:
- Fit the relationship. How much higher (or lower) do openings land here vs what
  you'd expect in the real world — and does that inflation differ by tier? Look
  at sub-$20M / $20-60M / $60M+ separately, and franchise vs original.
- Count: within +/-25%, over-estimated (actual >25% below est), under-estimated
  (actual >25% above est). Mean absolute % error.
- Tell me where my estimates go wrong and in which direction — real bias or just
  noise.

## Step 2 — your view on every upcoming film

For all Phase 1/2/3 films give: **too low / about right / too high / no strong
view**, plus your own domestic opening figure or a tight range, and the closest
real comps (adjusted up to this universe's scale using Step 1). Factor in
distributor, franchise/IP, cast, genre, release date and direct competition.
Never leave a film blank and never copy my `est_m` across as a placeholder — if
you have no view, say "no strong view".

## Step 3 — biggest misses

The 15-20 upcoming films with the largest gap (absolute $ and %) between my
`est_m` and yours, most wrong first.

## Output

One table, sorted by phase then release date:

`title | my est_m | your est_m (or range) | verdict | confidence (H/M/L) | key comps + one-line rationale`

Then: **"Scale I inferred"** (Step 1), **"Where my estimates are biased"**,
**"Top misses to fix first"**.

Be blunt. One word for the ones that are fine; detail only on the wrong ones.
