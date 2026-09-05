// Weekly slate scan for BOXD — the read-only half of slate maintenance.
//
// Diffs the forward theatrical calendar (The Numbers release schedule) against
// the films table and writes rows to `film_suggestions` (status = 'pending'):
//   1. kind 'new'      — wide releases, plus limited releases from a buzzy
//      distributor, that are in the calendar within the window but not yet in
//      the slate. TMDB id looked up so the poster is right from the start.
//   2. kind 'estimate' — films already in the slate whose release is inside the
//      window but that still have no est_m (so no real IPO price).
//
// The commissioner approves or dismisses each one from the in-app
// Commissioner -> Suggestions tab. This script NEVER writes to `films`.
//
//   node scripts/slate-scan.mjs                 # 16-week window, upsert pending suggestions
//   node scripts/slate-scan.mjs --weeks 20
//   node scripts/slate-scan.mjs --dry           # print what it would add, write nothing
//   node scripts/slate-scan.mjs --file          # also write a proposals/slate-<date>.md paper trail
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const WEEKS = Number(flag('--weeks', 16))
const DRY = args.includes('--dry')
const WRITE_FILE = args.includes('--file')

let env = { ...process.env }
try {
  for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch { /* CI: rely on process.env */ }
const U = (env.SUPABASE_URL || 'https://yxluqkfanhzktinayvex.supabase.co').trim().replace(/\/+$/, '')
const KEY = (env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
const TMDB = (env.TMDB_TOKEN || env.REACT_APP_TMDB_TOKEN || '').trim()
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function sb (path, init) {
  const res = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } })
  const text = await res.text()
  let body; try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  return body
}

// TMDB accepts a v4 read token (JWT, Bearer) or a v3 API key (?api_key=)
const TMDB_IS_V4 = /^eyJ/.test(TMDB) || TMDB.split('.').length === 3
async function tmdbLookup (title, yr) {
  if (!TMDB) return null
  try {
    const base = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=en-US&include_adult=false${yr ? `&year=${yr}` : ''}`
    const url = TMDB_IS_V4 ? base : `${base}&api_key=${TMDB}`
    const res = await fetch(url, TMDB_IS_V4 ? { headers: { Authorization: `Bearer ${TMDB}` } } : {})
    if (!res.ok) return null
    const j = await res.json()
    const hit = (j.results || [])[0]
    if (!hit) return null
    return { tmdb_id: hit.id, tmdb_title: hit.title, tmdb_year: (hit.release_date || '').slice(0, 4) || null }
  } catch { return null }
}

const norm = (s) => (s || '')
  .toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[’'`]/g, '').replace(/&/g, ' and ')
  .replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim()

// ── current slate ────────────────────────────────────────────────────────────
const films = await sb('films?select=id,title,alt_titles,dist,est_m,phase,release_date&active=eq.true')
if (!Array.isArray(films)) { console.error('films query failed:', films); process.exit(1) }
const known = new Set()
for (const f of films) {
  known.add(norm(f.title))
  for (const a of f.alt_titles || []) known.add(norm(a))
}

// rows already proposed (any status) — never re-surface a dismissed one
let seenKeys = new Set()
try {
  const existing = await sb('film_suggestions?select=dedupe_key,status')
  seenKeys = new Set((Array.isArray(existing) ? existing : []).map((r) => r.dedupe_key))
} catch (e) {
  if (/relation .*film_suggestions.* does not exist|Could not find the table/i.test(e.message)) {
    console.error('film_suggestions table not found — run supabase/migrations/20260905_film_suggestions.sql first.')
    if (!DRY) process.exit(1)
  } else throw e
}

// ── forward calendar ─────────────────────────────────────────────────────────
const html = await (await fetch('https://www.the-numbers.com/movies/release-schedule', { headers: { 'User-Agent': UA } })).text()

const today = new Date(); today.setUTCHours(0, 0, 0, 0)
const horizon = new Date(today); horizon.setUTCDate(horizon.getUTCDate() + WEEKS * 7)
const iso = (d) => d.toISOString().slice(0, 10)

const rows = []
let curDate = null
for (const tr of html.split(/<tr[ >]/).slice(1)) {
  const dm = tr.match(/id="(\d{4}-\d{2}-\d{2})"/)
  if (dm) curDate = dm[1]
  const am = tr.match(/href="\/movie\/([^"]+)">([^<]+)<\/a>/)
  if (!curDate || !am) continue
  const after = tr.slice(am.index + am[0].length)
  const typeM = after.match(/^<\/b>\s*\(([^)]+)\)/)
  const type = typeM ? typeM[1] : ''
  const tds = [...tr.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
  const dist = tds.find((t, i) => i >= 2 && t && !/^\$/.test(t) && !/^\d[\d,]*$/.test(t)) || tds[2] || ''
  rows.push({
    date: curDate,
    title: am[2].replace(/&#8217;|&rsquo;/g, '’').replace(/&amp;/g, '&').trim(),
    slug: am[1],
    type,
    dist,
  })
}
const inWindow = rows.filter((r) => r.date >= iso(today) && r.date <= iso(horizon))

// Distributors whose *limited* releases are worth surfacing (awards / arthouse
// buzz). Wide releases from anyone are surfaced regardless.
const BUZZY = [
  'a24', 'neon', 'focus features', 'searchlight', 'sony pictures classics',
  'mubi', 'apple', 'netflix', 'amazon mgm', 'amazon mgm studios', 'bleecker street',
  'angel studios', 'gkids', 'magnolia', 'ifc films', 'roadside attractions',
  'utopia', 'briarcliff entertainment', 'lionsgate', 'metrograph pictures',
  'oscilloscope', 'kino lorber', 'janus films', 'sideshow',
]
const isWide = (t) => /wide|imax/i.test(t) && !/re-release/i.test(t)
const isBuzzyLimited = (r) => /limited|special engagement/i.test(r.type) &&
  BUZZY.some((b) => norm(r.dist).includes(norm(b)))
const isForeign = (slug) => /-\(20\d\d-[A-Za-z][^)]+\)$/.test(slug)
const isEvent = (r) => /trafalgar|fathom/i.test(r.dist) ||
  (/\b(live|tour|concert|world tour)\b|:\s.*\btour\b/i.test(r.title) && /abramorama|iconic events|cinedigm/i.test(r.dist))

