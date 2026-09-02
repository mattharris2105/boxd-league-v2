// Full read-only backup of the BOXD Supabase database.
// Dumps every exposed table to backups/<timestamp>/<table>.json plus a manifest.
// Usage: node scripts/backup-db.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// minimal .env.local parser
const env = {}
for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const URL = env.SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_KEY
if (!URL || !KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY missing from .env.local')

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function listTables () {
  const res = await fetch(`${URL}/rest/v1/`, { headers: H })
  if (!res.ok) throw new Error(`OpenAPI fetch failed: ${res.status} ${await res.text()}`)
  const spec = await res.json()
  return Object.keys(spec.definitions || spec.components?.schemas || {}).sort()
}

async function dumpTable (t) {
  const rows = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const res = await fetch(`${URL}/rest/v1/${t}?select=*`, {
      headers: { ...H, Range: `${from}-${from + page - 1}`, 'Range-Unit': 'items', Prefer: 'count=exact' },
    })
    if (!res.ok) {
      if (res.status === 416 && rows.length) break // range not satisfiable = past the end
      throw new Error(`${t}: ${res.status} ${await res.text()}`)
    }
    const batch = await res.json()
    rows.push(...batch)
    if (batch.length < page) break
  }
  return rows
}

const ts = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = resolve(root, 'backups', ts)
mkdirSync(outDir, { recursive: true })

const tables = await listTables()
const manifest = { takenAt: new Date().toISOString(), url: URL, tables: {} }
console.log(`Backing up ${tables.length} tables to backups/${ts}/\n`)
for (const t of tables) {
  try {
    const rows = await dumpTable(t)
    writeFileSync(resolve(outDir, `${t}.json`), JSON.stringify(rows, null, 2))
    manifest.tables[t] = rows.length
    console.log(`  ${t.padEnd(28)} ${String(rows.length).padStart(6)} rows`)
  } catch (e) {
    manifest.tables[t] = `ERROR: ${e.message}`
    console.log(`  ${t.padEnd(28)}  ERROR ${e.message}`)
  }
}
writeFileSync(resolve(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nManifest: backups/${ts}/_manifest.json`)
