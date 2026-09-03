// Recompute films.week + films.phase from films.release_date and the season
// boundaries in league_config (season_anchor / phase1_end / phase2_end).
//
// THIS IS THE SEASON-RESET TOOL. To reset the season in future:
//   1. UPDATE league_config SET season_anchor='YYYY-MM-DD',
//        phase1_end='YYYY-MM-DD', phase2_end='YYYY-MM-DD';
//   2. node scripts/recompute-week-phase.mjs --commit
//   3. (wipe gameplay tables as needed — see scripts/reset-execute.mjs)
//
// Dry-run unless --commit.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const DAY = 86400000
const parse = (d) => Date.parse(d + 'T00:00:00Z')

const cfgRows = await fetch(`${U}/rest/v1/league_config?select=season_anchor,phase1_end,phase2_end&limit=1`, { headers: H }).then((r) => r.json())
const cfg = Array.isArray(cfgRows) ? cfgRows[0] : null
if (!cfg?.season_anchor) { console.error('league_config.season_anchor not set — apply the migration first'); process.exit(1) }
const ANCHOR = parse(cfg.season_anchor), P1 = parse(cfg.phase1_end), P2 = parse(cfg.phase2_end)
console.log(`anchor ${cfg.season_anchor} · P1≤${cfg.phase1_end} · P2≤${cfg.phase2_end}\n`)

const weekOf = (t) => Math.max(1, Math.floor((t - ANCHOR) / (7 * DAY)) + 1)
const phaseOf = (t) => t < ANCHOR ? 0 : t <= P1 ? 1 : t <= P2 ? 2 : 3

const films = await fetch(`${U}/rest/v1/films?select=id,title,phase,week,release_date`, { headers: H }).then((r) => r.json())
if (!Array.isArray(films)) { console.error(films); process.exit(1) }

const changes = [], noDate = []
for (const f of films) {
  if (!f.release_date) { noDate.push(f.title); continue }
  const t = parse(f.release_date)
  const phase = phaseOf(t)
  const week = phase === 0 ? (f.week || 1) : weekOf(t) // archive keeps its ordering week
  if (phase !== f.phase || week !== f.week) changes.push({ id: f.id, title: f.title, from: { p: f.phase, w: f.week }, to: { p: phase, w: week }, d: f.release_date })
}

console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  ${changes.length} films change  ·  ${noDate.length} have no release_date (skipped)`)
changes.sort((a, b) => a.d.localeCompare(b.d))
changes.forEach((c) => console.log(`  ${c.d}  ${c.title.padEnd(40)} P${c.from.p} wk${c.from.w} -> P${c.to.p} wk${c.to.w}`))
if (noDate.length) console.log(`\nno release_date: ${noDate.join(', ')}`)

if (COMMIT) {
  let n = 0
  for (const c of changes) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(c.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ phase: c.to.p, week: c.to.w }) })
    if (!r.ok) console.log(`  ERR ${c.id}: ${r.status} ${await r.text()}`); else n++
  }
  console.log(`\nupdated ${n}/${changes.length}`)
} else {
  console.log('\nRun with --commit to write.')
}
