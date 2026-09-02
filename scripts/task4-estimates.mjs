// Set est_m (-> IPO base_price) for the 52 films that have none.
// Researched opening-weekend projections where available (src=track), else a
// comp-based gauge (src=gauge). Dry-run unless --commit.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }
const calcIPO = (est) => { if (est == null || isNaN(est)) return null; if (est <= 0) return 3; return Math.max(3, Math.min(75, Math.round(1.05 * Math.pow(est, 0.78)))) }

// title (lowercase) -> [est_m, src, note]
const EST = {
  'avengers: doomsday': [280, 'track', 'consensus $260-300M domestic opening (some $425M+)'],
  'dune: part three': [115, 'track', 'projected $100-130M domestic opening'],
  'the hunger games: sunrise on the reaping': [75, 'track', 'projected $70-80M domestic opening'],
  'jumanji: open world': [55, 'track', 'no firm number; Next Level opened ~$60M, Christmas Day debut'],
  'street fighter': [22, 'track', 'tracking soft, comped to Masters of the Universe ($29M)'],
  'violent night 2': [20, 'track', 'analyst base case ~$20M opening'],
  'the cat in the hat': [28, 'gauge', 'WB Animation 1st feature, IMAX, Nov pre-holiday; troubled production'],
  'hexed': [30, 'gauge', 'Disney Animation original, Thanksgiving; recent originals soft (Wish $19M, Encanto $27M)'],
  'the angry birds movie 3': [15, 'gauge', 'Angry Birds 2 opened $10M; Dec release'],
  'the legend of aang: the last airbender': [35, 'gauge', 'Paramount Avatar animation, strong IP'],
  'practical magic 2': [30, 'gauge', 'WB legacy sequel, Bullock/Kidman nostalgia'],
  'focker-in-law': [22, 'gauge', 'Universal Meet the Parents 4; Little Fockers opened $30M (2010)'],
  'godzilla minus zero': [15, 'gauge', 'GKIDS; Minus One opened $8.4M and had legs, higher awareness now'],
  'clayface': [18, 'gauge', 'WB/DC mid-tier horror-thriller'],
  'wildwood': [11, 'gauge', 'LAIKA stop-motion; range $6-13M'],
  'whalefall': [9, 'gauge', '20th Century survival thriller'],
  'the social reckoning': [15, 'gauge', 'Sorkin Social Network follow-up; original opened $22M (2010)'],
  'verity': [18, 'gauge', 'Amazon MGM Colleen Hoover; Regretting You $13M, It Ends With Us $50M'],
  'klara and the sun': [10, 'gauge', 'Sony prestige sci-fi drama, Waititi'],
  'heart of the beast': [14, 'gauge', 'Paramount Brad Pitt survival/dog vehicle'],
  'sense and sensibility': [6, 'gauge', 'Focus Austen period drama'],
  'the uprising': [8, 'gauge', 'Focus action'],
  'the weight': [4, 'gauge', 'small action'],
  'forgotten island': [10, 'gauge', 'DreamWorks adventure, uncertain'],
  'other mommy': [12, 'gauge', 'Universal horror, Blumhouse-style'],
  'digger': [8, 'gauge', 'Inarritu prestige, wide-ish awards play'],
  'crawlers': [3, 'gauge', 'Production I.G anime, limited-wide'],
  'charlie harper': [2, 'gauge', 'Row K indie comedy (Nick Robinson)'],
  'christmas at the kringles': [3, 'gauge', 'Briarcliff holiday programmer'],
  'drummer boy': [6, 'gauge', 'Angel Studios faith (typ. $5-8M)'],
  'ebenezer: a christmas carol': [6, 'gauge', 'Paramount modest holiday'],
  'i play rocky': [3, 'gauge', 'Amazon MGM limited (making-of-Rocky drama)'],
  'the great beyond': [8, 'gauge', 'WB, unknown'],
  'jimmy': [2, 'gauge', 'small'],
  'wild horse nine': [4, 'gauge', 'Searchlight comedy, limited-wide'],
  'runner': [3, 'gauge', 'small drama'],
  'the fix': [2, 'gauge', 'small drama'],
  'shaun the sheep: the beast of mossy bottom': [3, 'gauge', 'Aardman/GKIDS; prior entry went straight to Netflix in US'],
  'primetime': [4, 'gauge', 'A24 wide-ish'],
  'rolling loud': [3, 'gauge', 'American High music comedy'],
  "california schemin'": [2, 'gauge', 'Magenta Light drama (Silibil n Brains true story)'],
  'fjord': [1, 'gauge', 'Neon/Mobra Romanian drama'],
  'she saw us': [0.5, 'gauge', 'tiny'],
  'flywheel: ignition of the soul': [3, 'gauge', 'Sony faith drama'],
  'poetic license': [1, 'gauge', 'Row K comedy'],
  'wicker': [2, 'gauge', 'Black Bear drama'],
  'wife and dog': [2, 'gauge', 'Black Bear thriller'],
  'victorian psycho': [3, 'gauge', 'Bleecker; Maika Monroe/Thomasin McKenzie horror-comedy'],
  'a place in hell': [2, 'gauge', 'Neon drama'],
  'fall 2': [3, 'gauge', 'Lionsgate; Fall (2022) opened $2.5M'],
  'hope': [2, 'gauge', 'Neon drama'],
  'werwulf': [18, 'gauge', 'Focus; Robert Eggers medieval horror; Nosferatu opened $40M (2024)'],
}

const films = await fetch(`${U}/rest/v1/films?select=id,title,dist,phase,week,est_m,base_price`, { headers: H }).then(r => r.json())
const targets = films.filter(f => f.est_m == null)

const rows = [['title', 'phase', 'week', 'distributor', 'old_IPO', 'new_est_m', 'new_IPO', 'source', 'note']]
const plan = []
const unmatched = []
for (const f of targets) {
  const key = f.title.toLowerCase().trim()
  const e = EST[key]
  if (!e) { unmatched.push(f.title); continue }
  const ipo = calcIPO(e[0])
  plan.push({ id: f.id, title: f.title, est: e[0], ipo })
  rows.push([f.title, f.phase, f.week, f.dist, f.base_price ?? '', e[0], ipo, e[1], e[2]])
}
const backupsDir = resolve(root, 'backups')
const latest = readdirSync(backupsDir).filter(x => /\d{4}-\d{2}-\d{2}T/.test(x)).sort().pop()
writeFileSync(resolve(backupsDir, latest, 'task4-estimates.csv'),
  rows.map(r => r.map(v => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(',')).join('\n'))

console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  ${plan.length}/${targets.length} films get est_m`)
plan.forEach(p => console.log(`  ${p.title.padEnd(42)} est ${String(p.est).padStart(5)} -> IPO ${p.ipo}`))
if (unmatched.length) console.log(`\nNO ESTIMATE DEFINED (${unmatched.length}): ${unmatched.join(', ')}`)
console.log(`\nCSV: backups/${latest}/task4-estimates.csv`)

if (!COMMIT) { console.log('\nRun with --commit to write.') } else {
  let n = 0
  for (const p of plan) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(p.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ est_m: p.est, base_price: p.ipo }) })
    if (!r.ok) console.log(`  ${p.id}: ${r.status} ${await r.text()}`); else n++
  }
  console.log(`\nupdated ${n}/${plan.length}`)
  const left = await fetch(`${U}/rest/v1/films?select=id&est_m=is.null`, { headers: H }).then(r => r.json())
  console.log(`verify — films still missing est_m: ${left.length}`)
}
