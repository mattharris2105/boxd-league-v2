// ROLLBACK — restores tables from a backup snapshot into Supabase.
// For each named table: DELETE all rows, then re-insert the snapshot rows.
// Usage:
//   node scripts/restore-db.mjs --snapshot <dir-name> --tables films,results,rosters
//   node scripts/restore-db.mjs --snapshot <dir-name> --all
//   add --dry-run to print what it would do without writing
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = {}
for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const URL = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const args = process.argv.slice(2)
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null }
const DRY = args.includes('--dry-run')
let snapName = get('--snapshot')
const backupsDir = resolve(root, 'backups')
if (!snapName) snapName = readdirSync(backupsDir).filter(d => /\d{4}-\d{2}-\d{2}T/.test(d)).sort().pop()
const snap = resolve(backupsDir, snapName)

const manifest = JSON.parse(readFileSync(resolve(snap, '_manifest.json'), 'utf8'))
let tables
if (args.includes('--all')) tables = Object.keys(manifest.tables).filter(t => typeof manifest.tables[t] === 'number')
else {
  const t = get('--tables'); if (!t) { console.error('need --tables a,b,c  or  --all'); process.exit(1) }
  tables = t.split(',').map(s => s.trim())
}

// primary keys for tables whose rows carry no surrogate id
const PK = { results: 'film_id', film_values: 'film_id', league_config: 'id' }

console.log(`${DRY ? '[DRY RUN] ' : ''}Restore from backups/${snapName} -> ${URL}`)
for (const t of tables) {
  const rows = JSON.parse(readFileSync(resolve(snap, `${t}.json`), 'utf8'))
  if (DRY) { console.log(`  ${t.padEnd(24)} would DELETE all, INSERT ${rows.length}`); continue }
  // delete all
  const pk = PK[t] || 'id'
  let del = await fetch(`${URL}/rest/v1/${t}?${pk}=not.is.null`, { method: 'DELETE', headers: H })
  if (!del.ok) { console.log(`  ${t}: DELETE failed ${del.status} ${await del.text()}`); continue }
  // insert in chunks
  let ok = 0
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500)
    const res = await fetch(`${URL}/rest/v1/${t}`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(chunk) })
    if (!res.ok) { console.log(`  ${t}: INSERT failed ${res.status} ${await res.text()}`); break }
    ok += chunk.length
  }
  console.log(`  ${t.padEnd(24)} restored ${ok}/${rows.length}`)
}
console.log('Done.')
