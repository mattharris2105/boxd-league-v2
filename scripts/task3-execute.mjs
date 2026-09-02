// TASK 3 — write Phase 0 box office + revised values. Dry-run unless --commit.
//   node scripts/task3-execute.mjs            (dry run + writes proposal CSV)
//   node scripts/task3-execute.mjs --commit   (writes to Supabase)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }

// app formula, verbatim from src/App.js
function calcMarketValue (film, actualM, wg = {}) {
  if (actualM == null) return film.basePrice
  const r = film.estM ? actualM / film.estM : 1
  const perf = r >= 2 ? 2 : r >= 1.5 ? 1.6 : r >= 1.3 ? 1.35 : r >= 1.1 ? 1.15 : r >= 0.95 ? 1 : r >= 0.8 ? 0.85 : r >= 0.6 ? 0.65 : r >= 0.4 ? 0.45 : 0.25
  const rt = film.rt != null ? (film.rt >= 90 ? 1.15 : film.rt >= 75 ? 1.08 : film.rt < 50 ? 0.9 : 1) : 1
  const BANDS = { 2: { std: -0.55, up: 0.30, down: -0.15 }, 3: { std: -0.40, up: 0.20, down: -0.10 }, 4: { std: -0.35, up: 0.15, down: -0.05 }, 5: { std: -0.40, up: 0.10, down: 0 }, 6: { std: -0.40, up: 0.10, down: 0 } }
  let legsMult = 1
  for (let w = 2; w <= 6; w++) {
    const cur = Number(wg[w]), prev = w === 2 ? actualM : Number(wg[w - 1])
    if (!cur || !prev || isNaN(cur) || isNaN(prev)) continue
    const drop = (cur - prev) / prev
    const b = BANDS[w]
    let adj
    if (drop >= b.std) { const range = 0 - b.std; adj = b.up * (range > 0 ? Math.min(1, (drop - b.std) / range) : 0) }
    else { const range = b.std - (-1); adj = b.down * (range > 0 ? Math.min(1, (b.std - drop) / range) : 0) }
    legsMult *= (1 + adj)
  }
  const raw = film.basePrice * perf * rt * legsMult
  return Math.round(Math.max(film.basePrice * 0.15, Math.min(film.basePrice * 4, raw)))
}

// Researched from The Numbers (weekend-by-weekend domestic), 2026-09-02.
// ow = opening weekend Fri-Sun $M ; wg = {weekNum: $M} for legs (wk2+).
// For limited->wide films (Invite, Tony) the WIDE-EXPANSION weekend is treated as wk1.
const DATA = {
  'spider-man-brand-new-day-6273':     { ow: 360.09, wg: { 2: 144.25, 3: 70.71, 4: 39.00, 5: 22.51 } },
  'the-odyssey-7004':                   { ow: 123.50, wg: { 2: 90.02, 3: 51.05, 4: 31.71, 5: 23.61, 6: 19.71 } },
  'moana-4589':                         { ow: 43.14, wg: { 2: 17.94, 3: 10.64, 4: 5.61, 5: 2.98, 6: 1.25 } },
  'insidious-out-of-the-further-2122':  { ow: 25.11, wg: { 2: 10.20 } },
  'the-end-of-oak-street-2184':         { ow: 21.01, wg: { 2: 8.75, 3: 4.90 } },
  'paw-patrol-the-dino-movie-495':      { ow: 20.25, wg: { 2: 9.17, 3: 5.02 } },
  'coyote-vs-acme-4987':                { ow: 15.91, wg: {} },
  'evil-dead-burn-7863':                { ow: 13.70, wg: { 2: 4.73, 3: 2.80, 4: 0.75, 5: 0.15, 6: 0.13 } },
  'the-dog-stars-696':                  { ow: 7.71, wg: {} },
  'mutiny-60':                          { ow: 7.71, wg: { 2: 2.77 } },
  'one-night-only-1776':                { ow: 5.51, wg: { 2: 2.00, 3: 0.30, 4: 0.03 } },
  'buddy-8241':                         { ow: 5.53, wg: {} },
  'super-troopers-3-9183':              { ow: 4.00, wg: { 2: 1.34, 3: 0.17, 4: 0.03 } },
  'spa-weekend-8783':                   { ow: 3.08, wg: { 2: 1.19 } },
  'the-death-of-robin-hood-4040':       { ow: 2.87, wg: { 2: 0.62, 3: 0.06, 4: 0.02 }, fixWeek: 1 },
  'ice-cream-man-8502':                 { ow: 2.12, wg: { 2: 0.23 } },
  'motor-city-2459':                    { ow: 1.69, wg: { 2: 0.37, 3: 0.03 } },
  // Tier 2 — limited then wide; wide-expansion weekend = wk1
  'the-invite-7358':                    { ow: 5.93, wg: { 2: 3.53, 3: 2.64 } },
  'tony-1319':                          { ow: 4.95, wg: { 2: 2.22 } },
  'the-magic-faraway-tree-9153':        { ow: 1.35, wg: { 2: 0.29 } },
  'pinoccho-unstrung-3364':             { ow: 0.39, wg: { 2: 0.05 } },
}

