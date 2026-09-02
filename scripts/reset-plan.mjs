// DRY RUN — computes the Task 1 season-reset plan and writes an approval CSV.
// Writes nothing to the database. Reads the latest backup snapshot.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const backupsDir = resolve(root, 'backups')
const latest = readdirSync(backupsDir).filter(d => /\d{4}-\d{2}-\d{2}T/.test(d)).sort().pop()
const snap = resolve(backupsDir, latest)
console.log(`Using snapshot: backups/${latest}\n`)

const films = JSON.parse(readFileSync(resolve(snap, 'films.json'), 'utf8'))

const OLD_ANCHOR = new Date('2026-06-25T00:00:00Z')
const NEW_ANCHOR = new Date('2026-09-07T00:00:00Z')
const P1_END = new Date('2026-11-29T00:00:00Z')   // Phase 1: NEW_ANCHOR .. P1_END
const P2_END = new Date('2027-01-31T00:00:00Z')   // Phase 2: .. P2_END ; Phase 3 after

const DAY = 86400000
// Derived release date = old anchor + (old week - 1) weeks. Week-bucket precision (±6d).
const derivedRelease = f => new Date(OLD_ANCHOR.getTime() + (f.week - 1) * 7 * DAY)

const newWeek = d => Math.max(1, Math.floor((d - NEW_ANCHOR) / (7 * DAY)) + 1)
const newPhase = (f, d) => {
  if (f.phase === 0) return 0                 // already archived — stays archived
  if (d < NEW_ANCHOR) return 0               // released before new anchor -> archive
  if (d <= P1_END) return 1
  if (d <= P2_END) return 2
  return 3
}

const rows = films.map(f => {
  const rel = derivedRelease(f)
  const relStr = f.phase === 0 ? '(pre-2026-06-25)' : rel.toISOString().slice(0, 10)
  const np = newPhase(f, rel)
  const nw = f.phase === 0 ? f.week : (np === 0 ? f.week : newWeek(rel))
  return {
    id: f.id, title: f.title,
    derived_release: relStr,
    old_phase: f.phase, new_phase: np,
    old_week: f.week, new_week: nw,
    moved: f.phase !== np ? 'MOVED' : '',
    boundary: (f.phase !== 0 && rel >= new Date('2026-08-28') && rel <= new Date('2026-09-21')) ? 'CHECK-DATE' : '',
  }
}).sort((a, b) => (a.new_phase - b.new_phase) || (a.new_week - b.new_week) || a.title.localeCompare(b.title))

// summary
const tally = (key) => rows.reduce((m, r) => (m[r[key]] = (m[r[key]] || 0) + 1, m), {})
console.log('OLD phase distribution:', tally('old_phase'))
console.log('NEW phase distribution:', tally('new_phase'))
console.log('Films moving to Phase 0 (archive):', rows.filter(r => r.old_phase !== 0 && r.new_phase === 0).length)
console.log('Films staying live:', rows.filter(r => r.new_phase !== 0).length)
console.log('Boundary films to eyeball against real dates:', rows.filter(r => r.boundary).length)

const csv = [
  'id,title,derived_release,old_phase,new_phase,old_week,new_week,moved,boundary',
  ...rows.map(r => [r.id, `"${r.title.replace(/"/g, '""')}"`, r.derived_release,
    r.old_phase, r.new_phase, r.old_week, r.new_week, r.moved, r.boundary].join(',')),
].join('\n')
const out = resolve(snap, 'reset-plan.csv')
writeFileSync(out, csv)
console.log(`\nFull mapping: backups/${latest}/reset-plan.csv`)

console.log('\n--- BOUNDARY FILMS (derived date within ~2wk of new anchor — verify real release date) ---')
rows.filter(r => r.boundary).forEach(r =>
  console.log(`  ${r.derived_release}  P${r.old_phase}->P${r.new_phase}  wk${r.old_week}->wk${r.new_week}  ${r.title}`))
