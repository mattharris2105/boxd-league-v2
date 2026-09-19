// Backfill films.trailer from TMDB's videos endpoint, for films that already
// have a tmdb_id (from sync-metadata.mjs). Fills nulls unless --refresh.
// Dry-run unless --commit. No-op (exit 0) if TMDB_TOKEN isn't set.
//
//   node scripts/scrape-trailers.mjs                 # dry run
//   node scripts/scrape-trailers.mjs --commit
//   node scripts/scrape-trailers.mjs --commit --refresh
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
  for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch {}
const U = (env.SUPABASE_URL || 'https://yxluqkfanhzktinayvex.supabase.co').trim().replace(/\/+$/, '')
const KEY = (env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const TMDB = (env.TMDB_TOKEN || env.REACT_APP_TMDB_TOKEN || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
if (!TMDB) { console.log('TMDB_TOKEN not set — nothing to do.'); process.exit(0) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const TMDB_IS_V4 = /^eyJ/.test(TMDB) || TMDB.split('.').length === 3

async function sb (path, init) {
  const res = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } })
  const text = await res.text()
  let body; try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  return body
}

// Pick the best YouTube trailer from TMDB's /movie/{id}/videos results:
// official Trailer first, then any Trailer, then official Teaser, then
// anything on YouTube — earliest published within whichever tier wins (the
// first trailer released, not a later re-cut or a TV spot).
function pickTrailer (results) {
  const yt = (results || []).filter(v => v.site === 'YouTube' && v.key)
  const byDate = (a, b) => new Date(a.published_at || 0) - new Date(b.published_at || 0)
  const tiers = [
    yt.filter(v => v.type === 'Trailer' && v.official),
    yt.filter(v => v.type === 'Trailer'),
    yt.filter(v => v.type === 'Teaser' && v.official),
    yt,
  ]
  for (const tier of tiers) { if (tier.length) return tier.sort(byDate)[0] }
  return null
}

async function tmdbVideos (tmdbId) {
  const url = TMDB_IS_V4
    ? `https://api.themoviedb.org/3/movie/${tmdbId}/videos?language=en-US`
    : `https://api.themoviedb.org/3/movie/${tmdbId}/videos?language=en-US&api_key=${TMDB}`
  const res = await fetch(url, TMDB_IS_V4 ? { headers: { Authorization: `Bearer ${TMDB}` } } : {})
  if (!res.ok) throw new Error(`TMDB ${res.status}${res.status === 401 ? ` (token looks like ${TMDB_IS_V4 ? 'a v4 read token' : 'a v3 API key'})` : ''}`)
  const body = await res.json()
  return body.results || []
}

const films = await sb('films?select=id,title,tmdb_id,trailer&tmdb_id=not.is.null')
if (!Array.isArray(films)) { console.error(films); process.exit(1) }

const targets = films.filter(f => REFRESH || !f.trailer)
console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  ${targets.length} film(s) with a tmdb_id to check`)

const log = { id: randomUUID(), run_at: new Date().toISOString(), source: 'tmdb-trailers', films_checked: targets.length, films_updated: 0, conflicts: [], errors: [], status: 'success' }
let updated = 0

for (const f of targets) {
  try {
    const vids = await tmdbVideos(f.tmdb_id)
    const pick = pickTrailer(vids)
    if (!pick) { log.conflicts.push({ title: f.title, reason: 'no YouTube trailer on TMDB' }); console.log(`  ??  ${f.title}`); continue }
    const embed = `https://www.youtube.com/embed/${pick.key}`
    if (embed === f.trailer) continue
    console.log(`  ${f.title}  ->  ${embed}${pick.official ? '' : '  (unofficial)'}`)
    if (COMMIT) {
      const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(f.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ trailer: embed }) })
      if (!r.ok) { log.errors.push({ film: f.id, error: await r.text() }); continue }
    }
    updated++
  } catch (e) { log.errors.push({ film: f.id, error: e.message }); console.log(`  ERR ${f.title}: ${e.message}`) }
}

if (COMMIT) {
  log.films_updated = updated
  if (log.errors.length) log.status = updated ? 'partial' : 'failed'
  await fetch(`${U}/rest/v1/sync_log`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(log) })
}

console.log(`\n${COMMIT ? 'COMMIT' : 'DRY RUN'} · ${targets.length} checked · ${updated} trailer(s) set · ${log.conflicts.length} no-trailer-found · ${log.errors.length} errors`)
