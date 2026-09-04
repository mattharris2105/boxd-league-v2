// Mock season trial run — drafts several strategies against the ALREADY-
// SETTLED archive (real historical box office, real prices) and scores them
// with the exact same formulas the live app uses, to sanity-check whether
// the budget/pricing/scoring economy is balanced. Read-only: makes no writes
// to Supabase, touches no real league.
//
//   node scripts/simulate-season.mjs
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calcOpeningPts, calcLegsBonus, calcWeeklyPts } from '../src/lib/scoring.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

// live-game constants (src/App.js)
const BUDGET = 150       // PHASE_BUDGETS[1]
const MAX_ROSTER = 6

const g = async (path) => (await fetch(`${U}/rest/v1/${path}`, { headers: H })).json()
const [films, results, wg] = await Promise.all([
  g('films?select=id,title,phase,base_price,est_m,rt&phase=eq.0'),
  g('results?select=film_id,actual_m'),
  g('weekly_grosses?select=film_id,week_num,gross_m'),
])
const resMap = Object.fromEntries(results.map((r) => [r.film_id, r.actual_m]))
const wgMap = {}
wg.forEach((w) => { (wgMap[w.film_id] = wgMap[w.film_id] || {})[w.week_num] = w.gross_m })

// the tradeable pool: settled archive films with a real price and a real result
const pool = films
  .filter((f) => f.base_price != null && f.est_m != null && resMap[f.id] != null)
  .map((f) => {
    const actual = resMap[f.id]
    const weekly = wgMap[f.id] || {}
    const openPts = calcOpeningPts({ estM: f.est_m, rt: f.rt }, actual)
    const wkPts = Math.round(calcWeeklyPts(weekly))
    const legs = calcLegsBonus(actual, weekly[2])
    return { ...f, actual, score: openPts + wkPts + legs, openPts, wkPts, legs, roi: actual / f.est_m }
  })

console.log(`Pool: ${pool.length} settled films, prices $${Math.min(...pool.map((f) => f.base_price))}M-$${Math.max(...pool.map((f) => f.base_price))}M, budget $${BUDGET}M, roster cap ${MAX_ROSTER}\n`)

// greedy knapsack-style draft under budget + roster-cap constraints
function draft (sorted) {
  const roster = []
  let spend = 0
  for (const f of sorted) {
    if (roster.length >= MAX_ROSTER) break
    if (spend + f.base_price > BUDGET) continue
    roster.push(f); spend += f.base_price
  }
  return { roster, spend, total: roster.reduce((s, f) => s + f.score, 0) }
}

const strategies = {
  'Blockbuster Chaser (priciest first)': [...pool].sort((a, b) => b.base_price - a.base_price),
  'Value Hunter (cheapest first, max diversification)': [...pool].sort((a, b) => a.base_price - b.base_price),
  'Sleeper Spotter (best RT per $ spent)': [...pool].filter((f) => f.rt != null).sort((a, b) => (b.rt / b.base_price) - (a.rt / a.base_price)),
  'Random Basket (control)': [...pool].sort(() => Math.random() - 0.5),
  'Perfect Hindsight (actual best scorers)': [...pool].sort((a, b) => (b.score / b.base_price) - (a.score / a.base_price)),
}

const outcomes = []
for (const [name, sorted] of Object.entries(strategies)) {
  const { roster, spend, total } = draft(sorted)
  outcomes.push({ name, roster, spend, total })
  console.log(`── ${name} ──`)
  console.log(`   spend $${spend}M/$${BUDGET}M · ${roster.length}/${MAX_ROSTER} films · TOTAL ${total}pts`)
  roster.forEach((f) => console.log(`   ${String(f.score).padStart(4)}pts  $${f.base_price}M -> $${f.actual}M (${f.roi.toFixed(2)}x)  ${f.title}`))
  console.log()
}

// ── insights ──────────────────────────────────────────────────────────────
console.log('═══ INSIGHTS ═══')
outcomes.sort((a, b) => b.total - a.total)
console.log(`Spread: best ${outcomes[0].name} (${outcomes[0].total}pts) vs worst ${outcomes[outcomes.length - 1].name} (${outcomes[outcomes.length - 1].total}pts) — ${outcomes[0].total - outcomes[outcomes.length - 1].total}pt gap`)

const cheapWins = pool.filter((f) => f.base_price <= 5 && f.score >= 80).sort((a, b) => b.score - a.score)
console.log(`\nCheap films (<=$5M) that scored 80+pts anyway (the "sleeper" pattern the howto text promises): ${cheapWins.length}`)
cheapWins.slice(0, 5).forEach((f) => console.log(`   $${f.base_price}M -> ${f.score}pts  RT ${f.rt ?? '?'}%  ${f.title}`))

const expensiveFlops = pool.filter((f) => f.base_price >= 20 && f.roi < 0.8).sort((a, b) => a.roi - b.roi)
console.log(`\nExpensive films (>=$20M) that missed estimate badly (roi<0.8x): ${expensiveFlops.length}`)
expensiveFlops.slice(0, 5).forEach((f) => console.log(`   $${f.base_price}M est, ${(f.roi * 100).toFixed(0)}% of estimate, ${f.score}pts  ${f.title}`))

const avgPtsPerDollar = pool.map((f) => f.score / f.base_price)
const corr = (() => {
  const xs = pool.map((f) => f.base_price), ys = pool.map((f) => f.score)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0)), sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0))
  return cov / (sx * sy)
})()
console.log(`\nCorrelation between IPO price and points scored: ${corr.toFixed(2)} (1.0 = price fully predicts score, 0 = no relationship, negative = cheap films outscore expensive ones)`)
console.log(`Avg points-per-dollar-spent across the whole pool: ${(avgPtsPerDollar.reduce((a, b) => a + b, 0) / avgPtsPerDollar.length).toFixed(1)}`)
