// Weekend box-office ingest for BOXD.
//
//   node scripts/ingest-box-office.mjs                     # last completed weekend, dry run
//   node scripts/ingest-box-office.mjs --commit            # ...and write to Supabase
//   node scripts/ingest-box-office.mjs --weekend 2026-09-11 --commit
//   node scripts/ingest-box-office.mjs --from 2026-07-10 --to 2026-08-28 --commit   # backfill
//
// Source: The Numbers dated weekend chart (…/box-office-chart/weekend/YYYY/MM/DD).
// "Days in Release" on that chart tells us which weekend a film is in:
//   3 days → opening weekend  → results.actual_m
//   10/17/24/31/38 days → weekend 2..6 → weekly_grosses.gross_m
// film_values.current_value is recomputed via the shared calcMarketValue.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { calcMarketValue } from '../src/lib/marketValue.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const DEBUG_ALL = args.includes('--debug-all') // report matches for ALL films incl. phase 0; never writes
const COMMIT = args.includes('--commit') && !DEBUG_ALL

// creds: .env.local locally, or process.env in CI
let env = { ...process.env }
try {
  for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch { /* CI: rely on process.env */ }
const U = (env.SUPABASE_URL || 'https://yxluqkfanhzktinayvex.supabase.co').trim().replace(/\/+$/, '')
const KEY = (env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function sb (path, init) {
  const res = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } })
  const text = await res.text()
  let body
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  return body
}
const BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// ── weekend date list ────────────────────────────────────────────────────────
const fmt = (d) => d.toISOString().slice(0, 10)
function lastCompletedFriday () {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  // walk back to Friday (day 5)
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() - 1)
  // if that Friday is < 3 days ago the weekend isn't done — step back a week
  if ((Date.now() - d.getTime()) < 3 * 86400000) d.setUTCDate(d.getUTCDate() - 7)
  return d
}
let weekends = []
if (flag('--from') && flag('--to')) {
  let d = new Date(flag('--from') + 'T00:00:00Z')
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1)
  const end = new Date(flag('--to') + 'T00:00:00Z')
  for (; d <= end; d.setUTCDate(d.getUTCDate() + 7)) weekends.push(fmt(new Date(d)))
} else if (flag('--weekend')) {
  weekends = [flag('--weekend')]
} else {
  weekends = [fmt(lastCompletedFriday())]
}

// ── the-numbers parser ──────────────────────────────────────────────────────
const deent = (s) => s.replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&#8217;/g, '’').trim()
function parseChart (html) {
  // the page renders both a desktop and a mobile table — parse the first only
  const firstTable = html.split(/<\/table>/i)[0]
  const out = []
  const seen = new Set()
  for (const chunk of firstTable.split(/<tr[>\s]/)) {
    if (!chunk.includes('/movie/')) continue
    const title = /<a href="\/movie\/[^"]*">([^<]+)<\/a>/.exec(chunk)?.[1]
    if (!title) continue
    const dollars = [...chunk.matchAll(/\$([\d,]+)/g)].map((m) => +m[1].replace(/,/g, ''))
    const nums = [...chunk.matchAll(/<td class="data">([\d,]+)<\/td>/g)].map((m) => +m[1].replace(/,/g, ''))
    const weekendGross = dollars[0]
    const days = nums[nums.length - 1]
    if (!weekendGross || !days) continue
    const grossM = Math.round(weekendGross / 1e5) / 10
    if (grossM < 0.05) continue // sub-$50k weekend — immaterial, skip the noise
    const t = deent(title)
    if (seen.has(t)) continue
    seen.add(t)
    out.push({ title: t, grossM, days })
  }
  return out
}
const weekendOf = (days) => Math.max(1, Math.round((days - 3) / 7) + 1)

// ── title matching ──────────────────────────────────────────────────────────
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
function altList (f) {
  if (!f.alt_titles) return []
  if (Array.isArray(f.alt_titles)) return f.alt_titles
  try { const j = JSON.parse(f.alt_titles); if (Array.isArray(j)) return j } catch {}
  return String(f.alt_titles).split(/[|,;]/).map((s) => s.trim()).filter(Boolean)
}
function matchFilm (scraped, films) {
  const t = norm(scraped)
  let m = films.find((f) => norm(f.title) === t || altList(f).some((a) => norm(a) === t))
  if (m) return { film: m, how: 'exact' }
  m = films.find((f) => { const ft = norm(f.title); return ft.length > 4 && (t.includes(ft) || ft.includes(t)) })
  if (m) return { film: m, how: 'substring' }
  const tw = t.split(' ').filter((w) => w.length > 2)
  let best = 0, bestF = null
  for (const f of films) {
    const fw = norm(f.title).split(' ').filter((w) => w.length > 2)
    const score = tw.filter((w) => fw.includes(w)).length / Math.max(tw.length, fw.length, 1)
    if (score > best) { best = score; bestF = f }
  }
  return best >= 0.65 ? { film: bestF, how: `overlap ${best.toFixed(2)}` } : null
}

