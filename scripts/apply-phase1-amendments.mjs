// Apply Matt's 2026-09-17 Phase 1 estimate amendments (pasted back from the
// exported CSV, edited in Excel). Dry-run by default — pass --commit to write.
//
// Two rows needed manual translation, not a literal title match:
//   - "Poetic License" -> "Remove"  => deactivate the film, don't touch est_m
//   - "Nov-63"                      => Excel auto-converted "November 1963"
//                                      into a date; mapped back by hand
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }
const { calcIPOprice } = await import(pathToFileURL(resolve(root, 'src/lib/marketValue.js')).href)

// title -> new est_m, or 'REMOVE'
const AMENDED = {
  'Hope': 2, 'Practical Magic 2': 35, 'Runner': 4.7, 'The Fix': 3,
  'Oasis: Don’t Look Back in Anger': 3, 'The Uprising': 5, 'The Weight': 4.5,
  'Bad Apples': 4, 'Resident Evil': 40, 'The History of Concrete': 0.5,
  'Shaun the Sheep: The Beast of Mossy Bottom': 3, 'Bedford Park': 1,
  'Charlie Harper': 2, 'Primetime': 12, 'Forgotten Island': 20,
  'Heart of the Beast': 20, 'Your Mother, Your Mother, Your Mother': 3,
  'Rolling Loud': 4.5, 'Verity': 32, 'Digger': 18, 'She Saw Us': 0.5,
  'Fjord': 0.2, 'Other Mommy': 18, 'The Social Reckoning': 12,
  'Angel and the Badman': 4, 'Misty Green': 0.5, 'Tenzing': 2.5,
  'The Legend of Aang: The Last Airbender': 35, // still inactive, value unchanged
  'Poetic License': 'REMOVE',
  "Trust Me, I'm a Doctor": 3.5, 'Sense and Sensibility': 6, 'Whalefall': 12,
  "California Schemin'": 2.5, 'Flywheel: Ignition of the Soul': 2,
  'Crawlers': 3, 'Once Upon a Time in Harlem': 0.4, 'Musk': 1.5,
  'Street Fighter': 26, 'Wicker': 2, 'Klara and the Sun': 10,
  'Ali G: Who Iz I?': 8, 'Clayface': 24.6, 'A Talent for Murder': 3.5,
  'The Only Living Pickpocket in New York': 2, 'Fatherland': 1,
  'Wildwood': 11, 'Everest: The Other Side': 1.2, 'The Mongoose': 3.5,
  'Christmas at the Kringles': 3, 'Club Kid': 2, 'Ramayana: Part 1': 11.4,
  'Wild Horse Nine': 4, 'Drummer Boy': 6, 'Ghost Soldier': 8.5,
  'The Cat in the Hat': 38, 'I Play Rocky': 3,
  'Dr. Seuss’ The Cat in the Hat': 16, 'Jimmy': 2, 'Godzilla Minus Zero': 15,
  'The Great Beyond': 8, 'Victorian Psycho': 3, 'Ebenezer: A Christmas Carol': 6,
  'Bitter Christmas': 2, 'How to Rob a Bank': 20, 'Paper Tiger': 3.5,
  'The Hunger Games: Sunrise on the Reaping': 88, 'Minotaur': 1.5,
  'November 1963': 5, // pasted as "Nov-63" — Excel date-autocorrect, mapped back
  'Elsinore': 3, 'Focker-in-Law': 22, 'The Adventures of Cliff Booth': 3,
  'All of a Sudden': 2, 'Hexed': 41, 'Hershey': 5,
}

const g = async (p) => { const r = await fetch(`${U}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(p + ' -> ' + r.status + ' ' + await r.text()); return r.json() }

const films = await g('films?select=id,title,est_m,base_price,active&phase=eq.1')
const byTitle = new Map(films.map(f => [f.title.trim().toLowerCase(), f]))

console.log(`${COMMIT ? 'COMMITTING' : 'DRY RUN (pass --commit to write)'}\n`)

let changed = 0, unchanged = 0, removed = 0, missing = 0
for (const [title, val] of Object.entries(AMENDED)) {
  const f = byTitle.get(title.trim().toLowerCase())
  if (!f) { console.log(`MISSING FROM DB: "${title}"`); missing++; continue }

  if (val === 'REMOVE') {
    console.log(`${title.padEnd(45)} -> REMOVE (deactivating)`)
    removed++
    if (COMMIT) {
      const r = await fetch(`${U}/rest/v1/films?id=eq.${f.id}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ active: false }) })
      if (!r.ok) console.log(`  FAILED: ${r.status} ${await r.text()}`)
    }
    continue
  }

  if (Number(f.est_m) === Number(val)) { unchanged++; continue }
  const newPrice = calcIPOprice(val)
  console.log(`${title.padEnd(45)} est ${String(f.est_m).padStart(6)} -> ${String(val).padStart(6)}   base_price ${String(f.base_price).padStart(4)} -> ${String(newPrice).padStart(4)}`)
  changed++
  if (COMMIT) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${f.id}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ est_m: val, base_price: newPrice }) })
    if (!r.ok) console.log(`  FAILED: ${r.status} ${await r.text()}`)
  }
}

console.log(`\n${changed} changed, ${unchanged} unchanged, ${removed} removed, ${missing} not found in DB.`)
if (!COMMIT) console.log('Nothing written. Re-run with --commit to apply.')
