// supabase/functions/send-notification/index.ts
// Sends email notifications via Resend for league events.
//
// SECURITY: the caller must present a real user JWT (the app's logged-in
// session token, not the anon key) AND be the commissioner of the league in
// the payload. The recipient list is derived from league_members on the server
// -- the caller cannot name arbitrary recipients. All interpolated values are
// HTML-escaped.
//
// Deploy: supabase functions deploy send-notification
// Secret: supabase secrets set RESEND_API_KEY=re_xxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = 'https://boxd-league-v2.vercel.app'
const FROM = 'BOXD <onboarding@resend.dev>'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

async function sendEmail (to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { error: 'No RESEND_API_KEY set' }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  return res.json()
}

function emailTemplate (title: string, body: string, ctaLabel: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0A08;font-family:'Courier New',monospace;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:32px;font-weight:900;color:#E8A020;letter-spacing:-2px;margin-bottom:24px;">BOXD</div>
    <div style="background:#161210;border:1px solid #2A2420;border-radius:14px;padding:24px;">
      <div style="font-size:20px;font-weight:700;color:#F2EAE0;margin-bottom:12px;">${title}</div>
      <div style="font-size:14px;color:#8A7A6E;line-height:1.7;">${body}</div>
      <div style="margin-top:24px;"><a href="${APP_URL}" style="display:inline-block;background:#E8A020;color:#0D0A08;padding:12px 24px;border-radius:9px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;">${esc(ctaLabel)}</a></div>
    </div>
    <div style="font-size:11px;color:#46392E;margin-top:24px;text-align:center;">BOXD &middot; Fantasy Box Office</div>
  </div>
</body></html>`
}

const PHASE_NAMES: Record<number, string> = {
  0: 'Historical (Season opener)', 1: 'Autumn (Sep-Nov)',
  2: 'Awards & Holiday (Dec-Jan)', 3: 'Spring (Feb+)',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'POST only' })

  // 1. require a real user (anon-key calls have no user)
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: { user }, error: authErr } = await admin.auth.getUser(jwt)
  if (authErr || !user) return json(401, { error: 'sign-in required' })

  let type: string, payload: Record<string, unknown>
  try { ({ type, payload } = await req.json()) } catch { return json(400, { error: 'bad json' }) }
  const leagueId = String(payload?.league_id ?? '')
  if (!leagueId) return json(400, { error: 'league_id required' })

  // 2. caller must be the commissioner of that league
  const [{ data: lg }, { data: mem }] = await Promise.all([
    admin.from('leagues').select('commissioner_id').eq('id', leagueId).maybeSingle(),
    admin.from('league_members').select('role').eq('league_id', leagueId).eq('user_id', user.id).maybeSingle(),
  ])
  if (!lg) return json(404, { error: 'league not found' })
  if (lg.commissioner_id !== user.id && mem?.role !== 'commissioner') {
    return json(403, { error: 'commissioner only' })
  }

  // 3. recipient list comes from the DB, never the caller
  const { data: members } = await admin.from('league_members').select('user_id').eq('league_id', leagueId)
  const ids = (members ?? []).map((m) => m.user_id)
  const emails: string[] = []
  for (const id of ids) {
    const { data } = await admin.auth.admin.getUserById(id)
    if (data?.user?.email) emails.push(data.user.email)
  }
  if (!emails.length) return json(200, { ok: true, sent: 0 })

  let subject = '', title = '', body = '', cta = 'OPEN BOXD →'
  switch (type) {
    case 'draft_reminder':
      subject = 'Draft window closing soon'
      title = 'Your draft closes soon'
      body = 'Fill all six roster slots and deploy at least 80% of your budget before the window closes, or you take a points penalty. Log in to finish your picks.'
      cta = 'GO TO MARKET →'
      break
    case 'phase_advance': {
      const to = Number(payload.to_phase); const from = Number(payload.from_phase)
      subject = `Phase ${to} has begun`
      title = `Phase ${to}: ${esc(PHASE_NAMES[to] ?? '')}`
      body = `The league has advanced. Your unused Phase ${esc(from)} budget has been banked (up to the 20% cap). New films are in the Market.`
      cta = 'VIEW MARKET →'
      break
    }
    case 'result_in':
      subject = `Result in: ${esc(payload.film_title)}`
      title = `${esc(payload.film_title)} opened at $${esc(Number(payload.actual_m) || 0)}M`
      body = 'Weekend box office is in. Log in to see your points breakdown.'
      cta = 'VIEW RESULTS →'
      break
    default:
      return json(400, { error: `unknown type: ${esc(type)}` })
  }

  const html = emailTemplate(title, body, cta)
  let sent = 0
  for (const to of emails) { await sendEmail(to, subject, html); sent++ }
  return json(200, { ok: true, type, sent })
})