// ── run ─────────────────────────────────────────────────────────────────────
let films
try {
  films = await sb('films?select=id,title,alt_titles,phase,week,est_m,base_price,rt')
} catch (e) {
  // retry without alt_titles in case the column isn't present
  console.log(`films fetch failed (${e.message}) — retrying without alt_titles`)
  films = await sb('films?select=id,title,phase,week,est_m,base_price,rt')
}
if (!Array.isArray(films)) { console.error('films query did not return a list:', JSON.stringify(films)); process.exit(1) }
console.log(`loaded ${films.length} films`)

for (const wkFriday of weekends) {
  const [y, mo, da] = wkFriday.split('-')
  const url = `https://www.the-numbers.com/box-office-chart/weekend/${y}/${mo}/${da}`
  const log = { id: randomUUID(), run_at: new Date().toISOString(), source: 'the-numbers', weekend: wkFriday, films_checked: 0, films_updated: 0, conflicts: [], errors: [], status: 'success' }
  console.log(`\n=== weekend ${wkFriday}  ${url} ===`)

  let rows
  try {
    const res = await fetch(url, { headers: BROWSER, signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new Error(`chart fetch ${res.status}`)
    rows = parseChart(await res.text())
    if (!rows.length) throw new Error('0 rows parsed (page layout changed?)')
  } catch (e) {
    log.status = 'failed'; log.errors.push({ error: e.message })
    console.log(`  FAILED: ${e.message}`)
    if (COMMIT) await fetch(`${U}/rest/v1/sync_log`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(log) })
    process.exitCode = 1
    continue
  }
  log.films_checked = rows.length
  console.log(`  parsed ${rows.length} chart rows`)

  const touched = new Map() // film_id -> film
  for (const row of rows) {
    const hit = matchFilm(row.title, films)
    if (!hit) { log.conflicts.push({ scraped: row.title, reason: 'no film match' }); continue }
    const f = hit.film
    if (f.phase === 0 && !DEBUG_ALL) { continue } // archive — already settled, don't touch
    const wknum = weekendOf(row.days)
    if (wknum > 6) continue
    const tag = `${row.title} -> ${f.title} (${hit.how}) wknd ${wknum} $${row.grossM}M`
    if (wknum === 1) {
      if (COMMIT) {
        const r = await fetch(`${U}/rest/v1/results`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ film_id: f.id, actual_m: row.grossM }) })
        if (!r.ok) { log.errors.push({ film: f.id, error: await r.text() }); console.log(`  ERR ${tag}`); continue }
      }
    } else {
      if (COMMIT) {
        await fetch(`${U}/rest/v1/weekly_grosses?film_id=eq.${encodeURIComponent(f.id)}&week_num=eq.${wknum}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } })
        const r = await fetch(`${U}/rest/v1/weekly_grosses`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ id: randomUUID(), film_id: f.id, week_num: wknum, gross_m: row.grossM }) })
        if (!r.ok) { log.errors.push({ film: f.id, error: await r.text() }); console.log(`  ERR ${tag}`); continue }
      }
    }
    touched.set(f.id, f)
    console.log(`  ${COMMIT ? 'wrote' : 'would write'}: ${tag}`)
  }

  // recompute film_values for every touched film
  for (const [fid, f] of touched) {
    if (!COMMIT) continue
    const res = await sb(`results?film_id=eq.${encodeURIComponent(fid)}&select=actual_m`)
    const wg = await sb(`weekly_grosses?film_id=eq.${encodeURIComponent(fid)}&select=week_num,gross_m`)
    const opening = res[0]?.actual_m
    if (opening == null) continue
    const wgMap = {}; wg.forEach((w) => { wgMap[w.week_num] = w.gross_m })
    const val = calcMarketValue({ basePrice: f.base_price, estM: f.est_m, rt: f.rt }, opening, wgMap)
    await fetch(`${U}/rest/v1/film_values`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ film_id: fid, current_value: val }) })
  }

  log.films_updated = touched.size
  if (log.errors.length) log.status = touched.size ? 'partial' : 'failed'
  console.log(`  ${touched.size} films updated · ${log.conflicts.length} unmatched · ${log.errors.length} errors · ${log.status}`)
  if (log.conflicts.length) console.log('  unmatched: ' + log.conflicts.map((c) => c.scraped).join(', '))
  if (COMMIT) await fetch(`${U}/rest/v1/sync_log`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(log) })
}

console.log(COMMIT ? '\nDone.' : '\nDry run — pass --commit to write.')
