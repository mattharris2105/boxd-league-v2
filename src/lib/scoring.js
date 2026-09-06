// Shared scoring logic — extracted from src/App.js so the simulation script
// (scripts/simulate-season.mjs) can score exactly like the live app does.
// CommonJS so both webpack (browser) and Node can load it without a build step.
//
// Design (rebalanced twice: first after raw-dollar scoring let "buy the biggest
// films you can afford" beat "spot the sleepers" by ~42x; then again after an
// archive backtest showed a 70/30 ratio/scale blend made six cheap films the
// dominant build — beating a small estimate 3x is common, beating a $150M one
// 3x never happens):
//   - opening points are a 50/50 blend of "how much you beat the forecast" and
//     "how big the hit was" — forecast skill still matters, but a genuine
//     blockbuster is no longer a trap
//   - a FLOP (opens below 60% of its estimate) is a flat -40: cheap lottery
//     tickets now carry real downside, not just upside-or-zero
//   - LEGS points score week-over-week hold: each weekend 2..6 is compared to a
//     standard decay for a film that age, and the film earns points for
//     dropping LESS than standard. Budget-neutral (a -38% hold is a -38% hold
//     at any opening size) and you know most of it one week after release.
//   - Rotten Tomatoes is a light ±15% / -10% modifier, a bonus not a driver

// RT multiplier — six bands, gentle. 60 is RT's own Fresh line, so it's the
// neutral point. Max swing ~1.28x, vs ~4x for the box-office side.
function rtMult (rt) {
  if (rt == null) return 1
  return rt >= 90 ? 1.15 : rt >= 80 ? 1.10 : rt >= 70 ? 1.05 : rt >= 60 ? 1.00 : rt >= 50 ? 0.95 : 0.90
}
function perfMult (r) {
  return r >= 2 ? 2 : r >= 1.5 ? 1.6 : r >= 1.3 ? 1.35 : r >= 1.1 ? 1.15 : r >= 0.95 ? 1 : r >= 0.8 ? 0.85 : r >= 0.6 ? 0.65 : 0.45
}

// Opening-weekend points.
//   film: { estM, rt }
//   actualM: opening weekend gross ($M), or null -> 0
//   isEB / isAnalyst: Early Bird (+10% if the film also beat estimate) / Analyst chip (+60 flat)
const FLOP_RATIO = 0.6
const FLOP_PENALTY = -40

// How far over its estimate a film's forecast-beat is allowed to count, scaled
// to the film's size: a tiny film (est ~$2M) caps at ~2.7x so a lucky multiple
// can't run away; a real $18M+ release caps at 4x so a genuine breakout
// (Backrooms-style) actually shows in the score. Continuous, no cliffs.
function ratioCap (estM) {
  return Math.max(2.5, Math.min(4, 2.5 + estM / 12))
}

function calcOpeningPts (film, actualM, isEB = false, isAnalyst = false) {
  if (actualM == null || !film.estM) return 0
  const r = actualM / film.estM
  // Flop: opened below 60% of estimate — a straight loss, no legs credit,
  // no bonuses. Backing six cheap films means six ways to lose points.
  if (r < FLOP_RATIO) return FLOP_PENALTY
  const rt = rtMult(film.rt)
  // 50% forecast-beat (ratio, capped by ratioCap so a micro-film can't run
  // away), 50% raw scale (sqrt-damped so a 180x gross gap is a ~13x points gap)
  const ratioPart = 130 * Math.min(ratioCap(film.estM), r) * rt
  const scalePart = Math.sqrt(actualM) * 10 * perfMult(r) * rt
  let pts = Math.round(0.5 * ratioPart + 0.5 * scalePart)
  if (isEB && r >= 1.1) pts = Math.round(pts * 1.1)
  if (isAnalyst) pts += 60
  return pts
}

// Legs points — week-over-week hold vs a standard decay.
// For each weekend 2..6 we compare the film's real drop from the previous
// weekend to a "standard" drop for a film that age. Hold better than standard
// and that weekend earns points; drop harder and it earns nothing (legs are
// upside-only — a hard fall is already punished by the opening score).
// The later weekends carry less weight (less signal, less data). Everything is
// scaled down for a film that barely opened, so a $0.3M -> $0.25M "great hold"
// can't be farmed.
//   weekMap: { 2: $M, 3: $M, ... 6: $M }   openingM: opening weekend gross ($M)
const LEGS_STD  = { 2: -0.50, 3: -0.42, 4: -0.36, 5: -0.34, 6: -0.34 } // typical drop
const LEGS_SENS = { 2: 230,   3: 130,   4: 100,   5: 70,    6: 70 }    // pts per 1.0 of "held better"
const LEGS_CAP  = { 2: 45,    3: 26,    4: 18,    5: 11,    6: 11 }    // max pts that weekend (~111 total)
const LEGS_FULL_OPEN = 8 // $M — at/above this the opening-size scaler is 1.0

function calcWeeklyPts (weekMap, openingM) {
  if (!openingM || openingM <= 0) return 0
  let pts = 0, any = false
  for (let w = 2; w <= 6; w++) {
    const cur = Number(weekMap && weekMap[w])
    const prev = w === 2 ? openingM : Number(weekMap && weekMap[w - 1])
    if (!(cur > 0) || !(prev > 0)) continue
    any = true
    const drop = (cur - prev) / prev            // negative = fell
    const delta = drop - LEGS_STD[w]            // positive = held better than standard
    if (delta <= 0) continue                    // worse than standard → 0 for this weekend
    pts += Math.min(LEGS_CAP[w], Math.round(delta * LEGS_SENS[w]))
  }
  if (!any) return 0
  const scale = Math.min(1, openingM / LEGS_FULL_OPEN)
  return Math.round(pts * scale)
}

// True when a film opened below 60% of its estimate. A flop scores a flat -40
// for the whole film — callers should skip legs / hold-bonus when this is true.
function isFlop (film, actualM) {
  return actualM != null && !!film.estM && actualM / film.estM < FLOP_RATIO
}

// Pre-Oct-2026 legs formula (post-opening cumulative multiple). Kept only so
// scripts/mock-draft.mjs can show the current-vs-proposed comparison.
function calcWeeklyPtsCumulative (weekMap, openingM) {
  if (!openingM || openingM <= 0) return 0
  let post = 0
  for (let w = 2; w <= 6; w++) { const v = Number(weekMap && weekMap[w]); if (v > 0) post += v }
  if (post <= 0) return 0
  return Math.round(60 * Math.min(2.5, post / openingM))
}

module.exports = { calcOpeningPts, calcWeeklyPts, calcWeeklyPtsCumulative, rtMult, perfMult, isFlop, FLOP_PENALTY }
