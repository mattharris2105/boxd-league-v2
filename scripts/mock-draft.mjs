// Mock draft — turn N synthetic players loose on a slate and see what they buy.
// Read-only: no Supabase writes, no real league touched.
//
//   node scripts/mock-draft.mjs                  # LIVE current phase — what would they pick?
//   node scripts/mock-draft.mjs --phase 2
//   node scripts/mock-draft.mjs --phase 0        # ARCHIVE backtest — pick on the
//                                                #   pre-release IPO + estimate, then
//                                                #   SCORE against real box office, and
//                                                #   compare CURRENT rules vs a PROPOSED set:
//                                                #     - must spend >= 80% of budget (rest forfeit)
//                                                #     - opening points 50/50 ratio/scale (was 70/30)
//                                                #     - flop penalty: actual < 60% of est => -40 pts
//                                                #     - marquee pick: your best film scores x1.5
//   node scripts/mock-draft.mjs --agents 30 --runs 500
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calcWeeklyPts, calcWeeklyPtsCumulative, rtMult, perfMult } from '../src/lib/scoring.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const N = Number(flag('--agents', 50))
const RUNS = Number(flag('--runs', 300))
const PHASE = flag('--phase', null)

// PROPOSED ruleset knobs
const MIN_SPEND_PCT = 0.80
const RATIO_W_NEW = 0.50
const FLOP_R = 0.60
const FLOP_PTS = -40
const MARQUEE_MULT = 1.5

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
  const rt = f.rt == null ? 1 : f.rt >= 90 ? 1.15 : f.rt >= 80 ? 1.08 : f.rt >= 70 ? 1.03 : f.rt >= 55 ? 1.00 : f.rt >= 40 ? 0.93 : 0.85
  return Math.round(f.base_price * ownershipMult * timeMult * rt)
}

// ── scoring (archive only) ────────────────────────────────────────────────
// Live rules: 50/50 opening blend, flop -40, week-over-week legs. The 4
// variants differ only in how a runaway overperformance is rewarded.
const BREAKOUT_R = 2.5, BREAKOUT_FLOOR = 15, BREAKOUT_BONUS = 40
const scaledCap = (e) => Math.max(2.5, Math.min(4, 2.5 + e / 12)) // LIVE — smoothed estimate-scaled cap
const VARIANTS = {
  'A · flat cap 3.0x (pre-Oct 2026)':  { cap: () => 3, breakout: false },
  'B · estimate-scaled cap (LIVE)':    { cap: scaledCap, breakout: false },
  'C · flat cap + breakout bonus':     { cap: () => 3, breakout: true },
  'D · scaled cap + breakout bonus':   { cap: scaledCap, breakout: true },
}
function openPts (f, actual, v) {
  const r = actual / f.est_m
  const rt = rtMult(f.rt)
  const ratioPart = 130 * Math.min(v.cap(f.est_m), r) * rt
  const scalePart = Math.sqrt(actual) * 10 * perfMult(r) * rt
  let pts = Math.round(RATIO_W_NEW * ratioPart + (1 - RATIO_W_NEW) * scalePart)
  if (v.breakout && r >= BREAKOUT_R && actual >= BREAKOUT_FLOOR) pts += BREAKOUT_BONUS
  return pts
}
function filmPoints (f, v) {
  const actual = resMap[f.id]
  if (actual == null) return 0
  if (actual / f.est_m < FLOP_R) return FLOP_PTS
  return openPts(f, actual, v) + calcWeeklyPts(wgMap[f.id] || {}, actual)
}
const PTSMAPS = ARCHIVE
  ? Object.fromEntries(Object.entries(VARIANTS).map(([k, v]) => [k, Object.fromEntries(films.map((f) => [f.id, filmPoints(f, v)]))]))
  : {}

// ── agent archetypes ─────────────────────────────────────────────────────
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
  for (const [name, count] of MIX) { const s = Math.max(1, Math.round(count * N / 50)); for (let i = 0; i < s; i++) out.push(name) }
  return out.slice(0, N)
}

