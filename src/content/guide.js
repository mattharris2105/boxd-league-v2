// ============================================================================
// BOXD — all player-facing prose lives here. Edit the words freely.
// ----------------------------------------------------------------------------
// FORMATTING
//   blank line            -> new paragraph
//   single line break     -> new line
//   line starting with •  -> bullet
//   **like this**         -> bold, in the section's accent colour
//   ++like this++         -> bold green   (good outcomes / bonuses)
//   !!like this!!         -> bold red     (penalties / warnings)
//   %%like this%%         -> bold orange
//   ~~like this~~         -> bold, dim/grey
//   {{token}}             -> auto-filled number/name (see TOKENS in src/App.js)
//                            leave these as-is unless you know the value
//
// You can add / remove / reorder sections. Keep each section's `id` unique
// (it's used for the search + the little interactive widgets that attach to
// `basics`-style ids). `color` is one of:
//   gold · blue · green · red · orange · purple
// ============================================================================

export const HOWTO_INTRO =
  `Every system in BOXD explained. Tap a section to expand. Use search to jump straight to a topic.`

export const HOWTO_FOOTER =
  `💡 **Lost?** Tap into the Feed page to see what other players are doing — every buy, sell and forecast flows through there. It's the easiest way to learn by watching.`

export const HOWTO_GROUPS = [
  {
    title: '🎯 Start Here',
    sections: [
      {
        id: 'basics', icon: '🎬', color: 'gold',
        title: 'What is BOXD?', summary: 'The core game in 30 seconds.',
        body: `BOXD is fantasy box office. You build a roster of films you think will outperform their estimates, and you score points when real-world weekend grosses come in.

The season runs in **3 phases** ({{phase1}}, {{phase2}}, {{phase3}}), plus a **Historical** archive of films that already released. Each phase you get a fresh budget, must fill all **{{maxRoster}} roster slots**, and must deploy at least **{{minSpendPct}}%** of that budget — falling short of either costs points. You also name one **⭐ marquee** film per phase that scores ×{{marqueeMult}}.

Results land ++every Monday++. Beat the estimate and score big; open below 60% of it and take a flat −40. Highest total points at season end wins.`,
      },
      {
        id: 'phases', icon: '📅', color: 'gold',
        title: 'Phases & the season clock', summary: 'How time moves and when budgets reset.',
        body: `The season has 3 playable phases. The commissioner advances phases manually. When a phase ends:
• Unspent budget is ++banked++ into next phase — but only up to **{{bankCapPct}}% of the phase budget**. Anything above that is forfeited, so sitting on a war chest doesn't work.
• Your roster from that phase stays locked in (films keep scoring as their weeks land)
• You get a new roster slot allowance for the new phase

**Phase budgets:** {{phaseBudgets}}.

At the start of each phase there's an optional ++free-trade window++ (72hrs) where you can sell films for zero fees. Use it to clean up before going into the new slate.`,
      },
      {
        id: 'firstmove', icon: '🎯', color: 'gold',
        title: 'Your first move', summary: 'What to do in the first hour.',
        body: `1. Open **Market**. Scroll the films available in your current phase.
2. Tap any film to see its details, including price drivers and a Buzz Index.
3. Add films to your **watchlist** by tapping the 👁 button — no commitment, just tracking.
4. When you've spotted 3-5 you believe in, **buy** them. Buy early — films are cheapest 6+ weeks out.
5. Check the **Roster** page to see your portfolio. As results land Mondays, the score breakdown for each film shows up here.`,
      },
    ],
  },
  {
    title: '💰 Buying & Selling',
    sections: [
      {
        id: 'market', icon: '🎬', color: 'blue',
        title: 'The Market', summary: 'How prices work, and why they move.',
        body: `Every film has a base price (its IPO). The actual price you pay is the IPO multiplied by 4 live drivers:
• **Ownership** — popular films cost more (up to +30%); a film few people own is never discounted for it
• **Time to release** — 6+ weeks out = −15%, graduates to +10% at release week
• **RT Score** — better critics = higher price (≥90% = +15%)
• **Watchlist Heat** — how many players added it this week

Tap any film and open the **Info** tab to see exactly which driver is pushing the price up or down right now.`,
      },
      {
        id: 'buying', icon: '🛒', color: 'blue',
        title: 'Buying a film', summary: 'Spend wisely. Conviction shows in price.',
        body: `Cost comes out of your phase budget. Three rules:
• !!Exactly {{maxRoster}} films per phase!! — it's a full roster or nothing. Each slot still empty when the draft window closes costs you !!{{draftPenalty}}pts!!, so a half-filled roster is −{{halfRosterPenalty}}pts before a single result lands.
• !!Deploy at least {{minSpendPct}}% of your budget!! — being short of that line at draft close costs !!1pt per {{cur}}2M!! you're under (capped at {{underspendCap}}). Six bargains that leave half your budget idle isn't a free ride.
• You can only buy films from **your current phase**

Buying ++early++ ({{earlyBirdWeeks}}+ weeks before release) earns you the 🐦 ++Early Bird++ tag — +10% on opening points if the film beats estimate by 10%+.

!!Only one Early Bird per phase.!! If you qualify on multiple films, the earliest acquired one gets the tag. Buy first, buy cheap, and pick the right film.

**Pricing IS the conviction layer.** Buying a film 6 weeks out means you pay 15% less than someone who buys at release week.`,
      },
      {
        id: 'selling', icon: '📉', color: 'red',
        title: 'Selling a film', summary: 'When and why to drop a film from your roster.',
        body: `Click **Sell** on any active film. You get current market value minus a !!{{cur}}5M transaction fee!! (zero fee during phase free-trade windows).

Common reasons to sell:
• **Bad news landed** — RT crashed, controversy, weak tracking
• **You overbought** — your full roster needs trimming
• **Phase ending** — drop dead weight to bank more for next phase

Once a film has results, it's **locked** — you can't sell after the fact. The points are yours either way.`,
      },
    ],
  },
  {
    title: '📊 Scoring — How Points Get Earned',
    sections: [
      {
        id: 'opening', icon: '🎯', color: 'green',
        title: 'Opening weekend points', summary: 'The biggest scoring event for each film.',
        body: `When real opening weekend numbers come in Monday, opening points are:

**50% × how much you beat the forecast  +  50% × how big the hit was**

Both halves matter equally. Beating the forecast still rewards spotting an underrated film — but a genuine blockbuster is no longer a trap, because raw scale now carries the same weight. A {{cur}}6M film that beats its forecast big and a {{cur}}200M film that opens on target land in the same ballpark.

!!💥 Flop penalty:!! a film that opens !!below 60% of its estimate!! scores a flat !!−40!! — no legs, no bonuses. Six cheap films means six ways to lose points, not six free lottery tickets.

**How far "beating the forecast" can count** scales with the film's size, so a lucky multiple on a tiny film can't run away, but a real breakout does show:
• ~{{cur}}2M estimate → capped at **2.7×** · ~{{cur}}8M → 3.2× · **{{cur}}18M+ → 4×**
So a {{cur}}2M film doing {{cur}}8M (4×) is scored as 2.7×; a {{cur}}20M film doing {{cur}}82M (4×) gets the full 4×.

**RT modifier** — a bonus, not a driver. It nudges the opening score up or down:`,
      },
      {
        id: 'weekly', icon: '🦵', color: 'blue',
        title: 'Legs', summary: 'How well the film holds week to week.',
        body: `After opening weekend, you score on how well the film **holds**. Every weekend has a "typical" drop for a film that age — beat it and you earn points; drop harder and that weekend is worth nothing (a hard fall is already punished by the opening score).

**Typical drop by weekend** — and the most that weekend can be worth:
• Opening → wknd 2: −50% · up to ++45++
• Wknd 2 → 3: −42% · up to ++26++
• Wknd 3 → 4: −36% · up to ++18++
• Wknd 4 → 5 and 5 → 6: −34% · up to ++11++ each

The further under the typical drop you land, the more that weekend scores. Later weekends are worth less. Everything is **scaled down for films that barely opened** (under ~{{cur}}8M), so a {{cur}}0.3M → {{cur}}0.25M "great hold" can't be farmed.

This is why a small film with real word of mouth can outscore a blockbuster that dropped 60% in its second weekend.`,
      },
      {
        id: 'marquee', icon: '⭐', color: 'gold',
        title: 'Your marquee pick', summary: 'Nominate your best bet — it scores ×1.5.',
        body: `Once per phase you pick **one film on your roster** as your marquee — the one you're most confident in. Its **total points are multiplied by {{marqueeMult}}×** (opening + legs + bonuses, or the −40 if it flops — so back it with conviction).

Set it from the **Roster** page: tap the ☆ on a film. You can switch it any time **until your first film of that phase scores**, then it locks. No marquee set by then = no ×1.5 that phase.

It rewards reading one film really well, and it's a reason to own a film big enough to be worth 1.5×-ing.`,
      },
      {
        id: 'bonuses', icon: '🏆', color: 'gold',
        title: 'All the bonuses', summary: 'Every modifier in the scoring engine.',
        body: `On top of opening points + legs, you can earn these:
• ⭐ **Marquee ×{{marqueeMult}}** on one roster film's total per phase (see above)
• 🐦 ++Early Bird +10%++ on opening pts if you bought {{earlyBirdWeeks}}+ weeks before release AND the film beats estimate by 10%+. One Early Bird per phase — earliest qualifying pick gets it.`,
      },
      {
        id: 'reading', icon: '🔍', color: 'gold',
        title: 'Reading the score breakdown', summary: 'Tap any of your scored films for the full math.',
        body: `Open **Roster**, tap any scored film. The **Score Breakdown** modal shows every line: base opening, Early Bird bonus, RT effect, legs, marquee, total.

If a film didn't score what you expected, this is where you find out why — usually a soft opening, or a film that opened fine but had no legs.`,
      },
    ],
  },
  {
    title: '🎮 Side Games & Tools',
    sections: [
      {
        id: 'watchlist', icon: '👁', color: 'blue',
        title: 'Watchlist', summary: 'Track films without committing budget.',
        body: `Hit the 👁 button on any film to add it to your watchlist. Other players see your watchlist count, which contributes to that film's !!Heat!! driver.

Use the **Community → Most Anticipated** tab to see which films the whole league is watching — a strong signal of where prices are heading.`,
      },
      {
        id: 'polls', icon: '🗳', color: 'blue',
        title: 'Quick Polls', summary: 'Commissioner-posted opinion checks.',
        body: `Anyone can vote on polls posted by the commissioner. Live tally bars show how the league is split. Social only — no points awarded.`,
      },
      {
        id: 'motw', icon: '🎬', color: 'gold',
        title: 'Movie of the Week', summary: 'Commissioner spotlight + bull/bear case.',
        body: `Each week, the commissioner can pin a Movie of the Week to the top of Market — a contentious film with a clear bull case AND bear case. Pure information, no scoring impact.`,
      },
    ],
  },
  {
    title: '📡 Reading the Charts',
    sections: [
      {
        id: 'buzz', icon: '⚡', color: 'orange',
        title: 'The Buzz Index', summary: 'A single 0-100 score for film heat.',
        body: `Composite of 3 inputs:
• **40%** Watchlist heat (recent picks in last 14d)
• **30%** Ownership (how many players hold it)
• **30%** Time pressure (closeness to release)

!!70+!! = red hot. Price will already be high. Buy early or skip.
%%50-69%% = warming up. Still a decent entry.
**30-49** = neutral. Most films sit here.
~~Under 30~~ = cold. Either a sleeper or rightly ignored.`,
      },
      {
        id: 'pulse', icon: '📊', color: 'green',
        title: 'The Pulse', summary: 'Daily snapshot of market activity.',
        body: `At the top of Market once you've bought your first film, The Pulse shows:
• **Movers (48h)** — films whose price has changed most from news signals
• **Opening This Week** — your immediate scoring opportunities
• **Heating Up** — highest Buzz Index films right now

Treat it as your "what should I look at right now" briefing.`,
      },
      {
        id: 'weekend-live', icon: '🔴', color: 'red',
        title: 'Weekend Live', summary: 'Fri 5pm to Sun 11pm — live tracking mode.',
        body: `From Friday evening to Sunday night, the Pulse swaps to !!Weekend Live!!: a red-pulse indicator showing the films opening that weekend plus your projected score.

Don't expect minute-by-minute updates — opening estimates only land Saturday afternoon for matinées, full weekend numbers Monday morning. But the mode reminds you the game is alive.`,
      },
    ],
  },
  {
    title: '⚙️ Commissioner (Matt only)',
    sections: [
      {
        id: 'commish-basics', icon: '⚙️', color: 'gold',
        title: 'What a commissioner does', summary: 'The week-to-week ops job.',
        body: `Each week:
• **Monday**: Box office ingests automatically via GitHub Actions (or paste results manually via War Room)
• **Mid-week**: Publish 1-2 news signals to keep prices moving
• **End of phase**: Run "Advance Phase" — banks budgets, opens free-trade window

The Commissioner Panel has tabs: Phase, Windows, Films, Suggestions, Bulk Import, Advanced.`,
      },
      {
        id: 'warroom', icon: '⚡', color: 'red',
        title: 'War Room — manual results entry', summary: 'Batch-enter weekend numbers.',
        body: `If the auto-ingest doesn't pull a film (indies often miss), War Room lets you paste in 3 weeks of grosses at once per film. Saves all at once and recalculates film values.`,
      },
      {
        id: 'slate-import', icon: '📋', color: 'gold',
        title: 'Slate Manager — bulk film & gross import', summary: 'One CSV imports everything.',
        body: `The Bulk Import tab takes **one wide-format CSV** with all your film metadata AND weekly grosses across columns. See the Export → Edit → Import flow described on the page itself.

Use this to spin up a new league fast, or to backfill historical grosses for older films.`,
      },
      {
        id: 'advance', icon: '🚀', color: 'purple',
        title: 'Advancing a phase', summary: 'Locks scoring, banks budgets, resets rosters.',
        body: `When you click **Advance Phase**:
• All players' unspent phase budget gets banked into the next phase (up to the {{bankCapPct}}% cap)
• Phase scoring is locked (films already resulted keep their points)
• A phase ceremony pops showing the winner and the MVP film
• The new phase starts with closed free-trade window — open it manually when ready`,
      },
    ],
  },
]

