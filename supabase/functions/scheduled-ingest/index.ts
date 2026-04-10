// supabase/functions/scheduled-ingest/index.ts
// This is the cron-triggered wrapper that calls ingest-results and
// then fires draft-reminder emails.
//
// Schedule this in Supabase Dashboard → Database → Extensions → pg_cron:
//   SELECT cron.schedule('nightly-ingest', '0 23 * * 0', $$
//     SELECT net.http_post(
//       url := 'https://yxluqkfanhzktinayvex.supabase.co/functions/v1/scheduled-ingest',
//       headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_KEY>"}',
//       body := '{}'
//     ) AS request_id;
//   $$);
//
// This runs every Sunday at 23:00 UTC (midnight BST in summer).
// Deploy: supabase functions deploy scheduled-ingest

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async () => {
  const headers = { 'Content-Type': 'application/json' }
  const log: string[] = []

  try {
    // 1. Run box office + RT ingest
    log.push('Starting ingest...')
    const ingestRes = await fetch(`${SUPABASE_URL}/functions/v1/ingest-results`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    })
    const ingestData = await ingestRes.json()
    log.push(`Ingest: ${ingestData.matched?.length ?? 0} matched, ${ingestData.unmatched?.length ?? 0} unmatched`)

    // 2. Fire result notifications for any new results
    if (ingestData.matched?.length > 0) {
      const { data: leagues } = await supabase.from('leagues').select('id')
      const { data: members } = await supabase.from('league_members').select('user_id, league_id')

      for (const match of ingestData.matched) {
        const allPlayerIds = members?.map(m => m.user_id) ?? []
        await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'result_in',
            payload: { film_title: match.matched, actual_m: match.actualM, players: allPlayerIds.map(id => ({ id })) }
          })
        })
      }
      log.push(`Notified players of ${ingestData.matched.length} new result(s)`)
    }

    // 3. Check draft deadlines — send reminders if deadline within 48hrs
    const { data: configs } = await supabase
      .from('league_config')
      .select('league_id, draft_window_open, draft_deadline')
      .eq('draft_window_open', true)

    for (const cfg of (configs ?? [])) {
      if (!cfg.draft_deadline) continue
      const hoursLeft = (new Date(cfg.draft_deadline).getTime() - Date.now()) / 3600000
      if (hoursLeft > 0 && hoursLeft <= 48) {
        const { data: members } = await supabase
          .from('league_members').select('user_id').eq('league_id', cfg.league_id)
        const { data: rosters } = await supabase
          .from('rosters').select('player_id').eq('league_id', cfg.league_id).eq('active', true)
        const { data: cfgFull } = await supabase
          .from('league_config').select('current_phase').eq('league_id', cfg.league_id).maybeSingle()

        const ph = cfgFull?.current_phase ?? 1
        const DRAFT_MIN = 4

        const players = (members ?? []).map(m => {
          const picks = rosters?.filter(r => r.player_id === m.user_id).length ?? 0
          return { id: m.user_id, picks, shortfall: Math.max(0, DRAFT_MIN - picks) }
        }).filter(p => p.shortfall > 0)

        if (players.length > 0) {
          await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'draft_reminder', payload: { league_id: cfg.league_id, deadline: cfg.draft_deadline, players } })
          })
          log.push(`Draft reminder sent to ${players.length} player(s) in league ${cfg.league_id}`)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, log }), { headers })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, log }), { status: 500, headers })
  }
})
