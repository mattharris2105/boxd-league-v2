// Scrape Rotten Tomatoes Tomatometer (critics score) into films.rt.
// Only for films that have already released. Fills nulls unless --refresh.
// Dry-run unless --commit.
//
//   node scripts/scrape-rt.mjs                 # dry run
//   node scripts/scrape-rt.mjs --commit
//   node scripts/scrape-rt.mjs --commit --refresh
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
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function sb (path, init) {
  const res = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } })
  const text = await res.text()
  let body; try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  return body
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
const slugify = (t) => norm(t).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

function candidates (title, alts, yr) {
  const bases = new Set()
  for (const t of [title, ...alts]) {
    const s = slugify(t)
    if (!s) continue
    bases.add(s)
    bases.add(s.replace(/^the_/, ''))               // "the_odyssey" -> "odyssey"
    bases.add(s.replace(/^the_(.+)$/, '$1_the'))    // "the_odyssey" -> "odyssey_the" (RT's convention)
  }
  const out = []
  for (const b of bases) { if (yr) out.push(`${b}_${yr}`); out.push(b) }
  return [...new Set(out)]
}

// pull the critics score + the page's own title out of an RT movie page
function parseRt (html) {
  const sc = html.match(/"criticsScore"\s*:\s*\{[^}]*?"score"\s*:\s*"?(\d{1,3})"?/i)
  if (!sc) return null
  const score = Number(sc[1])
  if (!(score >= 0 && score <= 100)) return null
  const t = (html.match(/<title>([^<|]+?)\s*(?:\||-)\s*Rotten Tomatoes<\/title>/i) || [])[1] || ''
  return { score, pageTitle: t.trim() }
}

const TODAY = new Date().toISOString().slice(0, 10)
const films = await sb('films?select=id,title,alt_titles,release_date,rt,phase')
if (!Array.isArray(films)) { console.error(films); process.exit(1) }

const targets = films.filter((f) => f.release_date && f.release_date <= TODAY && (REFRESH || f.rt == null))
console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  ${targets.length} released films to look up`)

const log = { id: randomUUID(), run_at: new Date().toISOString(), source: 'rottentomatoes', films_checked: targets.length, films_updated: 0, conflicts: [], errors: [], status: 'success' }
const matched = [], unmatched = []

for (const f of targets) {
  const yr = /^\d{4}/.test(f.release_date || '') ? f.release_date.slice(0, 4) : null
  const alts = Array.isArray(f.alt_titles) ? f.alt_titles
    : (typeof f.alt_titles === 'string' ? f.alt_titles.split(/[|,;]/).map((s) => s.trim()).filter(Boolean) : [])
  const want = norm(f.title).replace(/[^a-z0-9]+/g, ' ').trim()
  let hit = null, usedSlug = null
  for (const slug of candidates(f.title, alts, yr)) {
    try {
      const res = await fetch(`https://www.rottentomatoes.com/m/${slug}`, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(15000) })
      if (res.status !== 200) continue
      const p = parseRt(await res.text())
      if (!p) continue
      // guard: the RT page's title should share most words with ours
      const got = norm(p.pageTitle).replace(/[^a-z0-9]+/g, ' ').trim()
      const w = want.split(' ').filter((x) => x.length > 2)
      const overlap = w.length ? w.filter((x) => got.includes(x)).length / w.length : 1
      if (overlap < 0.6) continue
      hit = p.score; usedSlug = slug; break
    } catch (e) { /* try next candidate */ }
    await sleep(150)
  }
  if (hit == null) { unmatched.push(f.title); console.log(`  ??  ${f.title}`); await sleep(250); continue }
  matched.push({ id: f.id, title: f.title, rt: hit, slug: usedSlug })
  console.log(`  ${String(hit).padStart(3)}%  ${f.title}   (m/${usedSlug})`)
  await sleep(250)
}

if (COMMIT) {
  for (const m of matched) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(m.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ rt: m.rt }) })
    if (!r.ok) log.errors.push({ film: m.id, error: await r.text() })
  }
  log.films_updated = matched.length - log.errors.length
  log.conflicts = unmatched.map((t) => ({ title: t, reason: 'no RT page matched' }))
  if (log.errors.length) log.status = log.films_updated ? 'partial' : 'failed'
  await fetch(`${U}/rest/v1/sync_log`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(log) })
}

console.log(`\n${matched.length} matched · ${unmatched.length} not found`)
if (unmatched.length) console.log('not found (enter by hand): ' + unmatched.join(', '))
if (!COMMIT) console.log('\nRun with --commit to write.')