// ---- Onboarding: the cards a new player sees before the tour ----------------
// The final "Take the tour" step is added in code; these are the read-through
// cards. Edit freely; add or remove cards.
export const ONBOARD_CARDS = [
  {
    icon: '🎬', title: 'Welcome to BOXD',
    body: `You are about to draft 2026 films like stocks. Their value moves on real box office numbers. The player who reads the market best wins. Takes 60 seconds to learn.`,
  },
  {
    icon: '💰', title: 'You have {{cur}}{{budget}}M to invest',
    body: `Every film has an IPO price set by its expected opening weekend. You must fill all {{maxRoster}} roster slots and deploy at least {{minSpendPct}}% of your budget — leaving cash idle or slots empty costs points. Only {{bankCapPct}}% of anything unspent carries to the next phase.`,
  },
  {
    icon: '📈', title: 'How you score',
    body: `Every film has an estimated opening. When the real number lands, two things earn points, counting equally: how far the film beat that estimate, and how big the opening was in raw dollars. Open below 60% of the estimate and it's a flat −40. Then "legs" pay out for weeks after — each weekend the film drops less than a typical film that age, it earns a bit more. The How to Play page has a slider you can drag to see all of this live.`,
  },
  {
    icon: '⭐', title: 'Your marquee pick',
    body: `Each phase you nominate one roster film as your marquee — your best bet. It scores ×{{marqueeMult}}. Set it on the Roster page; it locks once your first film of the phase scores.`,
  },
  {
    icon: '🎯', title: 'The whole game in one line',
    body: `Buy films you think the market is underrating, back one hard as your marquee, deploy your budget, and watch the box office prove you right. Ready to make your first pick?`,
  },
]

