// Mock season trial run — drafts several strategies against the ALREADY-
// SETTLED archive (real historical box office) using the LIVE production
// formulas (src/lib/marketValue.js + src/lib/scoring.js) and the real draft
// rules (DRAFT_MIN/DRAFT_PENALTY as a soft shortfall penalty, exactly how the
// app enforces it — not a hard budget gate), to sanity-check the economy.
// Read-only: makes no writes to Supabase, touches no real league.
//
//   node scripts/simulate-season.mjs           # current live rules
//   node scripts/simulate-season.mjs --old     # also show the pre-rebalance rules for comparison
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calcIPOprice } from '../src/lib/marketValue.js'
import { calcOpeningPts, calcLegsBonus, calcWeeklyPts } from '../src/lib/scoring.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const BUDGET = 150, MAX_ROSTER = 6, DRAFT_MIN = 6, DRAFT_PENALTY = 5 // mirrors src/App.js

const g = async (path) => (await fetch(`${U}/rest/v1/${path}`, { headers: H })).json()
const [films, results, wg] = await Promise.all([
  g('films?select=id,title,phase,est_m,rt&phase=eq.0'),
  g('results?select=film_id,actual_m'),
  g('weekly_grosses?select=film_id,week_num,gross_m'),
])
const resMap = Object.fromEntries(results.map((r) => [r.film_id, r.actual_m]))
const wgMap = {}
wg.forEach((w) => { (wgMap[w.film_id] = wgMap[w.film_id] || {})[w.week_num] = w.gross_m })
const settled = films.filter((f) => f.est_m != null && resMap[f.id] != null)

// pre-rebalance formulas, kept only for the --old comparison
const OLD_IPO = (est) => Math.max(3, Math.min(75, Math.round(1.05 * Math.pow(est, 0.78))))
const OLD_PTS = (est, actual, rt, r) => {
  const perf = r >= 2 ? 2 : r >= 1.5 ? 1.6 : r >= 1.3 ? 1.35 : r >= 1.1 ? 1.15 : r >= 0.95 ? 1 : r >= 0.8 ? 0.85 : r >= 0.6 ? 0.65 : 0.45
  const rtm = rt != null ? (rt >= 90 ? 1.25 : rt >= 75 ? 1.1 : rt < 50 ? 0.85 : 1) : 1
  return Math.round(actual * perf * rtm)
}

function buildPool (ipoFn, useLiveScoring) {
  return settled.map((f) => {
    const price = ipoFn(f.est_m)
    const actual = resMap[f.id]
    const weekly = wgMap[f.id] || {}
    const openPts = useLiveScoring ? calcOpeningPts({ estM: f.est_m, rt: f.rt }, actual) : OLD_PTS(f.est_m, actual, f.rt, actual / f.est_m)
    const wkPts = Math.round(calcWeeklyPts(weekly))
    const legs = calcLegsBonus(actual, weekly[2])
    return { ...f, price, actual, roi: actual / f.est_m, score: openPts + wkPts + legs }
  })
}

// real app mechanic: greedy under budget, THEN a flat shortfall penalty if
// the roster ends up under DRAFT_MIN — a soft cost, not a hard block, exactly
// as draftShortfall/DRAFT_PENALTY work live.
function draft (sorted) {
  const roster = []; let spend = 0
  for (const f of sorted) {
    if (roster.length >= MAX_ROSTER) break
    if (spend + f.price > BUDGET) continue
    roster.push(f); spend += f.price
  }
  const penalty = Math.max(0, DRAFT_MIN - roster.length) * DRAFT_PENALTY
  const total = roster.reduce((s, f) => s + f.score, 0) - penalty
  return { roster, spend, total, penalty }
}

function strategySorts (pool) {
  return {
    'Blockbuster Chaser': [...pool].sort((a, b) => b.price - a.price),
    'Value Hunter (cheap, diversified)': [...pool].sort((a, b) => a.price - b.price),
    'Sleeper Spotter (RT per $)': [...pool].filter((f) => f.rt != null).sort((a, b) => (b.rt / b.price) - (a.rt / a.price)),
    'Random control': [...pool].sort(() => Math.random() - 0.5),
    'Perfect Hindsight (best score/$)': [...pool].sort((a, b) => (b.score / b.price) - (a.score / a.price)),
  }
}

function runRuleset (label, ipoFn, useLiveScoring) {
  const pool = buildPool(ipoFn, useLiveScoring)
  console.log(`\n███ ${label} ███  prices $${Math.min(...pool.map((f) => f.price))}-$${Math.max(...pool.map((f) => f.price))}M · budget $${BUDGET}M · ${MAX_ROSTER} films required (shortfall costs ${DRAFT_PENALTY}pt/missing film)`)
  const rows = []
  for (const [name, sorted] of Object.entries(strategySorts(pool))) {
    const { roster, spend, total, penalty } = draft(sorted)
    rows.push({ name, total })
    console.log(`  ${name.padEnd(34)} $${String(spend).padStart(3)}M spent · ${roster.length}/${MAX_ROSTER} films${penalty ? ` (-${penalty} shortfall)` : ''} · ${total}pts   [top: ${roster[0]?.title} $${roster[0]?.price}M -> ${roster[0]?.score}pts]`)
  }
  const best = Math.max(...rows.map((r) => r.total)), worst = Math.min(...rows.map((r) => r.total))
  console.log(`  spread: best/worst = ${(best / Math.max(1, worst)).toFixed(1)}x`)
  const xs = pool.map((f) => f.price), ys = pool.map((f) => f.score)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0)), sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0))
  console.log(`  price/score correlation: ${(cov / (sx * sy)).toFixed(2)}`)
  const cheapPool = pool.filter((f) => f.price <= 5)
  console.log(`  cheap films (<=$5M) scoring 80+pts: ${cheapPool.filter((f) => f.score >= 80).length}/${cheapPool.length}`)
}

if (process.argv.includes('--old')) runRuleset('OLD RULES (pre-rebalance, for comparison)', OLD_IPO, false)
runRuleset('LIVE RULES (current production)', calcIPOprice, true)
