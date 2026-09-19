// Apply the Gemini+ChatGPT est_m review (2026-09-10) to the films table.
// Dry-run by default — prints the diff and does nothing. Pass --commit to write.
//
// Two rows are handled specially rather than by the blend formula:
//   - The Legend of Aang: The Last Airbender -> DEACTIVATED, not est_m=0.
//     Confirmed via live search: Paramount pulled the theatrical release
//     (Dec 2025) for a Paramount+ exclusive. It can never have a domestic
//     opening weekend, so it should drop out of the buyable slate entirely
//     rather than sit at a floor price forever scoring 0.
//   - Focker-in-Law and Children of Blood and Bone are left UNCHANGED here:
//     Gemini and ChatGPT disagreed by ~50%+ on both (10-12 vs 18-25, and
//     12-15 vs 18-22) despite being tagged "M confidence" in the synthesis.
//     Flagged for Matt to look at separately rather than trusting the blend.
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

// title -> revised est_m. Only rows whose Revised Final differs from "My Est"
// in the review table are listed (unchanged/"Kept" rows are omitted on
// purpose — nothing to do for those).
const REVISED = {
  'Runner': 4.7,
  'Forgotten Island': 25,
  'Heart of the Beast': 20,
  'Primetime': 12,
  'Digger': 10.2,
  'Verity': 32,
  'Tenzing': 2.5,
  'Other Mommy': 17.2,
  'Practical Magic 2': 40,
  'Resident Evil': 40,
  'The Weight': 4.5,
  'Street Fighter': 26,
  'Whalefall': 9.5,
  'Ali G: Who Iz I?': 9.5,
  'A Talent for Murder': 3.5,
  'Trust Me, I\'m a Doctor': 3.5,
  'Clayface': 24.6,
  'The Cat in the Hat': 38,
  'Ramayana: Part 1': 11.4,
  'Paper Tiger': 3.5,
  'The Hunger Games: Sunrise on the Reaping': 88,
  'Minotaur': 1.5,
  'Hexed': 41,
  'Ghost Soldier': 8.5,
  'Violent Night 2': 18.6,
  'Behemoth!': 3.5,
  'The Angry Birds Movie 3': 13.6,
  'Werwulf': 20.5,
  'Pendulum': 4.5,
  'The Beekeeper 2': 29.1,
  'Animal Friends': 28.2,
  'The Third Parent': 7.5,
  'Karoshi': 10.5,
  'Wife and Dog': 2.5,
  'Cliffhanger': 14.1,
}
// Left unchanged on purpose — sources disagreed too much to trust the blend.
const FLAGGED_NO_CHANGE = ['Focker-in-Law', 'Children of Blood and Bone']
const DEACTIVATE = ['The Legend of Aang: The Last Airbender']

const g = async (p) => { const r = await fetch(`${U}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(p + ' -> ' + r.status + ' ' + await r.text()); return r.json() }

const films = await g('films?select=id,title,est_m,base_price&phase=neq.0')
const byTitle = new Map(films.map(f => [f.title.trim().toLowerCase(), f]))

console.log(`${COMMIT ? 'COMMITTING' : 'DRY RUN (pass --commit to write)'}\n`)

let updates = 0, missing = 0
for (const [title, newEst] of Object.entries(REVISED)) {
  const f = byTitle.get(title.trim().toLowerCase())
  if (!f) { console.log(`MISSING FROM DB: "${title}"`); missing++; continue }
  const newPrice = calcIPOprice(newEst)
  console.log(`${title.padEnd(42)} est ${String(f.est_m).padStart(6)} -> ${String(newEst).padStart(6)}   base_price ${String(f.base_price).padStart(4)} -> ${String(newPrice).padStart(4)}`)
  updates++
  if (COMMIT) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${f.id}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ est_m: newEst, base_price: newPrice }) })
    if (!r.ok) console.log(`  FAILED: ${r.status} ${await r.text()}`)
  }
}

console.log(`\nDeactivating (no domestic opening weekend possible):`)
for (const title of DEACTIVATE) {
  const f = byTitle.get(title.trim().toLowerCase())
  if (!f) { console.log(`MISSING FROM DB: "${title}"`); missing++; continue }
  console.log(`  ${title} (id ${f.id})`)
  if (COMMIT) {
    const r = await fetch(`${U}/rest/v1/films?id=eq.${f.id}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ active: false }) })
    if (!r.ok) console.log(`  FAILED: ${r.status} ${await r.text()}`)
  }
}

console.log(`\nLeft unchanged — sources disagreed too much, review manually:`)
for (const title of FLAGGED_NO_CHANGE) {
  const f = byTitle.get(title.trim().toLowerCase())
  console.log(`  ${title}${f ? ` (currently est_m=${f.est_m})` : ' — NOT FOUND IN DB'}`)
}

console.log(`\n${updates} estimate updates, ${DEACTIVATE.length} deactivation(s), ${missing} not found in DB.`)
if (!COMMIT) console.log('Nothing written. Re-run with --commit to apply.')
