// Shared scoring logic — extracted from src/App.js so the simulation script
// (scripts/simulate-season.mjs) can score exactly like the live app does.
// CommonJS so both webpack (browser) and Node can load it without a build step.
//
// Design (rebalanced after simulation showed raw-dollar scoring let "buy the
// biggest films you can afford" beat "spot the sleepers" by ~42x):
//   - opening points are 70% "how much you beat the forecast" + 30% "how big
//     the hit was" — box office is the driver, forecast skill the main lever
//   - weekly points reward LEGS (post-opening multiplier), not raw weekly $
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
function calcOpeningPts (film, actualM, isEB = false, isAnalyst = false) {
  if (actualM == null || !film.estM) return 0
  const r = actualM / film.estM
  const rt = rtMult(film.rt)
  // 70% forecast-beat (ratio, capped at 3x so a micro-film can't run away),
  // 30% raw scale (sqrt-damped so a 180x gross gap is only a ~13x points gap)
  const ratioPart = 130 * Math.min(3, r) * rt
  const scalePart = Math.sqrt(actualM) * 10 * perfMult(r) * rt
  let pts = Math.round(0.7 * ratioPart + 0.3 * scalePart)
  if (isEB && r >= 1.1) pts = Math.round(pts * 1.1)
  if (isAnalyst) pts += 60
  return pts
}

// Legs points — the post-opening multiplier (how many extra opening-weekends'
// worth of box office the film earned after its debut), not raw weekly $.
// A leggy word-of-mouth hit earns 1.5-2.5x its opening in later weeks; a
// front-loaded blockbuster earns ~0.3-0.5x.
//   weekMap: { 2: $M, 3: $M, ... }   openingM: opening weekend gross ($M)
function calcWeeklyPts (weekMap, openingM) {
  if (!openingM || openingM <= 0) return 0
  let post = 0
  for (let w = 2; w <= 6; w++) { const v = Number(weekMap?.[w]); if (v > 0) post += v }
  if (post <= 0) return 0
  return Math.round(60 * Math.min(2.5, post / openingM))
}

// Flat +25 if the week-2 drop from opening is under 30% (strong word of mouth).
// Already ratio-based — unchanged.
function calcLegsBonus (actualM, week2Gross) {
  return (actualM != null && week2Gross != null && (actualM - week2Gross) / actualM < 0.3) ? 25 : 0
}

module.exports = { calcOpeningPts, calcLegsBonus, calcWeeklyPts, rtMult, perfMult }
