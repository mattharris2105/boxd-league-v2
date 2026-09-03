// Backfill films.release_date. Verified dates (from The Numbers this session)
// where known; otherwise derived from the film's current week + the season
// anchor for live films, or left null for pre-anchor archive films.
// Dry-run unless --commit. Needs the migration applied first.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const ANCHOR = Date.UTC(2026, 8, 7)
const derived = (week) => new Date(ANCHOR + (week - 1) * 7 * 86400000).toISOString().slice(0, 10)

// id -> verified real release date (US theatrical / first release)
const V = {
  // Phase 0 — from The Numbers weekend charts + release schedule
  'moana-4589': '2026-07-10', 'the-odyssey-7004': '2026-07-17', 'spider-man-brand-new-day-6273': '2026-07-31',
  'evil-dead-burn-7863': '2026-07-10', 'insidious-out-of-the-further-2122': '2026-08-21',
  'paw-patrol-the-dino-movie-495': '2026-08-14', 'coyote-vs-acme-4987': '2026-08-28', 'the-dog-stars-696': '2026-08-28',
  'mutiny-60': '2026-08-21', 'one-night-only-1776': '2026-08-07', 'the-end-of-oak-street-2184': '2026-08-14',
  'motor-city-2459': '2026-07-24', 'spa-weekend-8783': '2026-08-21', 'super-troopers-3-9183': '2026-08-07',
  'ice-cream-man-8502': '2026-08-07', 'buddy-8241': '2026-08-28', 'pinoccho-unstrung-3364': '2026-07-24',
  'the-invite-7358': '2026-06-26', 'tony-1319': '2026-08-07', 'the-magic-faraway-tree-9153': '2026-08-21',
  'the-death-of-robin-hood-4040': '2026-06-19', 'couture-6191': '2026-06-26', 'rose-of-nevada-8621': '2026-06-19',
  'finding-emily-4420': '2026-08-28', 'hot-spot-8301': '2026-08-21', 'the-wrong-girls-9214': '2026-08-14',
  'cliffhanger-4678': '2026-08-28', 'fall-2-350': '2026-09-02', 'hope-3243': '2026-09-09',
  'by-any-means-2099': '2026-09-04', 'onslaught-8208': '2026-09-04', 'tom-and-jerry-forbidden-compass-2474': '2026-09-04',
  'pressure-6453': '2026-09-04', 'cocoon-one-summer-of-girlhood-3174': '2026-09-04',
  // Phase 1
  'practical-magic-2-5779': '2026-09-11', 'runner-2604': '2026-09-11', 'the-fix-9748': '2026-09-11', 'the-uprising-4658': '2026-09-11',
  'bad-apples-1740': '2026-09-18', 'resident-evil-5590': '2026-09-18', 'shaun-the-sheep-the-beast-of-mossy-botto-8823': '2026-09-18', 'the-weight-3541': '2026-09-18',
  'bedford-park-4079': '2026-09-22', 'charlie-harper-9895': '2026-09-25', 'forgotten-island-2914': '2026-09-25',
  'heart-of-the-beast-4913': '2026-09-25', 'primetime-2064': '2026-09-25', 'your-mother-your-mother-your-mother-83': '2026-09-25',
  'digger-2315': '2026-10-02', 'rolling-loud-8315': '2026-10-01', 'verity-2282': '2026-10-02',
  'fjord-1413': '2026-10-09', 'misty-green-5781': '2026-10-09', 'other-mommy-9234': '2026-10-09',
  'tenzing-2136': '2026-10-09', 'the-legend-of-aang-the-last-airbender-8144': '2026-10-09', 'the-social-reckoning-4064': '2026-10-09',
  'california-schemin-1547': '2026-10-16', 'crawlers-4284': '2026-10-16', 'flywheel-ignition-of-the-soul-4893': '2026-10-16',
  'once-upon-a-time-in-harlem-1558': '2026-10-16', 'sense-and-sensibility-4932': '2026-10-16', 'street-fighter-7854': '2026-10-16',
  'trust-me-i-m-a-doctor-9128': '2026-10-16', 'whalefall-7275': '2026-10-16',
  'a-talent-for-murder-2582': '2026-10-23', 'ali-g-who-iz-i-4431': '2026-10-23', 'clayface-2703': '2026-10-23',
  'fatherland-2164': '2026-10-23', 'klara-and-the-sun-9953': '2026-10-23', 'the-only-living-pickpocket-in-new-york-6067': '2026-10-23',
  'wicker-7156': '2026-10-23', 'wildwood-8613': '2026-10-23', 'christmas-at-the-kringles-1796': '2026-10-30',
  'club-kid-820': '2026-11-06', 'drummer-boy-5125': '2026-11-06', 'ghost-soldier-6460': '2026-11-06',
  'godzilla-minus-zero-1054': '2026-11-06', 'i-play-rocky-2260': '2026-11-06', 'jimmy-3170': '2026-11-06',
  'ramayana-part-1-6908': '2026-11-06', 'the-cat-in-the-hat-4298': '2026-11-06', 'wild-horse-nine-2260': '2026-11-06',
  'bitter-christmas-6815': '2026-11-13', 'ebenezer-a-christmas-carol-2462': '2026-11-13', 'how-to-rob-a-bank-1748': '2026-11-13',
  'paper-tiger-6031': '2026-11-13', 'victoria-psycho-6708': '2026-11-13',
  'elsinore-3326': '2026-11-20', 'minotaur-410': '2026-11-20', 'november-1963-8106': '2026-11-20', 'the-hunger-games-sunrise-on-the-reaping-8491': '2026-11-20',
  'all-of-a-sudden-4615': '2026-11-25', 'focker-in-law-90': '2026-11-25', 'hershey-8801': '2026-11-26', 'hexed-4908': '2026-11-25',
  'the-adventures-of-cliff-booth-4487': '2026-11-25',
  // Phase 2
  'behemoth-6732': '2026-12-04', 'violent-night-2-3369': '2026-12-04', 'clarissa-2061': '2026-12-11', 'the-debut-4796': '2026-12-11',
  'avengers-doomsday-2148': '2026-12-18', 'dune-part-three-9997': '2026-12-18', 'coward-8378': '2026-12-25',
  'jumanji-open-world-1309': '2026-12-25', 'mr-irrelevant-5383': '2026-12-25', 'the-angry-birds-movie-3-8456': '2026-12-23', 'werwulf-4824': '2026-12-25',
  'pendulum-4343': '2027-01-01', 'children-of-blood-and-bone-2980': '2027-01-15', 'the-beekeeper-2-7061': '2027-01-15',
  'animal-friends-6035': '2027-01-22', 'the-third-parent-1917': '2027-01-22', 'karoshi-1935': '2027-01-29', 'the-rescue-4326': '2027-01-29',
  // Phase 3
  'wife-and-dog-6892': '2027-02-19',
}

