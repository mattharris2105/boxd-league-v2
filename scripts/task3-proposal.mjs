// TASK 3 — build the Phase 0 box-office backfill proposal (writes nothing).
// Findings researched 2026-09-02 from Variety / Deadline / The Numbers / BOM etc.
// Produces backups/<latest>/task3-proposal.csv for review.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` }
const U = env.SUPABASE_URL

// --- app formula, copied verbatim from src/App.js calcMarketValue ---
function calcMarketValue (film, actualM, weeklyGrosses = {}) {
  if (actualM == null) return film.basePrice
  const r = film.estM ? actualM / film.estM : 1
  const perf = r >= 2 ? 2 : r >= 1.5 ? 1.6 : r >= 1.3 ? 1.35 : r >= 1.1 ? 1.15 : r >= 0.95 ? 1 : r >= 0.8 ? 0.85 : r >= 0.6 ? 0.65 : r >= 0.4 ? 0.45 : 0.25
  const rt = film.rt != null ? (film.rt >= 90 ? 1.15 : film.rt >= 75 ? 1.08 : film.rt < 50 ? 0.9 : 1) : 1
  const BANDS = { 2: { std: -0.55, up: 0.30, down: -0.15 }, 3: { std: -0.40, up: 0.20, down: -0.10 }, 4: { std: -0.35, up: 0.15, down: -0.05 }, 5: { std: -0.40, up: 0.10, down: 0 }, 6: { std: -0.40, up: 0.10, down: 0 } }
  const wg = weeklyGrosses || {}
  let legsMult = 1
  for (let w = 2; w <= 6; w++) {
    const cur = Number(wg[w]), prev = w === 2 ? actualM : Number(wg[w - 1])
    if (!cur || !prev || isNaN(cur) || isNaN(prev)) continue
    const drop = (cur - prev) / prev
    const band = BANDS[w]
    let adj
    if (drop >= band.std) { const range = 0 - band.std; adj = band.up * (range > 0 ? Math.min(1, (drop - band.std) / range) : 0) }
    else { const range = band.std - (-1); adj = band.down * (range > 0 ? Math.min(1, (band.std - drop) / range) : 0) }
    legsMult *= (1 + adj)
  }
  const raw = film.basePrice * perf * rt * legsMult
  return Math.round(Math.max(film.basePrice * 0.15, Math.min(film.basePrice * 4, raw)))
}