const seen = new Set()
const addRows = inWindow
  .filter((r) => !/re-release/i.test(r.type))
  .filter((r) => !isForeign(r.slug))
  .filter((r) => !isEvent(r))
  .filter((r) => isWide(r.type) || isBuzzyLimited(r))
  .filter((r) => !known.has(norm(r.title)))
  .filter((r) => { const k = norm(r.title) + r.date; if (seen.has(k)) return false; seen.add(k); return true })
  .sort((a, b) => a.date.localeCompare(b.date))

// slate films still missing a projection
const estRows = films
  .filter((f) => f.est_m == null && f.phase !== 0 && f.release_date && f.release_date <= iso(horizon))
  .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))

// ── build suggestion payloads ───────────────────────────────────────────────
const gsearch = (t) => `https://www.google.com/search?q=${encodeURIComponent(`"${t}" opening weekend box office projection tracking`)}`
const tnLink = (slug) => `https://www.the-numbers.com/movie/${slug}`

const pending = []
for (const r of addRows) {
  const key = `${norm(r.title)}|${r.date}`
  if (seenKeys.has(key)) continue
  const tmdb = await tmdbLookup(r.title, r.date.slice(0, 4))
  pending.push({
    kind: 'new', status: 'pending',
    title: r.title, dist: r.dist, release_date: r.date, release_type: r.type,
    est_m: null, est_src: null,
    tmdb_id: tmdb?.tmdb_id ?? null, tmdb_title: tmdb?.tmdb_title ?? null, tmdb_year: tmdb?.tmdb_year ?? null,
    notes: `Tracking: ${gsearch(r.title)}\nThe Numbers: ${tnLink(r.slug)}`,
    dedupe_key: key,
  })
}
for (const f of estRows) {
  const key = `est|${f.id}`
  if (seenKeys.has(key)) continue
  pending.push({
    kind: 'estimate', status: 'pending', film_id: f.id,
    title: f.title, dist: f.dist || null, release_date: f.release_date,
    est_m: null, est_src: null,
    notes: `Existing slate film with no projection.\nTracking: ${gsearch(f.title)}`,
    dedupe_key: key,
  })
}

console.log(`scanned ${rows.length} calendar rows · ${inWindow.length} in the next ${WEEKS} weeks`)
console.log(`→ ${addRows.length} new-film candidates · ${estRows.length} missing a projection · ${pending.length} not yet proposed`)
for (const p of pending) console.log(`   [${p.kind}] ${p.release_date || '—'}  ${p.title}${p.tmdb_id ? `  (tmdb ${p.tmdb_id} → ${p.tmdb_title} ${p.tmdb_year || ''})` : p.kind === 'new' ? '  (no TMDB match)' : ''}`)

if (WRITE_FILE) {
  const stamp = iso(today)
  let md = `# BOXD slate proposal — ${stamp}\n\nGenerated by \`scripts/slate-scan.mjs\`. These are also queued in the app under\nCommissioner → Suggestions. Nothing is written to \`films\` until you approve.\n\n`
  md += `## New films (${addRows.length})\n\n| Release | Title | Distributor | Type | TMDB |\n|---|---|---|---|---|\n`
  for (const p of pending.filter((x) => x.kind === 'new')) md += `| ${p.release_date} | ${p.title} | ${p.dist} | ${p.release_type} | ${p.tmdb_id ? `${p.tmdb_id} (${p.tmdb_title} ${p.tmdb_year || ''})` : '—'} |\n`
  md += `\n## Missing a projection (${estRows.length})\n\n| Release | Title | Distributor |\n|---|---|---|\n`
  for (const p of pending.filter((x) => x.kind === 'estimate')) md += `| ${p.release_date} | ${p.title} | ${p.dist || ''} |\n`
  mkdirSync(resolve(root, 'proposals'), { recursive: true })
  writeFileSync(resolve(root, 'proposals', `slate-${stamp}.md`), md)
  console.log(`paper trail: proposals/slate-${stamp}.md`)
}

if (DRY) { console.log('\n--dry: nothing written'); process.exit(0) }
if (!pending.length) { console.log('\nnothing new to queue'); process.exit(0) }

const res = await sb('film_suggestions?on_conflict=dedupe_key', {
  method: 'POST',
  headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
  body: JSON.stringify(pending),
})
console.log(`\nqueued ${pending.length} suggestion${pending.length === 1 ? '' : 's'} (pending) — approve them in the app`)
