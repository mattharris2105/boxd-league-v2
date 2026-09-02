// TASK 2 — add missing wide + buzzy-limited films (Sep 2026 - Jan 2027) and
// fix two mis-dated existing rows. Dry-run unless --commit.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }

// --- app helpers, verbatim ---
const calcIPO = (est) => { if (est == null || isNaN(est)) return null; if (est <= 0) return 3; return Math.max(3, Math.min(75, Math.round(1.05 * Math.pow(est, 0.78)))) }
const slug = (t) => { const s = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); return s + '-' + Math.abs([...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) % 9999) }
const ANCHOR = Date.UTC(2026, 8, 7)
const P1_END = Date.UTC(2026, 10, 29)
const P2_END = Date.UTC(2027, 0, 31)
const DAY = 86400000
const dToWeek = (iso) => { const d = Date.parse(iso + 'T00:00:00Z'); return Math.max(1, Math.floor((d - ANCHOR) / (7 * DAY)) + 1) }
const dToPhase = (iso) => { const d = Date.parse(iso + 'T00:00:00Z'); return d < ANCHOR ? 0 : d <= P1_END ? 1 : d <= P2_END ? 2 : 3 }

// date, title, distributor, genre, my rough opening estimate ($M), note
const ADDS = [
  // --- approved list A ---
  ['2027-01-15', 'The Beekeeper 2', 'Amazon MGM Studios', 'Action', 22, 'wide; Statham; MLK weekend'],
  ['2027-01-15', 'Children of Blood and Bone', 'Paramount Pictures', 'Adventure', 30, 'wide; Prince-Bythewood; huge cast; IMAX'],
  ['2026-12-25', 'Mr. Irrelevant', 'Paramount Pictures', 'Drama', 10, 'wide; David Corenswet sports biopic'],
  ['2026-11-26', 'Hershey', 'Angel Studios', 'Drama', 5, 'moderate; Finn Wittrock biopic'],
  // --- other wide releases missing from the slate ---
  ['2026-09-04', 'Cocoon: One Summer of Girlhood', 'GKIDS', 'Animation', 0.6, 'Phase 0 (pre-anchor); Okinawa war anime'],
  ['2026-09-18', 'Bad Apples', 'Republic Pictures', 'Comedy', 4, 'wide; Saoirse Ronan dark comedy'],
  ['2026-10-23', 'Ali G: Who Iz I?', 'Amazon MGM Studios', 'Comedy', 12, 'wide; Sacha Baron Cohen'],
  ['2026-11-06', 'Ghost Soldier', 'Sony Pictures', 'Action', 8, 'wide'],
  ['2026-11-06', 'Ramayana: Part 1', 'NYVE / Prime Focus', 'Adventure', 15, 'wide; large-budget Indian epic, global release'],
  ['2026-10-16', "Trust Me, I'm a Doctor", 'Briarcliff Entertainment', 'Thriller', 3, 'wide'],
  ['2026-10-23', 'A Talent for Murder', 'Bleecker Street', 'Thriller', 3, 'wide'],
  ['2027-01-22', 'Animal Friends', 'Warner Bros.', 'Comedy', 20, 'wide; Ryan Reynolds / Aubrey Plaza hybrid'],
  ['2027-01-29', 'Karoshi', 'Lionsgate', 'Thriller', 8, 'wide'],
  ['2027-01-29', 'The Rescue', 'Paramount Pictures', 'Action', 10, 'wide'],
  ['2027-01-01', 'Pendulum', 'Vertical Entertainment', 'Thriller', 4, 'wide'],
  ['2027-01-22', 'The Third Parent', 'Bleecker Street', 'Thriller', 5, 'wide'],
  ['2026-11-20', 'November 1963', 'Ketchup Entertainment', 'Drama', 5, 'wide; JFK assassination drama'],
  // --- limited, buzzy distributor / award buzz ---
  ['2026-11-25', 'The Adventures of Cliff Booth', 'Netflix', 'Comedy', 3, 'limited; Fincher dir / Pitt / Tarantino script — major awards buzz'],
  ['2026-10-09', 'Misty Green', 'A24', 'Drama', 2, 'limited; A24'],
  ['2026-11-06', 'Club Kid', 'A24', 'Drama', 2, 'limited; A24'],
  ['2026-12-11', 'The Debut', 'A24', 'Drama', 2, 'limited; A24'],
  ['2026-11-13', 'Paper Tiger', 'Neon', 'Thriller', 3, 'limited->wide; Neon'],
  ['2026-12-11', 'Clarissa', 'Neon', 'Drama', 1, 'Oscar-qualifying run; Neon'],
  ['2026-10-16', 'Once Upon a Time in Harlem', 'Neon', 'Drama', 2, 'limited; Neon'],
  ['2026-11-25', 'All of a Sudden', 'Neon', 'Drama', 2, 'limited; Neon'],
  ['2026-11-20', 'Elsinore', 'Focus Features', 'Drama', 3, 'limited->wide Dec; Andrew Scott / Olivia Colman; LFF opener'],
  ['2026-12-04', 'Behemoth!', 'Searchlight Pictures', 'Horror', 3, 'limited; Searchlight'],
  ['2026-10-09', 'Tenzing', 'Apple Original Films', 'Adventure', 2, 'limited; Everest, Willem Dafoe'],
  ['2026-10-23', 'Fatherland', 'MUBI', 'Drama', 1, 'limited; MUBI'],
  ['2026-11-20', 'Minotaur', 'MUBI', 'Thriller', 1, 'limited; MUBI'],
  ['2026-12-25', 'Coward', 'MUBI', 'Drama', 1, 'limited; MUBI'],
  ['2026-09-22', 'Bedford Park', 'Sony Pictures Classics', 'Drama', 1, 'limited; SPC'],
  ['2026-10-23', 'The Only Living Pickpocket in New York', 'Sony Pictures Classics', 'Comedy', 2, 'limited->wide; SPC'],
  ['2026-11-13', 'Bitter Christmas', 'Sony Pictures Classics', 'Comedy', 2, 'limited->wide; SPC'],
  ['2026-09-25', 'Your Mother, Your Mother, Your Mother', 'Amazon MGM Studios', 'Comedy', 3, 'limited->wide; Amazon MGM'],
]

