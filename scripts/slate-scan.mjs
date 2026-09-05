// Weekly slate scan for BOXD — the read-only half of slate maintenance.
//
// Diffs the forward theatrical calendar (The Numbers release schedule) against
// the films table and writes a proposal file:
//   1. NEW FILMS — wide releases, plus limited releases from a buzzy distributor,
//      that are in the calendar within the window but not yet in the slate.
//   2. NEEDS A PROJECTION — films already in the slate whose release is inside
//      the window but that still have no est_m (so no real IPO price).
//
// It NEVER writes to Supabase. It only reads films + emits a markdown table for
// a human (or the weekly agent) to review, fill in est_m, and apply.
//
//   node scripts/slate-scan.mjs                 # 16-week window, writes proposals/slate-<today>.md
//   node scripts/slate-scan.mjs --weeks 20
//   node scripts/slate-scan.mjs --print         # also dump the tables to stdout
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const WEEKS = Number(flag('--weeks', 16))
const PRINT = args.includes('--print')

let env = { ...process.env }
try {
  for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch { /* CI: rely on process.env */ }
const U = (env.SUPABASE_URL || 'https://yxluqkfanhzktinayvex.supabase.co').trim().replace(/\/+$/, '')
const KEY = (env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Distributors whose *limited* releases are worth surfacing (awards / arthouse
// buzz). Wide releases from anyone are surfaced regardless.
const BUZZY = [
  'a24', 'neon', 'focus features', 'searchlight', 'sony pictures classics',
  'mubi', 'apple', 'netflix', 'amazon mgm', 'amazon mgm studios', 'bleecker street',
  'angel studios', 'gkids', 'magnolia', 'ifc films', 'roadside attractions',
  'utopia', 'briarcliff entertainment', 'lionsgate', 'metrograph pictures',
  'oscilloscope', 'kino lorber', 'janus films', 'sideshow',
]

const norm = (s) => (s || '')
  .toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[’'`]/g, '').replace(/&/g, ' and ')
  .replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim()

// ── current slate ────────────────────────────────────────────────────────────
const films = await (await fetch(
  `${U}/rest/v1/films?select=id,title,alt_titles,dist,est_m,phase,release_date&active=eq.true`,
  { headers: H },
)).json()
if (!Array.isArray(films)) { console.error('films query failed:', films); process.exit(1) }

const known = new Set()
for (const f of films) {
  known.add(norm(f.title))
  for (const a of f.alt_titles || []) known.add(norm(a))
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

const isWide = (t) => /wide|imax/i.test(t) && !/re-release/i.test(t)
const isBuzzyLimited = (r) => /limited|special engagement/i.test(r.type) &&
  BUZZY.some((b) => norm(r.dist).includes(norm(b)))
// The Numbers marks a film "Wide" for its home-territory release too; a
// country-suffixed slug (…-(2026-India)) is almost never a US/UK slate film.
const isForeign = (slug) => /-\(20\d\d-[A-Za-z][^)]+\)$/.test(slug)
// Event cinema / concert films — not box-office-league material.
const isEvent = (r) => /trafalgar|fathom/i.test(r.dist) ||
  /\b(live|tour|concert|in concert|the movie experience|presents)\b|:\s|world tour/i.test(r.title) && /trafalgar|fathom|abramorama|iconic events|cinedigm/i.test(r.dist)

const seen = new Set()
const adds = inWindow
  .filter((r) => !/re-release/i.test(r.type))
  .filter((r) => !isForeign(r.slug))
  .filter((r) => !isEvent(r))
  .filter((r) => isWide(r.type) || isBuzzyLimited(r))
  .filter((r) => !known.has(norm(r.title)))
  .filter((r) => { const k = norm(r.title) + r.date; if (seen.has(k)) return false; seen.add(k); return true })
  .sort((a, b) => a.date.localeCompare(b.date))

// ── slate films still missing a projection ───────────────────────────────────
const needEst = films
  .filter((f) => f.est_m == null && f.phase !== 0 && f.release_date)
  .filter((f) => f.release_date <= iso(horizon))
  .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))

// ── write proposal ──────────────────────────────────────────────────────────
const gsearch = (t) => `https://www.google.com/search?q=${encodeURIComponent(`"${t}" opening weekend box office projection tracking`)}`
const tnLink = (slug) => `https://www.the-numbers.com/movie/${slug}`

const stamp = iso(today)
let md = `# BOXD slate proposal — ${stamp}

Auto-generated by \`scripts/slate-scan.mjs\` (${WEEKS}-week window, to ${iso(horizon)}).
**Nothing here is written to the database.** Review each row, fill in \`est_m\`
($M opening weekend), then apply with a one-off script or by hand. \`base_price\`
comes from \`calcIPOprice(est_m)\` — no need to fill it in.

Web tracking numbers are estimates: sanity-check against the listed comps and
your own read before trusting them, per the project's data rules.

## 1. New films to add (${adds.length})

| Release | Title | Distributor | Type | est_m | Research |
|---|---|---|---|---|---|
`
for (const r of adds) {
  md += `| ${r.date} | ${r.title} | ${r.dist} | ${r.type} | _?_ | [tracking](${gsearch(r.title)}) · [TN](${tnLink(r.slug)}) |\n`
}

md += `\n## 2. Slate films still missing a projection (${needEst.length})\n\n`
md += '| Release | Title | Distributor | est_m | Research |\n|---|---|---|---|---|\n'
for (const f of needEst) {
  md += `| ${f.release_date} | ${f.title} | ${f.dist || ''} | _?_ | [tracking](${gsearch(f.title)}) |\n`
}

md += `\n---\n\n### How to apply the approved rows

1. Edit this file: replace each \`_?_\` with a number.
2. For **new films**, also confirm distributor / release-type / date.
3. Run an apply step that, for each filled row:
   - new film → \`INSERT\` into \`films\` (title, dist, genre, est_m, release_date,
     base_price = \`calcIPOprice(est_m)\`, active = true), then
     \`scripts/recompute-week-phase.mjs --commit\`;
   - existing film → \`PATCH films\` set \`est_m\`, \`base_price\`.
4. \`node scripts/marketValue.test.mjs\` and \`npm run build\` before pushing.
`

mkdirSync(resolve(root, 'proposals'), { recursive: true })
const out = resolve(root, 'proposals', `slate-${stamp}.md`)
writeFileSync(out, md)

console.log(`scanned ${rows.length} calendar rows · ${inWindow.length} in the next ${WEEKS} weeks`)
console.log(`→ ${adds.length} new films to add · ${needEst.length} slate films missing a projection`)
console.log(`written: ${out.replace(root + '/', '').replace(root + '\\', '')}`)
if (PRINT) console.log('\n' + md)
