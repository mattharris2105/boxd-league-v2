// supabase/functions/send-notification/index.ts
// Sends email notifications via Resend for key events:
//   - trade_proposed: notify the receiver
//   - draft_reminder: notify all players with < DRAFT_MIN picks
//   - phase_advance: notify all league members
//   - result_in: notify all members a result is live
//
// Deploy: supabase functions deploy send-notification
// Set secret: supabase secrets set RESEND_API_KEY=re_xxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = 'https://boxd-league-v2.vercel.app'
const FROM = 'BOXD <notifications@boxd.app>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { error: 'No RESEND_API_KEY set' }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html })
  })
  return res.json()
}

function emailTemplate(title: string, body: string, cta?: { label: string, url: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0A08;font-family:'Courier New',monospace;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:32px;font-weight:900;color:#E8A020;letter-spacing:-2px;margin-bottom:24px;">BOXD</div>
    <div style="background:#161210;border:1px solid #2A2420;border-radius:14px;padding:24px;">
      <div style="font-size:20px;font-weight:700;color:#F2EAE0;margin-bottom:12px;">${title}</div>
      <div style="font-size:14px;color:#8A7A6E;line-height:1.7;">${body}</div>
      ${cta ? `<div style="margin-top:24px;"><a href="${cta.url}" style="display:inline-block;background:#E8A020;color:#0D0A08;padding:12px 24px;border-radius:9px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;">${cta.label}</a></div>` : ''}
    </div>
    <div style="font-size:11px;color:#46392E;margin-top:24px;text-align:center;">BOXD · Fantasy Box Office · <a href="${APP_URL}" style="color:#46392E;">${APP_URL}</a></div>
  </div>
</body>
</html>`
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId)
  return data?.user?.email ?? null
}

serve(async (req) => {
  const headers = { 'Content-Type': 'application/json' }

  try {
    const { type, payload } = await req.json()

    switch (type) {

      case 'trade_proposed': {
        // payload: { trade_id, proposer_name, receiver_id, proposer_film, receiver_film }
        const email = await getUserEmail(payload.receiver_id)
        if (!email) break
        const { data: receiver } = await supabase.from('profiles').select('name').eq('id', payload.receiver_id).maybeSingle()
        await sendEmail(
          email,
          `🔄 Trade proposal from ${payload.proposer_name}`,
          emailTemplate(
            `${payload.proposer_name} wants to trade`,
            `They're offering <strong style="color:#4A9EF5">${payload.proposer_film}</strong> in exchange for your <strong style="color:#E8A020">${payload.receiver_film}</strong>.<br><br>Log in to accept or decline — trades expire after 48 hours.`,
            { label: 'VIEW TRADE →', url: `${APP_URL}` }
          )
        )
        break
      }

      case 'draft_reminder': {
        // payload: { league_id, deadline, players: [{id, name, picks, shortfall}] }
        for (const player of (payload.players || [])) {
          if (player.shortfall <= 0) continue
          const email = await getUserEmail(player.id)
          if (!email) continue
          await sendEmail(
            email,
            `⚠️ Draft deadline approaching — ${player.shortfall} pick${player.shortfall !== 1 ? 's' : ''} needed`,
            emailTemplate(
              'Draft window closing soon',
              `You need <strong style="color:#F08030">${player.shortfall} more film${player.shortfall !== 1 ? 's' : ''}</strong> to meet the minimum draft requirement.<br><br>Deadline: <strong>${new Date(payload.deadline).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong><br><br>Miss the deadline and you'll receive a ${player.shortfall * 5}M budget penalty next phase.`,
              { label: 'GO TO MARKET →', url: `${APP_URL}` }
            )
          )
        }
        break
      }

      case 'phase_advance': {
        // payload: { league_id, from_phase, to_phase, phase_name, players: [{id}] }
        const phaseNames: Record<number, string> = { 1:'Dead Zone', 2:'Summer Slate', 3:'Horror Window', 4:'Awards Season', 5:'Oscar Sprint' }
        for (const player of (payload.players || [])) {
          const email = await getUserEmail(player.id)
          if (!email) continue
          await sendEmail(
            email,
            `🚀 Phase ${payload.to_phase} has begun — ${phaseNames[payload.to_phase] || ''}`,
            emailTemplate(
              `Phase ${payload.to_phase}: ${phaseNames[payload.to_phase] || ''}`,
              `The league has advanced to a new phase. Your unused Phase ${payload.from_phase} budget has been banked and rolled forward.<br><br>New films are now available in the Market. Budget up, make your moves.`,
              { label: 'VIEW MARKET →', url: `${APP_URL}` }
            )
          )
        }
        break
      }

      case 'result_in': {
        // payload: { league_id, film_title, actual_m, players: [{id}] }
        for (const player of (payload.players || [])) {
          const email = await getUserEmail(player.id)
          if (!email) continue
          await sendEmail(
            email,
            `🎬 Result in: ${payload.film_title} — $${payload.actual_m}M`,
            emailTemplate(
              `${payload.film_title} opened at $${payload.actual_m}M`,
              `Weekend box office results are in. Log in to see your points breakdown.`,
              { label: 'VIEW RESULTS →', url: `${APP_URL}` }
            )
          )
        }
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400, headers })
    }

    return new Response(JSON.stringify({ ok: true, type }), { headers })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers })
  }
})
