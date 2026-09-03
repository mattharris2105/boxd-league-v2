// Backfill films.tmdb_id from TMDB search (exact poster lookups depend on it).
// RT scores are handled separately by scripts/scrape-rt.mjs — OMDb has no
// usable current-year Rotten Tomatoes coverage.
// Fills nulls unless --refresh. Dry-run unless --commit.
// No-ops (exit 0) if TMDB_TOKEN isn't set.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const COMMIT = args.includes('--commit')
const REFRESH = args.includes('--refresh')

let env = { ...process.env }
try {
  for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch {}
const U = (env.SUPABASE_URL || 'https://yxluqkfanhzktinayvex.supabase.co').trim().replace(/\/+$/, '')
const KEY = (env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const TMDB = (env.TMDB_TOKEN || env.REACT_APP_TMDB_TOKEN || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
if (!TMDB) { console.log('TMDB_TOKEN not set — nothing to do.'); process.exit(0) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function sb (path, init) {
  const res = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } })
  const text = await res.text()
  let body; try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  return body
}
const year = (d) => (d && /^\d{4}/.test(d) ? d.slice(0, 4) : null)

// TMDB accepts a v4 read token (JWT "eyJ…", Bearer header) or a v3 API key (?api_key=)
const TMDB_IS_V4 = /^eyJ/.test(TMDB) || TMDB.split('.').length === 3
async function tmdbSearch (title, yr) {
  const sep = '&'
  const base = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=en-US&include_adult=false${yr ? `&year=${yr}` : ''}`
  const url = TMDB_IS_V4 ? base : `${base}${sep}api_key=${TMDB}`
  const res = await fetch(url, TMDB_IS_V4 ? { headers: { Authorization: `Bearer ${TMDB}` } } : {})
  if (!res.ok) throw new Error(`TMDB ${res.status}${res.status === 401 ? ` (token looks like ${TMDB_IS_V4 ? 'a v4 read token' : 'a v3 API key'})` : ''}`)
  const j = await res.json()
  return (j.results || [])[0] || null
}

const films = await sb('films?select=id,title,release_date,tmdb_id')
if (!Array.isArray(films)) { console.error(films); process.exit(1) }

const log = { id: randomUUID(), run_at: new Date().toISOString(), source: 'tmdb', films_checked: 0, films_updated: 0, conflicts: [], errors: [], status: 'success' }
let checked = 0, updated = 0

for (const f of films) {
  if (!REFRESH && f.tmdb_id != null) continue
  checked++
  try {
    const hit = await tmdbSearch(f.title, year(f.release_date))
    if (!hit) { log.conflicts.push({ title: f.title, reason: 'no TMDB match' }); console.log(`  ??  ${f.title}`); continue }
    if (hit.id === f.tmdb_id) continue
    console.log(`  ${hit.id}  ${f.title}`)
    if (COMMIT) {
      const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(f.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ tmdb_id: hit.id }) })
      if (!r.ok) { log.errors.push({ film: f.id, error: await r.text() }); continue }
    }
    updated++
  } catch (e) { log.errors.push({ film: f.id, error: e.message }); console.log(`  ERR ${f.title}: ${e.message}`) }
}

log.films_checked = checked
log.films_updated = updated
if (log.errors.length) log.status = updated ? 'partial' : 'failed'
console.log(`\n${COMMIT ? 'COMMIT' : 'DRY RUN'} · ${checked} checked · ${updated} tmdb_id set · ${log.conflicts.length} no-match · ${log.errors.length} errors`)
if (COMMIT) await fetch(`${U}/rest/v1/sync_log`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(log) })
if (log.status === 'failed') process.exitCode = 1
