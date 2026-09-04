// Supabase Edge Function: supabase/functions/showtimes/index.ts
// Deploy: supabase functions deploy showtimes
// Set secret: supabase secrets set DATATHISTLE_TOKEN=eyJ0eXAi...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const url    = new URL(req.url)
    const lat    = url.searchParams.get('lat')
    const lon    = url.searchParams.get('lon')
    const title  = url.searchParams.get('title')  // film title to match
    const date   = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
    const radius = url.searchParams.get('radius') || '10' // miles

    if (!lat || !lon || !title) {
      return new Response(JSON.stringify({ error: 'lat, lon, title required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Data Thistle access token lives in api_tokens (it rotates every 30 days).
    // A weekly job keeps it fresh; refresh inline here too if it's expired.
    const token = await getDataThistleToken(supabase)
    if (!token) throw new Error('No Data Thistle token available')

    const cacheKey = `${lat.substring(0,6)}_${lon.substring(0,6)}_${title.toLowerCase().replace(/\s+/g,'_')}_${date}`
    const { data: cached } = await supabase
      .from('showtimes_cache')
      .select('data, cached_at')
      .eq('cache_key', cacheKey)
      .single()

    // Use cache if less than 4 hours old (free tier rate limit protection)
    if (cached) {
      const age = Date.now() - new Date(cached.cached_at).getTime()
      if (age < 4 * 3600 * 1000) {
        return new Response(JSON.stringify({ ...cached.data, cached: true }), {
          headers: { ...CORS, 'Content-Type': 'application/json' }
        })
      }
    }

    // Data Thistle: search events near location, film category
    // Convert miles to km for the API
    const radiusKm = Math.round(Number(radius) * 1.609)

    // Fetch paginated events — film category, near location, on date
    const events: any[] = []
    let nextUrl: string | null =
      `https://api.datathistle.com/v1/events?lat=${lat}&lon=${lon}&distance=${radiusKm}&category=film&date=${date}&limit=100`

    let pages = 0
    // category=film mixes in comedy nights/gigs/tours/theatre, so real cinema
    // listings can sit well past page 5 (confirmed: a real screening turned up
    // on page 8+ for one title). Raised the cap — if this trips your Data
    // Thistle plan's rate limit, dial it back down.
    while (nextUrl && pages < 15) {
      const resp = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!resp.ok) {
        const err = await resp.text()
        throw new Error(`Data Thistle ${resp.status}: ${err}`)
      }

      const data = await resp.json()
      const items = Array.isArray(data) ? data : (data.events || data.results || data.data || [])
      events.push(...items)

      nextUrl = resp.headers.get('x-next') || null
      pages++
    }

    // Filter to events matching this film title (fuzzy match)
    const titleLower = title.toLowerCase()
    const titleWords = titleLower.split(' ').filter(w => w.length > 2)

    const matching = events.filter(ev => {
      const evTitle = (ev.name || ev.title || ev.event_name || '').toLowerCase()
      // Direct match or word overlap
      if (evTitle.includes(titleLower)) return true
      const matchCount = titleWords.filter(w => evTitle.includes(w)).length
      return matchCount >= Math.max(1, Math.floor(titleWords.length * 0.6))
    })

    // Group by venue
    const byVenue: Record<string, any> = {}
    for (const ev of matching) {
      const venueId   = ev.venue_id || ev.place_id || ev.venue?.id || ev.location?.id || 'unknown'
      const venueName = ev.venue_name || ev.place_name || ev.venue?.name || ev.location?.name || 'Unknown Cinema'
      const venueUrl  = ev.venue_url || ev.place_url || ev.venue?.url || ''
      const bookUrl   = ev.booking_url || ev.ticket_url || ev.url || ev.link || venueUrl || ''
      const startTime = ev.start_time || ev.time || ev.date_time || ev.start || ''
      const format    = ev.attributes?.format || ev.format || ev.version || 'Standard'
      const lat_v     = ev.venue?.lat || ev.lat_venue || null
      const lon_v     = ev.venue?.lon || ev.lon_venue || null

      if (!byVenue[venueId]) {
        byVenue[venueId] = {
          id:       venueId,
          name:     venueName,
          url:      venueUrl,
          lat:      lat_v,
          lon:      lon_v,
          chain:    detectChain(venueName),
          times:    []
        }
      }

      byVenue[venueId].times.push({
        time:    formatTime(startTime),
        datetime: startTime,
        format,
        bookUrl,
      })
    }

    // Sort times within each venue
    for (const v of Object.values(byVenue)) {
      (v as any).times.sort((a: any, b: any) => a.datetime.localeCompare(b.datetime))
    }

    const result = {
      film:    title,
      date,
      lat, lon,
      cinemas: Object.values(byVenue).sort((a: any, b: any) => a.name.localeCompare(b.name)),
      total_events: events.length,
      matched: matching.length,
    }

    // Cache it
    await supabase.from('showtimes_cache').upsert({
      cache_key: cacheKey,
      data:      result,
      cached_at: new Date().toISOString(),
    }, { onConflict: 'cache_key' })

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Showtimes error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})

function formatTime(dt: string): string {
  if (!dt) return '—'
  try {
    const d = new Date(dt)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    // Maybe it's already HH:MM
    return dt.substring(0, 5)
  }
}

// Read the Data Thistle access token from api_tokens; if it's expired (or
// within 24h of expiry), POST /v1/refresh and persist the new pair.
async function getDataThistleToken(supabase: any): Promise<string | null> {
  const { data: row } = await supabase
    .from('api_tokens').select('*').eq('provider', 'datathistle').maybeSingle()
  if (!row) return Deno.env.get('DATATHISTLE_TOKEN') ?? null   // legacy fallback

  const msLeft = row.access_expires_at
    ? new Date(row.access_expires_at).getTime() - Date.now()
    : -1
  if (msLeft > 24 * 3600 * 1000) return row.access_token

  const jwtExp = (t: string): string | null => {
    try {
      const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      return new Date(p.exp * 1000).toISOString()
    } catch { return null }
  }
  try {
    const r = await fetch('https://auth.datathistle.com/v1/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${row.refresh_token}` },
    })
    const j = await r.json()
    if (r.ok && j?.accessToken && j?.refreshToken) {
      await supabase.from('api_tokens').upsert({
        provider: 'datathistle',
        access_token: j.accessToken,
        refresh_token: j.refreshToken,
        access_expires_at: jwtExp(j.accessToken),
        refresh_expires_at: jwtExp(j.refreshToken),
        updated_at: new Date().toISOString(),
      })
      return j.accessToken
    }
    console.log('Data Thistle refresh failed:', r.status, JSON.stringify(j))
  } catch (e) {
    console.log('Data Thistle refresh error:', e)
  }
  return row.access_token   // last resort — use the (possibly stale) token
}

function detectChain(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('odeon'))        return 'odeon'
  if (n.includes('vue'))          return 'vue'
  if (n.includes('cineworld'))    return 'cineworld'
  if (n.includes('curzon'))       return 'curzon'
  if (n.includes('picturehouse')) return 'picturehouse'
  if (n.includes('everyman'))     return 'everyman'
  if (n.includes('empire'))       return 'empire'
  if (n.includes('showcase'))     return 'showcase'
  if (n.includes('light'))        return 'light'
  return 'indie'
}