// --- researched findings: id -> {ow: opening weekend $M Fri-Sun, wk:{2:,3:,4:}, src, conf, note} ---
const F = {
  'moana-4589':                       { ow: 43.0, src: 'Deadline/Variety/BOM', conf: 'high', note: 'wide, Jul 10' },
  'the-odyssey-7004':                 { ow: 124.5, src: 'Variety/CNBC', conf: 'high', note: 'wide, Jul 17; Nolan record' },
  'spider-man-brand-new-day-6273':    { ow: 360.0, src: 'Variety/Forbes/RT', conf: 'high', note: 'all-time record opening, Jul 31' },
  'evil-dead-burn-7863':             { ow: 13.7, src: 'The Numbers/DK Network', conf: 'high', note: 'Jul 10-12' },
  'insidious-out-of-the-further-2122':{ ow: 25.3, src: 'Variety/Deadline', conf: 'high', note: '3,303 theatres' },
  'paw-patrol-the-dino-movie-495':    { ow: 20.5, src: 'The Numbers/NickAlive', conf: 'high', note: 'Aug 14, 3,545 th' },
  'coyote-vs-acme-4987':             { ow: 15.5, src: 'Cartoon Brew/ABC/Deadline', conf: 'high', note: 'Aug 28-30, #2' },
  'the-dog-stars-696':               { ow: 8.0, src: 'Variety/Deadline', conf: 'high', note: '3,330 loc, #5' },
  'mutiny-60':                        { ow: 7.5, src: 'The Numbers/ComingSoon', conf: 'high', note: 'Aug 21-23' },
  'one-night-only-1776':             { ow: 5.51, src: 'Wikipedia/film-book', conf: 'high', note: 'Aug 7, Universal romcom' },
  'the-end-of-oak-street-2184':      { ow: 21.0, src: 'Variety', conf: 'high', note: '3,446 th, #3' },
  'motor-city-2459':                 { ow: 1.63, src: 'ComingSoon/Forbes', conf: 'high', note: 'Jul 24, ~1,600 th, #9' },
  'spa-weekend-8783':                { ow: 3.08, src: 'Pajiba/BOM', conf: 'high', note: 'Aug 21, 2,009 th, #9' },
  'super-troopers-3-9183':           { ow: 4.0, src: 'The Numbers/BOM', conf: 'high', note: 'Aug 7-9, 2,760 th ($6.9M was 12-day cume)' },
  'ice-cream-man-8502':              { ow: 2.0, src: 'ScreenRant/BOW', conf: 'high', note: 'Eli Roth, 1,090 th' },
  'buddy-8241':                       { ow: 5.36, src: 'Deadline/Fangoria', conf: 'high', note: 'Aug 28, 1,258 th; DISTRIBUTOR MISMATCH: Roadside/Saban, not Milk Pictures' },
  'pinoccho-unstrung-3364':          { ow: 0.386, src: 'IndieWire/The Numbers', conf: 'med', note: 'Jul 24, 500 screens; title spelled "Pinocchio: Unstrung"' },
  // limited bow then wide expansion — "opening weekend" ambiguous
  'the-invite-7358':                 { ow: 5.7, src: 'Deadline/Variety', conf: 'med', note: 'limited bow Jun 26 ($54k/screen); $5.7M on wide expansion Jul 10 (1,610 loc)' },
  'tony-1319':                        { ow: 5.0, src: 'Deadline/IndieWire', conf: 'med', note: 'Bourdain biopic; limited bow, $5.0M on wide expansion (1,642 th)' },
  'the-magic-faraway-tree-9153':     { ow: 1.3, src: 'SlashFilm', conf: 'med', note: 'US bow only 1.3M/1,611 screens #11; UK opened Mar 2026' },
  // released, no reliable 3-day weekend figure found
  'the-wrong-girls-9214':            { ow: null, src: 'Box Office Watch', conf: 'low', note: 'Kristen Stewart; only ~$0.86M total in 17 days, max 520 th — no clean weekend figure' },
  'couture-6191':                     { ow: null, src: 'Deadline', conf: 'low', note: 'Jolie; 235 th moderate release Jun 26 — no weekend gross reported' },
  'finding-emily-4420':              { ow: null, src: 'Focus Features', conf: 'low', note: 'limited US Aug 28 — no US weekend figure reported' },
  'hot-spot-8301':                    { ow: null, src: '—', conf: 'low', note: 'limited Aug 21 (Orion) — no weekend figure found' },
  'rose-of-nevada-8621':            { ow: null, src: 'ScreenDaily', conf: 'low', note: 'NY/LA only Jun 19 — no box office reported' },
  'cliffhanger-4678':               { ow: null, src: '—', conf: 'low', note: 'released Aug 28 2026 but no weekend figure available yet' },
  // not a theatrical release
  'thrash-6725':                     { ow: null, src: 'Wikipedia', conf: 'n/a', note: 'moved to Netflix — streaming release Apr 10 2026, no theatrical BO' },
  // not released as of 2026-09-02 — phase assignment questionable
  'by-any-means-2099':              { ow: null, src: 'pre-release', conf: 'unreleased', note: 'releases Sep 4 2026 (Wahlberg/Paramount)' },
  'onslaught-8208':                 { ow: null, src: 'pre-release', conf: 'unreleased', note: 'releases Sep 4 2026 (A24)' },
  'how-to-rob-a-bank-1748':         { ow: null, src: 'pre-release', conf: 'unreleased', note: 'date conflict: Sep 4 vs Nov 13 2026' },
  'tom-and-jerry-forbidden-compass-2474': { ow: null, src: 'pre-release', conf: 'unreleased', note: 'US release moved to Sep 4 2026' },
  'fall-2-350':                      { ow: null, src: 'pre-release', conf: 'unreleased', note: 'released Sep 2 2026 (today); opening weekend Sep 4-6 in progress' },
  // date wrong in DB — actually a June release
  'the-death-of-robin-hood-4040':   { ow: 2.6, src: 'Collider/The Numbers/DK', conf: 'high', note: 'ACTUAL RELEASE Jun 19 2026 (not Sep) — DB week is wrong; $2.6M / 1,762 th' },
  // not researched in depth — expected micro-limited / possibly fictional
  'the-get-out-7054':               { ow: null, src: '—', conf: 'unmatched', note: 'no real-world match found — not researched in depth' },
  'gail-daughtry-and-the-celebrity-sex-pass-9107': { ow: null, src: '—', conf: 'unmatched', note: 'not researched in depth — title looks fictional' },
  'bad-counselors-5102':            { ow: null, src: '—', conf: 'unmatched', note: 'not researched in depth' },
  'her-private-hell-3375':          { ow: null, src: '—', conf: 'unmatched', note: 'not researched in depth (Neon)' },
  'i-want-your-sex-6917':           { ow: null, src: '—', conf: 'unmatched', note: 'Gregg Araki, Black Bear — limited, not researched in depth' },
  'the-samurai-and-the-prisoner-2546': { ow: null, src: '—', conf: 'unmatched', note: 'Janus Films arthouse — not researched in depth' },
  'olmo-2376':                       { ow: null, src: '—', conf: 'unmatched', note: 'Fernando Eimbcke / Plan B — festival, not researched in depth' },
  'teenage-sex-and-death-at-camp-miasma-7926': { ow: null, src: '—', conf: 'unmatched', note: 'MUBI — limited, not researched in depth' },
  'union-county-4853':              { ow: null, src: '—', conf: 'unmatched', note: 'not researched in depth' },
  'idiots-2175':                     { ow: null, src: '—', conf: 'unmatched', note: 'possibly a 3 Idiots re-release (Sep 4 2026) — unclear' },
  'hope-3243':                       { ow: null, src: '—', conf: 'unmatched', note: 'no est in DB either — not researched in depth' },
}