// ── one draft under a ruleset ────────────────────────────────────────────
//   opts: { minSpend:bool, ptsMap, marquee:bool }
function runOnce (opts) {
  const agents = buildAgents().sort(() => Math.random() - 0.5)
  const owners = {}; films.forEach((f) => { owners[f.id] = 0 })
  const ownPct = () => Object.fromEntries(films.map((f) => [f.id, owners[f.id] / N]))
  const rosters = []
  for (const arch of agents) {
    const scoreFn = ARCHETYPES[arch](ownPct())
    const ranked = [...films].sort((a, b) => scoreFn(b) - scoreFn(a))
    const picks = []; let spend = 0
    const priceNow = (f) => priceOf(f, owners[f.id] / N, N)
    for (const f of ranked) {
      if (picks.length >= MAX_ROSTER) break
      const p = priceNow(f)
      if (spend + p > BUDGET) continue
      picks.push({ id: f.id, price: p }); spend += p; owners[f.id]++
    }
    // min-spend floor: swap the cheapest pick up until >= floor (or stuck)
    if (opts.minSpend) {
      let guard = 30
      while (spend < BUDGET * MIN_SPEND_PCT && guard-- > 0) {
        const out = picks.reduce((a, b) => (a.price <= b.price ? a : b))
        const after = spend - out.price
        const cand = films
          .filter((f) => !picks.some((p) => p.id === f.id))
          .map((f) => ({ f, p: priceNow(f) }))
          .filter((x) => x.p > out.price && after + x.p <= BUDGET)
          .sort((a, b) => b.p - a.p)[0]
        if (!cand) break
        owners[out.id]--; owners[cand.f.id]++
        picks.splice(picks.indexOf(out), 1, { id: cand.f.id, price: cand.p })
        spend = picks.reduce((s, x) => s + x.price, 0)
      }
    }
    rosters.push({ arch, picks, spend })
  }
  // score (archive)
  if (opts.ptsMap) {
    for (const ro of rosters) {
      const penalty = Math.max(0, MAX_ROSTER - ro.picks.length) * DRAFT_PENALTY
      let pts = ro.picks.reduce((s, p) => s + opts.ptsMap[p.id], 0)
      if (opts.marquee && ro.picks.length) {
        // marquee = the roster film with the highest pre-release estimate
        const mq = ro.picks.map((p) => films.find((f) => f.id === p.id)).sort((a, b) => b.est_m - a.est_m)[0]
        pts += (MARQUEE_MULT - 1) * opts.ptsMap[mq.id]
      }
      ro.points = Math.round(pts - penalty)
    }
  }
  return { owners, rosters }
}

// ── aggregate one ruleset over RUNS ──────────────────────────────────────
function evaluate (label, opts) {
  const ownTotal = {}; films.forEach((f) => { ownTotal[f.id] = 0 })
  const pricePaid = {}; films.forEach((f) => { pricePaid[f.id] = [] })
  let spendSum = 0, filledSum = 0, full = 0
  const byArch = {}, wins = {}
  for (let r = 0; r < RUNS; r++) {
    const { owners, rosters } = runOnce(opts)
    for (const f of films) ownTotal[f.id] += owners[f.id]
    let best = null
    for (const ro of rosters) {
      spendSum += ro.spend; filledSum += ro.picks.length
      if (ro.picks.length === MAX_ROSTER) full++
      for (const p of ro.picks) pricePaid[p.id].push(p.price)
      const a = byArch[ro.arch] || (byArch[ro.arch] = { n: 0, spend: 0, filled: 0, points: 0 })
      a.n++; a.spend += ro.spend; a.filled += ro.picks.length; a.points += (ro.points || 0)
      if (opts.ptsMap && (!best || ro.points > best.points)) best = ro
    }
    if (best) wins[best.arch] = (wins[best.arch] || 0) + 1
  }
  const tot = N * RUNS
  return {
    label, ownTotal, pricePaid, tot,
    avgSpend: spendSum / tot, avgFilled: filledSum / tot, fullPct: full / tot,
    byArch: Object.fromEntries(Object.entries(byArch).map(([k, a]) => [k, { spend: a.spend / a.n, filled: a.filled / a.n, points: a.points / a.n }])),
    wins: Object.fromEntries(Object.entries(wins).map(([k, w]) => [k, w / RUNS])),
  }
}

const money = (n) => `$${n.toFixed(0)}M`

