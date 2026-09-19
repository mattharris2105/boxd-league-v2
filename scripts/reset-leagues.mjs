// One-off: delete "The box office tester!" and "testing league" entirely,
// keep only "BOXD Original League", and reset its phase back to 1 (it was
// manually advanced to Phase 2 during testing with no roster activity).
// Dry-run by default — pass --commit to write.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMMIT = process.argv.includes('--commit')
const env = {}
for (const l of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const U = env.SUPABASE_URL
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }

const KEEP = '658fb7dd-2185-4116-aff1-554d6a382bff' // BOXD Original League
const DELETE_LEAGUES = [
  '3bfed4a0-350b-42e7-b0d6-3e8d3c284826', // The box office tester!
  'a036bcd9-d66e-41b5-8cad-6d0833a1cba1', // testing league
]

// Every table with a league_id column, per supabase/migrations. Order matters
// only in that leagues itself goes last.
const LEAGUE_SCOPED_TABLES = [
  'rosters', 'transactions', 'phase_budgets', 'marquee_picks', 'league_members',
  'polls', 'poll_votes', 'chips', 'oscar_predictions', 'sealed_bids',
  'auteur_declarations', 'powers', 'sabotages', 'trades', 'screenings',
  'screening_attendees', 'forecasts', 'friday_forecasts', 'news_signals',
  'film_reviews', 'review_comments', 'comment_likes', 'reactions',
  'activity_feed', 'film_comments', 'booking_clicks', 'marketing_events',
  'movie_of_week', 'distributor_access', 'league_config',
]

const g = async (p) => { const r = await fetch(`${U}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(p + ' -> ' + r.status + ' ' + await r.text()); return r.json() }

console.log(`${COMMIT ? 'COMMITTING' : 'DRY RUN (pass --commit to write)'}\n`)

console.log('--- Deleting all rows scoped to the two doomed leagues ---')
for (const table of LEAGUE_SCOPED_TABLES) {
  for (const lid of DELETE_LEAGUES) {
    let rows
    try { rows = await g(`${table}?select=id&league_id=eq.${lid}`) } catch (e) { console.log(`  ${table} (${lid.slice(0, 8)}) — skip: ${e.message.slice(0, 80)}`); continue }
    if (!Array.isArray(rows) || rows.length === 0) continue
    console.log(`  ${table}: ${rows.length} row(s) in league ${lid.slice(0, 8)}`)
    if (COMMIT) {
      const r = await fetch(`${U}/rest/v1/${table}?league_id=eq.${lid}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } })
      if (!r.ok) console.log(`    FAILED: ${r.status} ${await r.text()}`)
    }
  }
}

console.log('\n--- Catching orphaned rows with league_id=null (the sell+fee transactions from the test buy) ---')
{
  const testPlayer = '4c88f283-5b5c-47f3-a7dc-436e8050c2ec' // only ever a member of the two doomed leagues
  const rows = await g(`transactions?select=id,type,price,league_id&player_id=eq.${testPlayer}`)
  console.log(`  transactions for player ${testPlayer.slice(0, 8)}: ${rows.length}`, JSON.stringify(rows.map(r => [r.type, r.price, r.league_id])))
  if (COMMIT && rows.length) {
    const r = await fetch(`${U}/rest/v1/transactions?player_id=eq.${testPlayer}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } })
    if (!r.ok) console.log(`    FAILED: ${r.status} ${await r.text()}`)
  }
}

console.log('\n--- Deleting the leagues rows themselves ---')
for (const lid of DELETE_LEAGUES) {
  console.log(`  leagues: ${lid}`)
  if (COMMIT) {
    const r = await fetch(`${U}/rest/v1/leagues?id=eq.${lid}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } })
    if (!r.ok) console.log(`    FAILED: ${r.status} ${await r.text()}`)
  }
}

console.log('\n--- Clearing any stray state on the kept league (BOXD Original League) ---')
for (const table of ['rosters', 'transactions', 'phase_budgets', 'marquee_picks']) {
  let rows
  try { rows = await g(`${table}?select=id&league_id=eq.${KEEP}`) } catch (e) { console.log(`  ${table} — skip: ${e.message.slice(0, 80)}`); continue }
  if (!Array.isArray(rows) || rows.length === 0) { console.log(`  ${table}: none`); continue }
  console.log(`  ${table}: ${rows.length} row(s) — clearing`)
  if (COMMIT) {
    const r = await fetch(`${U}/rest/v1/${table}?league_id=eq.${KEEP}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=minimal' } })
    if (!r.ok) console.log(`    FAILED: ${r.status} ${await r.text()}`)
  }
}

console.log('\n--- Resetting league_config: current_phase 2 -> 1 ---')
console.log(`  league_id ${KEEP}`)
if (COMMIT) {
  const r = await fetch(`${U}/rest/v1/league_config?league_id=eq.${KEEP}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ current_phase: 1, current_week: 1, phase_window_active: false, draft_window_open: false }) })
  if (!r.ok) console.log(`    FAILED: ${r.status} ${await r.text()}`)
}

console.log(`\nDone.${COMMIT ? '' : ' Nothing written — re-run with --commit to apply.'}`)