// two fixes to existing rows (title match, case-insensitive)
const FIXES = [
  { match: 'the angry birds movie 3', patch: { week: dToWeek('2026-12-23'), phase: dToPhase('2026-12-23') }, why: 'real date 23 Dec 2026, not 9 Nov' },
  { match: 'victoria psycho', patch: { title: 'Victorian Psycho', dist: 'Bleecker Street', week: dToWeek('2026-11-13'), phase: dToPhase('2026-11-13') }, why: 'title is "Victorian Psycho"; real date 13 Nov 2026' },
]

const existing = await fetch(`${U}/rest/v1/films?select=id,title`, { headers: H }).then(r => r.json())
const haveTitle = new Set(existing.map(f => f.title.toLowerCase().trim()))
const haveId = new Set(existing.map(f => f.id))

const rows = [['title', 'release', 'phase', 'week', 'distributor', 'genre', 'est_m', 'IPO', 'status', 'note']]
const toInsert = []
for (const [date, title, dist, genre, est, note] of ADDS) {
  const id = slug(title)
  const dup = haveTitle.has(title.toLowerCase().trim()) || haveId.has(id)
  const phase = dToPhase(date), week = dToWeek(date), base = calcIPO(est)
  rows.push([title, date, phase, week, dist, genre, est, base, dup ? 'SKIP (exists)' : 'ADD', note])
  if (!dup) toInsert.push({ id, title, dist, genre, phase, week, base_price: base, est_m: est, active: true })
}
const backupsDir = resolve(root, 'backups')
const latest = readdirSync(backupsDir).filter(x => /\d{4}-\d{2}-\d{2}T/.test(x)).sort().pop()
writeFileSync(resolve(backupsDir, latest, 'task2-adds.csv'),
  rows.map(r => r.map(v => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(',')).join('\n'))

console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  ${toInsert.length} to insert, ${ADDS.length - toInsert.length} skipped`)
toInsert.forEach(f => console.log(`  P${f.phase} wk${String(f.week).padStart(2)}  ${f.title.padEnd(38)} $${f.est_m} -> IPO ${f.base_price}  [${f.dist}]`))
console.log('\nfixes:')
FIXES.forEach(f => console.log(`  ${f.match} -> ${JSON.stringify(f.patch)}  (${f.why})`))
console.log(`\nCSV: backups/${latest}/task2-adds.csv`)

if (!COMMIT) { console.log('\nRun with --commit to write.') } else { await writeAll() }

async function writeAll () {
  for (let i = 0; i < toInsert.length; i += 50) {
    const chunk = toInsert.slice(i, i + 50)
    const r = await fetch(`${U}/rest/v1/films`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(chunk) })
    console.log(`  insert ${i}-${i + chunk.length}: ${r.ok ? 'ok' : r.status + ' ' + await r.text()}`)
  }
  for (const f of FIXES) {
    const hit = existing.find(x => x.title.toLowerCase().trim() === f.match)
    if (!hit) { console.log(`  fix ${f.match}: NOT FOUND`); continue }
    const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(hit.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(f.patch) })
    console.log(`  fix ${f.match}: ${r.ok ? 'ok' : r.status + ' ' + await r.text()}`)
  }
  const after = await fetch(`${U}/rest/v1/films?select=phase`, { headers: H }).then(r => r.json())
  const dist = after.reduce((m, r) => (m[r.phase] = (m[r.phase] || 0) + 1, m), {})
  console.log(`\nverify — films total ${after.length}, phase dist ${JSON.stringify(dist)}`)
}