// ── LIVE mode: just what they'd pick ─────────────────────────────────────
if (!ARCHIVE) {
  const e = evaluate('LIVE', { minSpend: false })
  const rows = films.map((f) => {
    const pp = e.pricePaid[f.id]
    return { f, ownRate: e.ownTotal[f.id] / e.tot, avgPaid: pp.length ? pp.reduce((s, x) => s + x, 0) / pp.length : 0 }
  }).sort((a, b) => b.ownRate - a.ownRate)
  console.log(`\nMOCK DRAFT · ${N} agents · phase ${phase} (LIVE) · budget ${money(BUDGET)} · ${films.length} films · ${RUNS} runs\n`)
  console.log('MOST WANTED')
  for (const { f, ownRate, avgPaid } of rows.slice(0, 15)) {
    console.log(`  ${(ownRate * 100).toFixed(0).padStart(3)}%  ${f.title.slice(0, 34).padEnd(35)} base ${money(f.base_price).padStart(6)} · paid ${money(avgPaid).padStart(6)} · RT ${f.rt ?? '-'} · est ${f.est_m ?? '-'}`)
  }
  console.log(`\n  avg spend ${money(e.avgSpend)}/${money(BUDGET)} · avg ${e.avgFilled.toFixed(2)}/6 slots · ${(e.fullPct * 100).toFixed(0)}% fill all 6`)
  process.exit(0)
}

// ── ARCHIVE mode: 4 breakout-reward variants ────────────────────────────
console.log(`\nARCHIVE BACKTEST · ${N} agents · ${films.length} settled films · budget ${money(BUDGET)} · ${RUNS} runs`)
console.log(`All variants: 50/50 opening · flop <60% = -40 · week-over-week legs · min-spend 80% · marquee x1.5.`)
console.log(`They differ only in how a runaway overperformance is rewarded.\n`)

const evals = Object.fromEntries(Object.keys(VARIANTS).map((k) => [k, evaluate(k, { ptsMap: PTSMAPS[k], minSpend: true, marquee: true })]))

// price tiers
const sorted = [...films].sort((a, b) => a.base_price - b.base_price)
const cut1 = sorted[Math.floor(sorted.length / 3)].base_price
const cut2 = sorted[Math.floor(sorted.length * 2 / 3)].base_price
const tierPPP = (m, lo, hi) => {
  const fs = films.filter((f) => f.base_price >= lo && f.base_price < hi)
  return fs.reduce((s, f) => s + m[f.id] / f.base_price, 0) / (fs.length || 1)
}

// how a handful of real runaway hits move across the variants
const WATCH = ['Backrooms', 'Obsession', 'The Invite', 'Buddy', 'Spider-Man: Brand New Day', 'Toy Story 5', 'The Odyssey', 'Scary Movie']
console.log('RUNAWAY HITS — score under each variant  (r = actual / estimate)')
console.log('  film'.padEnd(30) + ' base   est   actual   r     A     B     C     D')
for (const name of WATCH) {
  const f = films.find((x) => x.title === name)
  if (!f) continue
  const a = resMap[f.id], r = a / f.est_m
  const row = Object.keys(VARIANTS).map((k) => String(PTSMAPS[k][f.id]).padStart(5)).join(' ')
  console.log(`  ${f.title.slice(0, 28).padEnd(28)} ${money(f.base_price).padStart(5)} ${String(f.est_m).padStart(5)} ${money(a).padStart(7)} ${r.toFixed(1).padStart(4)}x ${row}`)
}

console.log('\nSTRATEGY SPREAD + WHO WINS')
for (const [k, e] of Object.entries(evals)) {
  const arch = Object.entries(e.byArch).sort((x, y) => y[1].points - x[1].points)
  const top = arch[0], bot = arch[arch.length - 1]
  const spread = (top[1].points / Math.max(1, bot[1].points)).toFixed(1)
  const winner = Object.entries(e.wins).sort((x, y) => y[1] - x[1])[0]
  console.log(`  ${k.padEnd(34)} spread ${spread}x · top ${top[0]} (${top[1].points.toFixed(0)}pts) · wins most: ${winner[0]} ${(winner[1] * 100).toFixed(0)}%`)
}

console.log('\nPOINTS PER $M BY PRICE TIER')
console.log(`  ${''.padEnd(34)} cheap(<${money(cut1)})  mid  dear(>${money(cut2)})`)
for (const k of Object.keys(VARIANTS)) {
  console.log(`  ${k.padEnd(34)} ${tierPPP(PTSMAPS[k], 0, cut1).toFixed(1).padStart(6)}   ${tierPPP(PTSMAPS[k], cut1, cut2).toFixed(1).padStart(4)}   ${tierPPP(PTSMAPS[k], cut2, Infinity).toFixed(1).padStart(4)}`)
}
console.log()