const rows = await fetch(`${U}/rest/v1/films?select=id,title,dist,week,est_m,base_price,rt&phase=eq.0`, { headers: H }).then(r => r.json())
const res = await fetch(`${U}/rest/v1/results?select=film_id`, { headers: H }).then(r => r.json())
const has = new Set(res.map(r => r.film_id))
const missing = rows.filter(r => !has.has(r.id))

const out = [['title', 'distributor', 'db_est_m', 'db_base(IPO)', 'proposed_opening_WE_$M', 'source', 'confidence', 'current_value', 'proposed_value', 'notes']]
const order = { high: 0, med: 1, low: 2, unreleased: 3, 'n/a': 4, unmatched: 5 }
missing.sort((a, b) => (order[F[a.id]?.conf ?? 'unmatched'] - order[F[b.id]?.conf ?? 'unmatched']) || a.title.localeCompare(b.title))
for (const f of missing) {
  const x = F[f.id] || { ow: null, src: '—', conf: 'unmatched', note: 'not in findings' }
  const film = { basePrice: f.base_price, estM: f.est_m, rt: f.rt }
  const pv = x.ow != null && f.base_price != null ? calcMarketValue(film, x.ow, {}) : ''
  out.push([f.title, f.dist, f.est_m ?? '', f.base_price ?? '', x.ow ?? '', x.src, x.conf, f.base_price ?? '', pv, x.note])
}
const csv = out.map(r => r.map(v => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(',')).join('\n')
const backupsDir = resolve(root, 'backups')
const latest = readdirSync(backupsDir).filter(d => /\d{4}-\d{2}-\d{2}T/.test(d)).sort().pop()
const path = resolve(backupsDir, latest, 'task3-proposal.csv')
writeFileSync(path, csv)

const byConf = missing.reduce((m, f) => { const c = F[f.id]?.conf ?? 'unmatched'; (m[c] = m[c] || []).push(f.title); return m }, {})
for (const [c, list] of Object.entries(byConf)) console.log(`${c.padEnd(11)} ${list.length}`)
console.log(`\nCSV: backups/${latest}/task3-proposal.csv`)
