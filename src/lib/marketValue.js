// Shared valuation logic — the single source of truth for BOXD market values.
// Imported by src/App.js (browser, via webpack) and scripts/ingest-box-office.mjs
// (Node). CommonJS so both consumers can load it without a build step.
//
// If you change the formula here, that's the only place it needs to change.

// IPO / base price from a pre-release opening-weekend estimate ($M).
// Steepened (was exponent 0.78, ceiling 75) so blockbusters eat a real share
// of the budget instead of ~40% of it — simulation showed the old curve let
// a single roster hold 3 tentpoles at once with room to spare. Now:
// ~$3 at est $2M, ~$4 at $5, ~$16 at $15, ~$36 at $50, ~$110 at $175.
function calcIPOprice (est) {
  if (est == null || isNaN(est)) return null
  if (est <= 0) return 3
  return Math.max(3, Math.min(130, Math.round(1.05 * Math.pow(est, 0.94))))
}

// Market value after results land.
//   film: { basePrice, estM, rt }
//   actualM: opening weekend gross ($M), or null (returns basePrice)
//   weeklyGrosses: { 2: $M, 3: $M, ... 6: $M } for the legs adjustment
function calcMarketValue (film, actualM, weeklyGrosses = {}) {
  if (actualM == null) return film.basePrice
  const r = film.estM ? actualM / film.estM : 1
  // Opening performance multiplier
  const perf = r >= 2 ? 2 : r >= 1.5 ? 1.6 : r >= 1.3 ? 1.35 : r >= 1.1 ? 1.15 : r >= 0.95 ? 1 : r >= 0.8 ? 0.85 : r >= 0.6 ? 0.65 : r >= 0.4 ? 0.45 : 0.25
  // Critics multiplier
  const rt = film.rt != null ? (film.rt >= 90 ? 1.15 : film.rt >= 75 ? 1.08 : film.rt < 50 ? 0.9 : 1) : 1

  // ── LEGS: week-on-week hold vs an expected drop ──────────────────────────
  //   Wk2: standard -55% · better → up to +30% · worse → down to -15%
  //   Wk3: standard -40% · better → up to +20% · worse → down to -10%
  //   Wk4: standard -35% · better → up to +15% · worse → down to  -5%
  //   Wk5/6: standard -40% · better → up to +10% · worse → flat (0%)
  const BANDS = {
    2: { std: -0.55, up: 0.30, down: -0.15 },
    3: { std: -0.40, up: 0.20, down: -0.10 },
    4: { std: -0.35, up: 0.15, down: -0.05 },
    5: { std: -0.40, up: 0.10, down: 0 },
    6: { std: -0.40, up: 0.10, down: 0 },
  }
  const wg = weeklyGrosses || {}
  let legsMult = 1
  for (let w = 2; w <= 6; w++) {
    const cur = Number(wg[w]), prev = w === 2 ? actualM : Number(wg[w - 1])
    if (!cur || !prev || isNaN(cur) || isNaN(prev)) continue
    const drop = (cur - prev) / prev
    const band = BANDS[w]
    let adj
    if (drop >= band.std) {
      const range = 0 - band.std
      const frac = range > 0 ? Math.min(1, (drop - band.std) / range) : 0
      adj = band.up * frac
    } else {
      const range = band.std - (-1)
      const frac = range > 0 ? Math.min(1, (band.std - drop) / range) : 0
      adj = band.down * frac
    }
    legsMult *= (1 + adj)
  }

  const raw = film.basePrice * perf * rt * legsMult
  return Math.round(Math.max(film.basePrice * 0.15, Math.min(film.basePrice * 4, raw)))
}

module.exports = { calcIPOprice, calcMarketValue }