const films = await fetch(`${U}/rest/v1/films?select=id,title,phase,week,release_date`, { headers: H }).then((r) => r.json())
if (!Array.isArray(films)) { console.error(films); process.exit(1) }

const plan = []
for (const f of films) {
  let date, src
  if (V[f.id]) { date = V[f.id]; src = 'verified' }
  else if (f.phase !== 0) { date = derived(f.week); src = 'derived (week+anchor)' }
  else { date = null; src = 'unknown — left null (pre-anchor archive)' }
  if (f.release_date === date) continue
  plan.push({ id: f.id, title: f.title, phase: f.phase, date, src })
}

const byMode = plan.reduce((m, p) => (m[p.src] = (m[p.src] || 0) + 1, m), {})
console.log(`${COMMIT ? '*** COMMIT ***' : '[DRY RUN]'}  ${plan.length} films to set  ${JSON.stringify(byMode)}`)
plan.sort((a, b) => String(a.date).localeCompare(String(b.date)))
plan.forEach((p) => console.log(`  ${String(p.date ?? 'NULL').padEnd(11)} P${p.phase}  ${p.title}   [${p.src}]`))

if (COMMIT) {
  let n = 0
  for (const p of plan) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${encodeURIComponent(p.id)}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ release_date: p.date }) })
    if (!r.ok) console.log(`  ERR ${p.id}: ${r.status} ${await r.text()}`); else n++
  }
  console.log(`\nupdated ${n}/${plan.length}`)
} else {
  console.log('\nRun with --commit after the migration is applied.')
}