// ---- The guided tour: one stop per screen ---------------------------------
export const TOUR_STOPS = [
  { page: 'market', icon: '🎬', title: 'The Market',
    body: `This is your trading floor. Every film has a live price. Tap any film to see its details, watchlist it, or buy. Prices rise as release nears and as more players buy in.` },
  { page: 'roster', icon: '🎞️', title: 'Your Roster',
    body: `Films you own live here — what you paid, what they're worth, and your points. Tap the ☆ on your best bet to make it your ⭐ marquee (×{{marqueeMult}} points for the phase). Sell anytime, minus the fee outside trading windows.` },
  { page: 'league', icon: '🏆', title: 'Standings',
    body: `Where you rank against your league. Points come from how your films perform versus their estimates. The gap to the player above you is shown so you always know the chase.` },
  { page: 'intent', icon: '👁️', title: 'Watchlist',
    body: `Films you're tracking but haven't bought. Great for keeping an eye on prices before you commit. Your watchlist also feeds the buzz data.` },
  { page: 'community', icon: '👥', title: 'Community',
    body: `The social hub — reviews, comments, screenings you can join, and the league buzz feed. React, discuss, and organise cinema trips with your league.` },
  { page: 'howto', icon: '📖', title: 'The full guide',
    body: `Every rule, with sliders you can drag to see scoring, pricing and the roster penalties live. It's here whenever you want it — under How to Play in the menu.` },
  { page: 'market', icon: '✅', title: "You're all set!",
    body: `That's the tour. Head to the Market, find a film you believe in, and make your first pick. Good luck — may the box office be in your favour.` },
]

// ---- The one-off "welcome" card on the dashboard before your first buy -----
export const WELCOME_CARD =
  `Fill all **{{maxRoster}} roster slots** and deploy **{{minSpendPct}}%+** of your **{{cur}}{{myBudget}}M** — empty slots and idle cash both cost points. Name one **⭐ marquee** film (×{{marqueeMult}} points) on the Roster page. Films pay out Monday: opening + legs + bonuses, or −40 if they open below 60% of estimate. Tap any card to start.`
