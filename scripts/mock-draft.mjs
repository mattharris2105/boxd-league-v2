// Mock draft — turn N synthetic players loose on a slate and see what they buy.
// Read-only: no Supabase writes, no real league touched.
//
//   node scripts/mock-draft.mjs                  # LIVE current phase — what would they pick?
//   node scripts/mock-draft.mjs --phase 2
//   node scripts/mock-draft.mjs --phase 0        # ARCHIVE backtest — pick on the
//                                                #   pre-release IPO + estimate, then
//                                                #   SCORE against real box office.
//   node scripts/mock-draft.mjs --agents 30 --runs 500
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calcOpeningPts, calcLegsBonus, calcWeeklyPts } from '../src/lib/scoring.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const N = Number(flag('--agents', 50))
const RUNS = Number(flag('--runs', 300))
const PHASE = flag('--phase', null)

let env = { ...process.env }
try {
  for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch {}
const U = (env.SUPABASE_URL || 'https://yxluqkfanhzktinayvex.supabase.co').trim().replace(/\/+$/, '')
const KEY = (env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const g = async (p) => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json()

const MAX_ROSTER = 6
const DRAFT_PENALTY = 5
const PHASE_BUDGETS = { 0: 150, 1: 150, 2: 180, 3: 150 }

const cfg = await g('league_config?select=current_week,current_phase&limit=1').then((r) => r[0] || { current_week: 1, current_phase: 1 })
const phase = Number(PHASE != null ? PHASE : (cfg.current_phase || 1))
const ARCHIVE = phase === 0
const BUDGET = PHASE_BUDGETS[phase] || 150
const curWeek = cfg.current_week || 1

let films = (await g(`films?select=id,title,dist,genre,franchise,base_price,est_m,rt,week,phase&phase=eq.${phase}&active=eq.true`))
  .filter((f) => f.base_price != null && f.est_m != null)

// Archive: attach real box office so rosters can be scored on outcomes.
let resMap = {}, wgMap = {}
if (ARCHIVE) {
  const [results, wg] = await Promise.all([
    g('results?select=film_id,actual_m'),
    g('weekly_grosses?select=film_id,week_num,gross_m'),
  ])
  resMap = Object.fromEntries(results.map((r) => [r.film_id, r.actual_m]))
  wg.forEach((w) => { (wgMap[w.film_id] = wgMap[w.film_id] || {})[w.week_num] = w.gross_m })
  films = films.filter((f) => resMap[f.id] != null)
}
if (!films.length) { console.error(`No usable films in phase ${phase}.`); process.exit(1) }

// ── price a film given current crowding — mirrors calcPriceDrivers in App.js ─
function priceOf (f, ownersPct, totalPlayers) {
  const confidence = Math.min(1, totalPlayers / 12)
  const lift = ownersPct >= 0.7 ? 0.30 : ownersPct >= 0.55 ? 0.22 : ownersPct >= 0.40 ? 0.15 : ownersPct >= 0.25 ? 0.08 : 0
  const ownershipMult = 1 + lift * confidence
  let timeMult = 1
  if (!ARCHIVE && f.week != null) {
    const w = f.week - curWeek
    timeMult = w >= 6 ? 0.85 : w === 5 ? 0.90 : w === 4 ? 0.95 : w === 3 ? 1.00 : w === 2 ? 1.03 : w === 1 ? 1.07 : 1.10
  }
  const rtMult = f.rt == null ? 1 : f.rt >= 90 ? 1.15 : f.rt >= 80 ? 1.08 : f.rt >= 70 ? 1.03 : f.rt >= 55 ? 1.00 : f.rt >= 40 ? 0.93 : 0.85
  return Math.round(f.base_price * ownershipMult * timeMult * rtMult)
}

// actual points a film scored (archive only) — same formulas as the live app
function filmPoints (f) {
  const actual = resMap[f.id]
  if (actual == null) return 0
  const wk = wgMap[f.id] || {}
  return calcOpeningPts({ estM: f.est_m, rt: f.rt }, actual)
    + calcWeeklyPts(wk, actual)
    + calcLegsBonus(actual, wk[2])
}
const PTS = ARCHIVE ? Object.fromEntries(films.map((f) => [f.id, filmPoints(f)])) : {}

// ── agent archetypes: a scoring function over films, higher = wants it more ──
const rand = (a) => a[Math.floor(Math.random() * a.length)]
const ARCHETYPES = {
  'Blockbuster chaser': () => (f) => f.base_price,
  'Bargain hunter (cheap first)': () => (f) => -f.base_price + Math.random() * 3,
  'Value hunter (est per $)': () => (f) => (f.est_m || 0) / Math.max(1, f.base_price) + Math.random() * 0.15,
  'Critics darling': () => (f) => (f.rt ?? 45) + Math.random() * 10,
  'Franchise loyalist': () => (f) => (f.franchise ? 100 : 0) + f.base_price * 0.3 + Math.random() * 20,
  'Contrarian (buys the unloved)': (ownPct) => (f) => -(ownPct[f.id] || 0) * 100 + Math.random() * 30,
  'Genre fan': () => { const gn = rand(films.map((f) => f.genre).filter(Boolean)); return (f) => (f.genre === gn ? 80 : 0) + (f.est_m || 0) * 0.2 + Math.random() * 25 },
  'Estimate truster': () => (f) => (f.est_m || 0) + Math.random() * 5,
  'Coin flipper': () => () => Math.random(),
}
const MIX = [
  ['Blockbuster chaser', 7], ['Bargain hunter (cheap first)', 8], ['Value hunter (est per $)', 7],
  ['Critics darling', 6], ['Franchise loyalist', 6], ['Contrarian (buys the unloved)', 5],
  ['Genre fan', 6], ['Estimate truster', 3], ['Coin flipper', 2],
]
function buildAgents () {
  const out = []
  for (const [name, count] of MIX) {
    const scaled = Math.max(1, Math.round(count * N / 50))
    for (let i = 0; i < scaled; i++) out.push(name)
  }
  return out.slice(0, N)
}

// ── one draft: agents pick in random order; price rises as ownership grows ──
function runOnce () {
  const agents = buildAgents().sort(() => Math.random() - 0.5)
  const owners = {}; films.forEach((f) => { owners[f.id] = 0 })
  const ownPct = () => Object.fromEntries(films.map((f) => [f.id, owners[f.id] / N]))
  const rosters = []
  for (const arch of agents) {
    const scoreFn = ARCHETYPES[arch](ownPct())
    const ranked = [...films].sort((a, b) => scoreFn(b) - scoreFn(a))
    const picks = []; let spend = 0
    for (const f of ranked) {
      if (picks.length >= MAX_ROSTER) break
      const p = priceOf(f, owners[f.id] / N, N)
      if (spend + p > BUDGET) continue
      picks.push({ id: f.id, price: p }); spend += p; owners[f.id]++
    }
    const penalty = Math.max(0, MAX_ROSTER - picks.length) * DRAFT_PENALTY
    const points = ARCHIVE ? picks.reduce((s, p) => s + PTS[p.id], 0) - penalty : 0
    rosters.push({ arch, picks, spend, points, penalty })
  }
  return { owners, rosters }
}

// ── aggregate over RUNS ────────────────────────────────────────────────────
const ownTotal = {}; films.forEach((f) => { ownTotal[f.id] = 0 })
const pricePaid = {}; films.forEach((f) => { pricePaid[f.id] = [] })
let spendSum = 0, filledSum = 0, fullRosters = 0
const byArch = {}
let winsByArch = {}

for (let r = 0; r < RUNS; r++) {
  const { owners, rosters } = runOnce()
  for (const f of films) ownTotal[f.id] += owners[f.id]
  let best = null
  for (const ro of rosters) {
    spendSum += ro.spend; filledSum += ro.picks.length
    if (ro.picks.length === MAX_ROSTER) fullRosters++
    for (const p of ro.picks) pricePaid[p.id].push(p.price)
    const a = byArch[ro.arch] || (byArch[ro.arch] = { n: 0, spend: 0, filled: 0, points: 0 })
    a.n++; a.spend += ro.spend; a.filled += ro.picks.length; a.points += ro.points
    if (ARCHIVE && (!best || ro.points > best.points)) best = ro
  }
  if (best) winsByArch[best.arch] = (winsByArch[best.arch] || 0) + 1
}

const totalAgentRuns = N * RUNS
const money = (n) => `$${n.toFixed(0)}M`
const rows = films.map((f) => {
  const ownRate = ownTotal[f.id] / totalAgentRuns
  const pp = pricePaid[f.id]
  const avgPaid = pp.length ? pp.reduce((s, x) => s + x, 0) / pp.length : 0
  return { f, ownRate, avgPaid, pts: PTS[f.id] || 0 }
}).sort((a, b) => b.ownRate - a.ownRate)

console.log(`\nMOCK DRAFT · ${N} agents · phase ${phase}${ARCHIVE ? ' (ARCHIVE backtest — scored on real box office)' : ' (LIVE slate)'} · budget ${money(BUDGET)} · ${films.length} films · ${RUNS} runs\n`)

console.log('MOST WANTED')
for (const { f, ownRate, avgPaid, pts } of rows.slice(0, 15)) {
  const drift = f.base_price ? Math.round((avgPaid / f.base_price - 1) * 100) : 0
  const dTag = drift > 3 ? ` (+${drift}% crowd)` : drift < -3 ? ` (${drift}% vs base)` : ''
  console.log(`  ${(ownRate * 100).toFixed(0).padStart(3)}%  ${f.title.slice(0, 32).padEnd(33)} base ${money(f.base_price).padStart(6)} · paid ${money(avgPaid).padStart(6)}${dTag}${ARCHIVE ? ` · SCORED ${String(pts).padStart(4)}pts` : ` · RT ${f.rt ?? '-'} · est ${f.est_m ?? '-'}`}`)
}

if (ARCHIVE) {
  console.log('\nWHERE THE POINTS WERE  (every archive film, best value first)')
  const byValue = [...films].map((f) => ({ f, pts: PTS[f.id], ppp: PTS[f.id] / Math.max(1, f.base_price) }))
    .sort((a, b) => b.ppp - a.ppp)
  for (const { f, pts, ppp } of byValue.slice(0, 12)) {
    console.log(`  ${String(pts).padStart(4)}pts  ${money(f.base_price).padStart(6)}  ${ppp.toFixed(1).padStart(5)} pts/$M  ${f.title}`)
  }
  // cheap vs expensive: does a bargain roster actually win?
  const sorted = [...films].sort((a, b) => a.base_price - b.base_price)
  const cheapCut = sorted[Math.floor(sorted.length / 3)].base_price
  const dearCut = sorted[Math.floor(sorted.length * 2 / 3)].base_price
  const bucket = (lo, hi) => {
    const fs = films.filter((f) => f.base_price >= lo && f.base_price < hi)
    const p = fs.map((f) => PTS[f.id])
    return { n: fs.length, avg: p.reduce((s, x) => s + x, 0) / (p.length || 1), avgPpp: p.reduce((s, x, i) => s + x / fs[i].base_price, 0) / (p.length || 1) }
  }
  const lo = bucket(0, cheapCut), mid = bucket(cheapCut, dearCut), hi = bucket(dearCut, Infinity)
  console.log(`\nPOINTS BY PRICE TIER`)
  console.log(`  cheap  (<${money(cheapCut)})   ${lo.n} films · avg ${lo.avg.toFixed(0)}pts · ${lo.avgPpp.toFixed(1)} pts per $M`)
  console.log(`  mid    (${money(cheapCut)}-${money(dearCut)}) ${mid.n} films · avg ${mid.avg.toFixed(0)}pts · ${mid.avgPpp.toFixed(1)} pts per $M`)
  console.log(`  dear   (>${money(dearCut)})   ${hi.n} films · avg ${hi.avg.toFixed(0)}pts · ${hi.avgPpp.toFixed(1)} pts per $M`)

  console.log(`\nWHICH STRATEGY WON  (${RUNS} drafts, highest-scoring roster each time)`)
  for (const [name, w] of Object.entries(winsByArch).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${((w / RUNS) * 100).toFixed(0).padStart(3)}%  ${name}`)
  }
}

console.log('\nHEALTH')
console.log(`  avg roster spend     ${money(spendSum / totalAgentRuns)} of ${money(BUDGET)} (${((spendSum / totalAgentRuns / BUDGET) * 100).toFixed(0)}%)`)
console.log(`  avg slots filled     ${(filledSum / totalAgentRuns).toFixed(2)} / ${MAX_ROSTER}`)
console.log(`  agents filling all 6 ${((fullRosters / totalAgentRuns) * 100).toFixed(0)}%`)

console.log('\nBY ARCHETYPE')
for (const [name, a] of Object.entries(byArch)) {
  console.log(`  ${name.padEnd(32)} spend ${money(a.spend / a.n).padStart(6)} · ${(a.filled / a.n).toFixed(1)} films${ARCHIVE ? ` · ${(a.points / a.n).toFixed(0).padStart(5)} pts avg` : ''}`)
}
console.log()
