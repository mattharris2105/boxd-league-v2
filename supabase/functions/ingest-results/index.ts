// supabase/functions/ingest-results/index.ts
// Runs nightly at 23:00 GMT via pg_cron or Supabase scheduled functions
// Scrapes The Numbers weekend box office + TMDB for RT scores
// Deploy: supabase functions deploy ingest-results

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TMDB_TOKEN = Deno.env.get('TMDB_TOKEN')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Normalise title for fuzzy matching
function normalise(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a: string, b: string): number {
  const na = normalise(a), nb = normalise(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  // Word overlap
  const wa = new Set(na.split(' ')), wb = new Set(nb.split(' '))
  const inter = [...wa].filter(w => wb.has(w)).length
  return inter / Math.max(wa.size, wb.size)
}

async function fetchBoxOfficeData(): Promise<{ title: string, gross: number }[]> {
  // The Numbers weekend chart — free, no auth needed
  const url = 'https://www.the-numbers.com/box-office-chart/weekend/latest'
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BOXD/1.0)' }
  })
  const html = await res.text()

  const results: { title: string, gross: number }[] = []

  // Parse table rows — The Numbers uses a standard table format
  const rowRegex = /<td[^>]*>.*?<b><a[^>]*>([^<]+)<\/a><\/b>.*?<\/td>.*?<td[^>]*>\$([0-9,]+)<\/td>/gs
  let match
  while ((match = rowRegex.exec(html)) !== null) {
    const title = match[1].trim()
    const gross = parseFloat(match[2].replace(/,/g, '')) / 1_000_000 // to $M
    if (title && gross > 0) results.push({ title, gross })
  }

  // Fallback: try mojo-style parsing
  if (results.length === 0) {
    const mojoRegex = /class="a-text-left mojo-header-column[^"]*"[^>]*>.*?<a[^>]*>([^<]+)<\/a>.*?<td[^>]*>\$([0-9,]+)/gs
    while ((match = mojoRegex.exec(html)) !== null) {
      results.push({ title: match[1].trim(), gross: parseFloat(match[2].replace(/,/g,''))/1_000_000 })
    }
  }

  return results.slice(0, 20) // top 20
}

async function fetchRTScore(tmdbId: string | null, title: string): Promise<number | null> {
  if (!TMDB_TOKEN) return null
  try {
    let movieId = tmdbId
    if (!movieId) {
      const search = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=en-US`,
        { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
      )
      const data = await search.json()
      movieId = data.results?.[0]?.id?.toString()
    }
    if (!movieId) return null

    // TMDB doesn't serve RT scores directly — use vote_average as proxy
    // For real RT, you'd need a paid Rotten Tomatoes API key
    const detail = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`,
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
    )
    const d = await detail.json()
    // Convert TMDB 0-10 vote to 0-100 RT-style percentage
    if (d.vote_count > 20) return Math.round(d.vote_average * 10)
    return null
  } catch { return null }
}

serve(async (req) => {
  const headers = { 'Content-Type': 'application/json' }

  try {
    // 1. Load all active films
    const { data: films } = await supabase
      .from('films')
      .select('id, title, est_m, phase, tmdb_id, rt')
      .eq('active', true)

    if (!films?.length) {
      return new Response(JSON.stringify({ error: 'No active films' }), { headers })
    }

    // 2. Fetch weekend box office
    const boxOffice = await fetchBoxOfficeData()

    const matched: { matched: string, title: string, actualM: number }[] = []
    const unmatched: string[] = []
    const rtUpdates: { id: string, rt: number }[] = []

    // 3. Match each box office result to a film
    for (const bo of boxOffice) {
      let bestFilm = null, bestScore = 0

      for (const film of films) {
        const score = similarity(bo.title, film.title)
        if (score > bestScore) { bestScore = score; bestFilm = film }
      }

      if (bestFilm && bestScore >= 0.7) {
        // Check if result already exists
        const { data: existing } = await supabase
          .from('results')
          .select('id')
          .eq('film_id', bestFilm.id)
          .maybeSingle()

        if (!existing) {
          await supabase.from('results').insert({ film_id: bestFilm.id, actual_m: bo.gross })

          // Also update film_values
          const ratio = bo.gross / (bestFilm.est_m || 1)
          const perf = ratio >= 2 ? 2 : ratio >= 1.5 ? 1.6 : ratio >= 1.1 ? 1.15 : ratio >= 0.95 ? 1 : ratio >= 0.7 ? 0.8 : 0.5
          const newVal = Math.round(Math.max(bestFilm.est_m * 0.15, Math.min(bestFilm.est_m * 3, bestFilm.est_m * perf)))
          await supabase.from('film_values').upsert({ film_id: bestFilm.id, current_value: newVal }, { onConflict: 'film_id' })

          matched.push({ matched: bestFilm.title, title: bo.title, actualM: Math.round(bo.gross * 10) / 10 })
        }

        // Update RT score if missing
        if (!bestFilm.rt) {
          const rt = await fetchRTScore(bestFilm.tmdb_id, bestFilm.title)
          if (rt) {
            await supabase.from('films').update({ rt }).eq('id', bestFilm.id)
            rtUpdates.push({ id: bestFilm.id, rt })
          }
        }
      } else {
        unmatched.push(bo.title)
      }
    }

    // 4. Also refresh RT scores for upcoming films with no score
    const filmsNoRT = films.filter(f => !f.rt).slice(0, 10) // rate-limit
    for (const film of filmsNoRT) {
      const rt = await fetchRTScore(film.tmdb_id, film.title)
      if (rt) {
        await supabase.from('films').update({ rt }).eq('id', film.id)
        rtUpdates.push({ id: film.id, rt })
      }
    }

    // 5. Log the ingest run
    await supabase.from('activity_feed').insert({
      user_id: null,
      type: 'auto_ingest',
      payload: { matched_count: matched.length, unmatched_count: unmatched.length, rt_updated: rtUpdates.length },
      league_id: null
    })

    return new Response(JSON.stringify({
      ok: true,
      matched,
      unmatched,
      rtUpdates,
      timestamp: new Date().toISOString()
    }), { headers })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers })
  }
})
