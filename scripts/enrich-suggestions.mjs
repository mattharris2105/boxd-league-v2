// Fills est_m on pending film_suggestions by asking Claude (with web search) for
// an opening-weekend projection. Runs right after slate-scan in the weekly
// Action. Leaves every row status = 'pending' — the commissioner still approves
// each one in the app; this just saves the googling.
//
// No-ops (exit 0) if ANTHROPIC_API_KEY isn't set.
//
//   node scripts/enrich-suggestions.mjs           # fill pending rows that have no est_m
//   node scripts/enrich-suggestions.mjs --dry     # print what it would set, write nothing
//   node scripts/enrich-suggestions.mjs --limit 5
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d }
const DRY = args.includes('--dry')
const LIMIT = Number(flag('--limit', 25))

let env = { ...process.env }
try {
  for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim()
  }
} catch { /* CI: rely on process.env */ }
const U = (env.SUPABASE_URL || 'https://yxluqkfanhzktinayvex.supabase.co').trim().replace(/\/+$/, '')
const KEY = (env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const AK = (env.ANTHROPIC_API_KEY || '').trim()
if (!KEY) { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1) }
if (!AK) { console.log('ANTHROPIC_API_KEY not set — nothing to do.'); process.exit(0) }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function sb (path, init) {
  const res = await fetch(`${U}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers || {}) } })
  const text = await res.text()
  let body; try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  return body
}

const SYSTEM = `You estimate the opening-weekend US domestic box office (in $ millions) for a single film.
Rules:
- Prefer a published tracking figure (Boxoffice Pro long-range forecast, Deadline / Variety / THR tracking, The Numbers). Use web search to find one.
- If there is no tracking yet, derive a number from 2-3 named comparable films (same franchise, director, genre, budget tier, release slot).
- Be conservative. A wide studio release is rarely under $5M; a platform/limited release is usually $0.1-3M in its opening weekend.
- Respond with ONLY a JSON object, no prose, no code fence:
  {"est_m": <number>, "src": "track" | "gauge", "notes": "<one sentence: the tracking source, or the comps used>"}`

const pend = await sb(`film_suggestions?status=eq.pending&est_m=is.null&select=id,kind,title,dist,release_date,release_type,notes&order=release_date.asc&limit=${LIMIT}`)
if (!Array.isArray(pend) || pend.length === 0) { console.log('No pending suggestions need an estimate.'); process.exit(0) }
console.log(`${pend.length} suggestion${pend.length === 1 ? '' : 's'} to estimate\n`)

let done = 0, failed = 0
for (const s of pend) {
  const prompt = `Film: ${s.title}\nRelease date: ${s.release_date || 'unknown'}\nDistributor: ${s.dist || 'unknown'}\nRelease type: ${s.release_type || 'unknown'}`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': AK, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: SYSTEM,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error(`no JSON in reply: ${text.slice(0, 200)}`)
    const out = JSON.parse(m[0])
    const est = Number(out.est_m)
    if (!isFinite(est) || est <= 0) throw new Error(`bad est_m: ${out.est_m}`)
    const note = `[auto ${out.src || 'gauge'}] ${out.notes || ''}`.trim()
    console.log(`  $${est}M  ${s.title}  — ${out.notes || ''}`)
    if (!DRY) {
      await sb(`film_suggestions?id=eq.${s.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ est_m: est, est_src: out.src || 'gauge', notes: s.notes ? `${s.notes}\n${note}` : note }),
      })
    }
    done++
  } catch (e) {
    failed++
    console.log(`  ??  ${s.title} — ${e.message}`)
  }
}
console.log(`\n${DRY ? 'DRY RUN · ' : ''}${done} estimated · ${failed} left for manual review · all still pending approval`)