const PHASE_MOVE = { 'how-to-rob-a-bank-1748': { phase: 1, week: 10, why: 'unreleased as of 2026-09-02 (date conflict Sep 4 / Nov 13) — out of the archive into the live game' } }

const films = await fetch(`${U}/rest/v1/films?select=id,title,phase,week,est_m,base_price,rt`, { headers: H }).then(r => r.json())
const byId = Object.fromEntries(films.map(f => [f.id, f]))

const rows = [['title', 'opening_WE_$M', 'wk2', 'wk3', 'wk4', 'wk5', 'wk6', 'est_m', 'IPO', 'current_val', 'NEW_val']]
const plan = []
for (const [id, d] of Object.entries(DATA)) {
  const f = byId[id]; if (!f) { console.log('!! missing film', id); continue }
  const film = { basePrice: f.base_price, estM: f.est_m, rt: f.rt }
  const nv = calcMarketValue(film, d.ow, d.wg)
  plan.push({ id, title: f.title, ...d, newVal: nv, curVal: f.base_price })
  rows.push([f.title, d.ow, d.wg[2] ?? '', d.wg[3] ?? '', d.wg[4] ?? '', d.wg[5] ?? '', d.wg[6] ?? '', f.est_m, f.base_price, f.base_price, nv])
}
const backupsDir = resolve(root, 'backups')
const latest = readdirSync(backupsDir).filter(x => /\d{4}-\d{2}-\d{2}T/.test(x)).sort().pop()
writeFileSync(resolve(backupsDir, latest, 'task3-final.csv'),
  rows.map(r => r.map(v => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(',')).join('\n'))

console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  ${plan.length} films get box office + revised value`)
plan.forEach(p => console.log(`  ${p.title.padEnd(34)} OW $${String(p.ow).padStart(6)}M  wk2+=${Object.keys(p.wg).length}  value ${p.curVal} -> ${p.newVal}`))
console.log('\nphase move:', PHASE_MOVE)
console.log(`CSV: backups/${latest}/task3-final.csv`)

if (!COMMIT) { console.log('\nRun with --commit to write.') }
else { await writeAll() }

async function writeAll () {
let nRes = 0, nWg = 0, nVal = 0
for (const p of plan) {
  // results (opening weekend)
  let r = await fetch(`${U}/rest/v1/results`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ film_id: p.id, actual_m: p.ow }) })
  if (!r.ok) { console.log(`  results ${p.id}: ${r.status} ${await r.text()}`) } else nRes++
  // weekly_grosses: clear then insert
  await fetch(`${U}/rest/v1/weekly_grosses?film_id=eq.${encodeURIComponent(p.id)}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } })
  const wgRows = Object.entries(p.wg).map(([w, g]) => ({ id: randomUUID(), film_id: p.id, week_num: Number(w), gross_m: g }))
  if (wgRows.length) {
    r = await fetch(`${U}/rest/v1/weekly_grosses`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(wgRows) })
    if (!r.ok) { console.log(`  wg ${p.id}: ${r.status} ${await r.text()}`) } else nWg += wgRows.length
  }
  // film_values (revised)
  r = await fetch(`${U}/rest/v1/film_values`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ film_id: p.id, current_value: p.newVal }) })
  if (!r.ok) { console.log(`  film_values ${p.id}: ${r.status} ${await r.text()}`) } else nVal++
  // week fix
  if (p.fixWeek != null) {
    r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(p.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ week: p.fixWeek }) })
    console.log(`  ${p.id} week -> ${p.fixWeek}: ${r.ok ? 'ok' : r.status}`)
  }
}
for (const [id, m] of Object.entries(PHASE_MOVE)) {
  const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ phase: m.phase, week: m.week }) })
  console.log(`  phase move ${id} -> P${m.phase} wk${m.week}: ${r.ok ? 'ok' : r.status + ' ' + await r.text()}`)
}
console.log(`\nwrote: ${nRes} results, ${nWg} weekly_grosses rows, ${nVal} film_values`)

// verify
const res = await fetch(`${U}/rest/v1/results?select=film_id`, { headers: H }).then(r => r.json())
const wg = await fetch(`${U}/rest/v1/weekly_grosses?select=id`, { headers: H }).then(r => r.json())
const fv = await fetch(`${U}/rest/v1/film_values?select=film_id`, { headers: H }).then(r => r.json())
const p0 = await fetch(`${U}/rest/v1/films?select=phase&phase=eq.0`, { headers: H }).then(r => r.json())
console.log(`verify — results ${res.length}, weekly_grosses ${wg.length}, film_values ${fv.length}, phase0 films ${p0.length}`)
}
