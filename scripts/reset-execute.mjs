// TASK 1 — execute the season reset. Dry-run by default; pass --commit to write.
//   node scripts/reset-execute.mjs            (dry run)
//   node scripts/reset-execute.mjs --commit   (writes to Supabase)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')

const env = {}
for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const URL = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const backupsDir = resolve(root, 'backups')
const latest = readdirSync(backupsDir).filter(d => /\d{4}-\d{2}-\d{2}T/.test(d)).sort().pop()
const snap = resolve(backupsDir, latest)
const films = JSON.parse(readFileSync(resolve(snap, 'films.json'), 'utf8'))

const OLD_ANCHOR = new Date('2026-06-25T00:00:00Z')
const NEW_ANCHOR = new Date('2026-09-07T00:00:00Z')
const P1_END = new Date('2026-11-29T00:00:00Z')
const P2_END = new Date('2027-01-31T00:00:00Z')
const DAY = 86400000
const derivedRelease = f => new Date(OLD_ANCHOR.getTime() + (f.week - 1) * 7 * DAY)
const newWeek = d => Math.max(1, Math.floor((d - NEW_ANCHOR) / (7 * DAY)) + 1)
const newPhase = (f, d) => {
  if (f.phase === 0) return 0
  if (d < NEW_ANCHOR) return 0
  if (d <= P1_END) return 1
  if (d <= P2_END) return 2
  return 3
}

const changes = []
for (const f of films) {
  const rel = derivedRelease(f)
  const np = newPhase(f, rel)
  const nw = f.phase === 0 ? f.week : (np === 0 ? f.week : newWeek(rel))
  if (np !== f.phase || nw !== f.week) {
    changes.push({ id: f.id, title: f.title, from: { phase: f.phase, week: f.week }, to: { phase: np, week: nw } })
  }
}

console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  snapshot backups/${latest}\n`)
console.log(`films to update: ${changes.length} / ${films.length}`)
const pt = {}; changes.forEach(c => { const k = `P${c.from.phase}->P${c.to.phase}`; pt[k] = (pt[k] || 0) + 1 })
console.log('phase transitions:', pt)
writeFileSync(resolve(snap, 'reset-execute-changes.json'), JSON.stringify(changes, null, 2))

const WIPE = ['rosters', 'transactions', 'activity_feed']  // film_values kept per instruction

async function main () {
  if (!COMMIT) {
    console.log(`\nwould DELETE all rows from: ${WIPE.join(', ')}`)
    console.log('would SET league_config.current_phase=1, current_week=1')
    console.log('\nRun again with --commit to apply.')
    return
  }
  // 1. films
  let done = 0
  for (const c of changes) {
    const res = await fetch(`${URL}/rest/v1/films?id=eq.${encodeURIComponent(c.id)}`, {
      method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ phase: c.to.phase, week: c.to.week }),
    })
    if (!res.ok) { console.log(`  films ${c.id}: ${res.status} ${await res.text()}`); continue }
    done++
  }
  console.log(`films updated: ${done}/${changes.length}`)

  // 2. wipe gameplay
  for (const t of WIPE) {
    const res = await fetch(`${URL}/rest/v1/${t}?id=not.is.null`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } })
    console.log(`  ${t}: ${res.ok ? 'wiped' : res.status + ' ' + await res.text()}`)
  }

  // 3. league_config
  const res = await fetch(`${URL}/rest/v1/league_config?id=not.is.null`, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ current_phase: 1, current_week: 1 }),
  })
  console.log(`  league_config: ${res.ok ? 'set phase 1 / week 1' : res.status + ' ' + await res.text()}`)

  // 4. verify
  const v = await (await fetch(`${URL}/rest/v1/films?select=phase`, { headers: { ...H, Prefer: 'count=exact' } })).json()
  const dist = v.reduce((m, r) => (m[r.phase] = (m[r.phase] || 0) + 1, m), {})
  console.log('\nverify — films phase distribution now:', dist)
  for (const t of WIPE) {
    const rows = await (await fetch(`${URL}/rest/v1/${t}?select=id`, { headers: H })).json()
    console.log(`verify — ${t}: ${rows.length} rows`)
  }
  const lc = await (await fetch(`${URL}/rest/v1/league_config?select=current_phase,current_week`, { headers: H })).json()
  console.log('verify — league_config:', lc)
}
main()
