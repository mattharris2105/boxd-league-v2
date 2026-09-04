// Shared scoring logic — extracted from src/App.js so the simulation script
// (scripts/simulate-season.mjs) can score exactly like the live app does.
// CommonJS so both webpack (browser) and Node can load it without a build step.

// Opening-weekend points: performance-vs-estimate multiplier x critics
// multiplier, rounded, then Early Bird (+10%) and/or Analyst chip (+60 flat).
function calcOpeningPts (film, actualM, isEB = false, isAnalyst = false) {
  if (actualM == null) return 0
  const r = actualM / film.estM
  const perf = r >= 2 ? 2 : r >= 1.5 ? 1.6 : r >= 1.3 ? 1.35 : r >= 1.1 ? 1.15 : r >= 0.95 ? 1 : r >= 0.8 ? 0.85 : r >= 0.6 ? 0.65 : 0.45
  const rt = film.rt != null ? (film.rt >= 90 ? 1.25 : film.rt >= 75 ? 1.1 : film.rt < 50 ? 0.85 : 1) : 1
  let pts = Math.round(actualM * perf * rt)
  if (isEB && r >= 1.1) pts = Math.round(pts * 1.1)
  if (isAnalyst) pts += 60
  return pts
}
// Flat +25 if the week-2 drop from opening is under 30% (strong word of mouth).
function calcLegsBonus (actualM, week2Gross) {
  return (actualM != null && week2Gross != null && (actualM - week2Gross) / actualM < 0.3) ? 25 : 0
}
// Weekly gross points: 1pt/$1M for weeks 1-3, 1.1pts/$1M from week 4 on.
function calcWeeklyPts (weekMap) {
  return Object.entries(weekMap).reduce((s, [wk, g]) => s + Number(g) * (Number(wk) >= 4 ? 1.1 : 1), 0)
}

module.exports = { calcOpeningPts, calcLegsBonus, calcWeeklyPts }
