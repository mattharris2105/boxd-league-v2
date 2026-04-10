// supabase/functions/ingest-results/index.ts
// Monday night auto-ingest: weekend box office only
// RT scores entered manually via Commissioner Panel

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // ── Load films ────────────────────────────────────────────────────────────
    const { data: films } = await supabase
      .from('films')
      .select('id, title, est_m, base_price, rt, phase')
    if (!films?.length) throw new Error('No films in DB')

    // ── Box office: scrape The Numbers ────────────────────────────────────────
    let boxRows: { title: string; actualM: number }[] = []
    try {
      const tnRes = await fetch('https://www.the-numbers.com/weekend-box-office-chart', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BOXD/1.0)', Accept: 'text/html' },
        signal: AbortSignal.timeout(10000),
      })
      if (tnRes.ok) boxRows = parseBoxOfficeTable(await tnRes.text())
    } catch (e) {
      console.log('Box office scrape failed:', e)
    }

    const matched: any[] = []
    const unmatched: string[] = []

    for (const row of boxRows) {
      const film = fuzzyMatch(row.title, films)
      if (!film) { unmatched.push(row.title); continue }

      const ratio  = row.actualM / (film.est_m || 1)
      const perf   = ratio>=2?2:ratio>=1.5?1.6:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1:ratio>=0.8?0.85:ratio>=0.6?0.65:0.45
      const newVal = Math.round(Math.max(film.base_price * 0.15, Math.min(film.base_price * 3, film.base_price * perf)))

      await supabase.from('results').upsert(
        { film_id: film.id, actual_m: row.actualM },
        { onConflict: 'film_id' }
      )
      await supabase.from('film_values').upsert(
        { film_id: film.id, current_value: newVal },
        { onConflict: 'film_id' }
      )

      matched.push({ title: film.title, actualM: row.actualM, newVal })
    }

    // ── Activity log ──────────────────────────────────────────────────────────
    await supabase.from('activity_feed').insert({
      user_id: null,
      type: 'auto_ingest',
      payload: {
        matched: matched.length,
        unmatched: unmatched.length,
        run_at: new Date().toISOString()
      }
    })

    return new Response(
      JSON.stringify({ success: true, matched, unmatched }, null, 2),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: CORS }
    )
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBoxOfficeTable(html: string): { title: string; actualM: number }[] {
  const results: { title: string; actualM: number }[] = []
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []

  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    if (cells.length < 4) continue

    let title = '', gross = 0
    for (const cell of cells) {
      if (
        !title &&
        cell.length > 2 &&
        !/^\d+$/.test(cell) &&
        !cell.startsWith('$') &&
        !cell.includes('%') &&
        isNaN(Number(cell.replace(/,/g, '')))
      ) {
        title = cell.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
      }
      if (cell.startsWith('$') && cell.includes(',')) {
        const n = parseFloat(cell.replace(/[$,]/g, ''))
        if (n > 100000) gross = Math.round(n / 1_000_000 * 10) / 10
      }
    }
    if (title && gross > 0) results.push({ title, actualM: gross })
  }

  // Deduplicate
  const seen = new Set<string>()
  return results.filter(r => {
    if (seen.has(r.title)) return false
    seen.add(r.title)
    return true
  })
}

function fuzzyMatch(scraped: string, films: any[]): any | null {
  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  const t = clean(scraped)

  // Exact match
  let m = films.find(f => clean(f.title) === t)
  if (m) return m

  // Substring match
  m = films.find(f => {
    const ft = clean(f.title)
    return t.includes(ft) || ft.includes(t)
  })
  if (m) return m

  // Word overlap
  const tw = t.split(' ').filter((w: string) => w.length > 2)
  let best = 0, bestMatch = null
  for (const f of films) {
    const fw = clean(f.title).split(' ').filter((w: string) => w.length > 2)
    const score = tw.filter((w: string) => fw.includes(w)).length /
      Math.max(tw.length, fw.length, 1)
    if (score > best) { best = score; bestMatch = f }
  }
  return best >= 0.6 ? bestMatch : null
}
