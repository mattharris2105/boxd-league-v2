// Backfill films.tmdb_id (TMDB) and films.rt (Rotten Tomatoes, via OMDb).
// Only fills nulls unless --refresh. Dry-run unless --commit.
// No-ops gracefully (exit 0) if TMDB_TOKEN / OMDB_KEY aren't set.
//
//   node scripts/sync-metadata.mjs               # dry run
//   node scripts/sync-metadata.mjs --commit
//   node scripts/sync-metadata.mjs --commit --refresh   # re-fetch even if set
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
const OMDB = (env.OMDB_KEY || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
if (!TMDB && !OMDB) { console.log('Neither TMDB_TOKEN nor OMDB_KEY set — nothing to do.'); process.exit(0) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function sb (path, init) {
  const res = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } })
  const text = await res.text()
  let body; try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  return body
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const year = (d) => (d && /^\d{4}/.test(d) ? d.slice(0, 4) : null)

async function tmdbId (title, yr) {
  if (!TMDB) return null
  const q = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=en-US&include_adult=false${yr ? `&year=${yr}` : ''}`
  const res = await fetch(q, { headers: { Authorization: `Bearer ${TMDB}` } })
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  const j = await res.json()
  const hit = (j.results || [])[0]
  return hit ? hit.id : null
}
async function omdbRt (title, yr) {
  if (!OMDB) return null
  const q = `https://www.omdbapi.com/?apikey=${OMDB}&t=${encodeURIComponent(title)}${yr ? `&y=${yr}` : ''}`
  const res = await fetch(q)
  if (!res.ok) throw new Error(`OMDb ${res.status}`)
  const j = await res.json()
  if (j.Response === 'False') return null
  const r = (j.Ratings || []).find((x) => x.Source === 'Rotten Tomatoes')
  const m = r && /(\d+)%/.exec(r.Value)
  return m ? Number(m[1]) : null
}

const films = await sb('films?select=id,title,alt_titles,release_date,tmdb_id,rt')
if (!Array.isArray(films)) { console.error(films); process.exit(1) }

const log = { id: randomUUID(), run_at: new Date().toISOString(), source: 'tmdb+omdb', films_checked: 0, films_updated: 0, conflicts: [], errors: [], status: 'success' }
const rows = [['title', 'year', 'tmdb_id', 'rt', 'note']]
let checked = 0, updated = 0

for (const f of films) {
  const needId = TMDB && (REFRESH || f.tmdb_id == null)
  const needRt = OMDB && (REFRESH || f.rt == null)
  if (!needId && !needRt) continue
  checked++
  const yr = year(f.release_date)
  const patch = {}
  try {
    if (needId) { const id = await tmdbId(f.title, yr); if (id && id !== f.tmdb_id) patch.tmdb_id = id }
    if (needRt) { await sleep(120); const rt = await omdbRt(f.title, yr); if (rt != null && rt !== f.rt) patch.rt = rt }
  } catch (e) {
    log.errors.push({ film: f.id, error: e.message })
    rows.push([f.title, yr ?? '', '', '', `ERROR ${e.message}`])
    continue
  }
  if (!Object.keys(patch).length) { log.conflicts.push({ title: f.title, reason: 'no match' }); rows.push([f.title, yr ?? '', '', '', 'no match']); continue }
  rows.push([f.title, yr ?? '', patch.tmdb_id ?? f.tmdb_id ?? '', patch.rt ?? f.rt ?? '', COMMIT ? 'written' : 'would write'])
  if (COMMIT) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(f.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(patch) })
    if (!r.ok) { log.errors.push({ film: f.id, error: await r.text() }); continue }
  }
  updated++
}

log.films_checked = checked
log.films_updated = updated
if (log.errors.length) log.status = updated ? 'partial' : 'failed'

console.log(rows.map((r) => r.join('\t')).join('\n'))
console.log(`\n${COMMIT ? 'COMMIT' : 'DRY RUN'} · ${checked} checked · ${updated} updated · ${log.conflicts.length} no-match · ${log.errors.length} errors · ${log.status}`)
if (COMMIT) await fetch(`${U}/rest/v1/sync_log`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(log) })
if (log.status === 'failed') process.exitCode = 1
