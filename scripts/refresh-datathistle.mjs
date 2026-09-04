// Keep the Data Thistle access/refresh token pair alive in api_tokens.
//
//   node scripts/refresh-datathistle.mjs --seed     # first run: load .datathistle.json into the table
//   node scripts/refresh-datathistle.mjs            # refresh (dry run — shows what it would do)
//   node scripts/refresh-datathistle.mjs --commit   # refresh and write back
//
// The weekly workflow runs it with --commit. The showtimes function also
// refreshes inline if it finds the access token expired.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const COMMIT = args.includes('--commit')
const SEED = args.includes('--seed')

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
const REFRESH_URL = 'https://auth.datathistle.com/v1/refresh'

const jwtExp = (t) => { try { return new Date(JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString()).exp * 1000).toISOString() } catch { return null } }

async function sbGet (path) {
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: H })
  const b = await r.json()
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${JSON.stringify(b)}`)
  return b
}
async function sbUpsert (row) {
  const r = await fetch(`${U}/rest/v1/api_tokens`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) })
  if (!r.ok) throw new Error(`Supabase upsert ${r.status}: ${await r.text()}`)
}

// --- seed mode: load the local pair into the table ---
if (SEED) {
  const p = JSON.parse(readFileSync(resolve(root, '.datathistle.json'), 'utf8'))
  const row = {
    provider: 'datathistle',
    access_token: p.accessToken,
    refresh_token: p.refreshToken,
    access_expires_at: jwtExp(p.accessToken),
    refresh_expires_at: jwtExp(p.refreshToken),
    updated_at: new Date().toISOString(),
  }
  console.log('seed:', { access_expires_at: row.access_expires_at, refresh_expires_at: row.refresh_expires_at })
  if (COMMIT) { await sbUpsert(row); console.log('written to api_tokens') }
  else console.log('add --commit to write')
  process.exit(0)
}

// --- refresh mode ---
const rows = await sbGet(`api_tokens?provider=eq.datathistle&select=*`)
const cur = rows[0]
if (!cur) { console.error('no api_tokens row for datathistle — run with --seed first'); process.exit(1) }

const now = Date.now()
const accessMsLeft = cur.access_expires_at ? Date.parse(cur.access_expires_at) - now : -1
console.log(`current access token expires ${cur.access_expires_at} (${Math.round(accessMsLeft / 3600000)}h left)`)

// refresh when < 25 days of access-token life remain, i.e. roughly weekly
// once inside the 30-day window — keeps the pair well clear of expiry.
if (accessMsLeft > 25 * 86400000 && !args.includes('--force')) {
  console.log('still fresh — nothing to do (use --force to refresh anyway)')
  process.exit(0)
}

const res = await fetch(REFRESH_URL, { method: 'POST', headers: { Authorization: `Bearer ${cur.refresh_token}` } })
const j = await res.json().catch(() => null)
if (!res.ok || !j?.accessToken || !j?.refreshToken) {
  console.error(`refresh failed: ${res.status} ${JSON.stringify(j)}`)
  process.exit(1)
}
const next = {
  provider: 'datathistle',
  access_token: j.accessToken,
  refresh_token: j.refreshToken,
  access_expires_at: jwtExp(j.accessToken),
  refresh_expires_at: jwtExp(j.refreshToken),
  updated_at: new Date().toISOString(),
}
console.log('refreshed:', { access_expires_at: next.access_expires_at, refresh_expires_at: next.refresh_expires_at })
if (COMMIT) { await sbUpsert(next); console.log('written to api_tokens') }
else console.log('add --commit to write')
