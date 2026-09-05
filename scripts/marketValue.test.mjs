// Minimal regression test for the shared valuation formula.
// Run: node scripts/marketValue.test.mjs   (exits non-zero on failure)
import { calcMarketValue, calcIPOprice } from '../src/lib/marketValue.js'
import { calcOpeningPts, calcWeeklyPts, calcLegsBonus } from '../src/lib/scoring.js'

let failed = 0
const eq = (name, got, exp) => {
  const ok = got === exp
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  got ${got}  expected ${exp}`)
}

// calcIPOprice — floor lifted to $7, top compressed to $105 ceiling, more
// spread through the low/mid range
eq('IPO est 2', calcIPOprice(2), 8)
eq('IPO est 5', calcIPOprice(5), 11)
eq('IPO est 15', calcIPOprice(15), 18)
eq('IPO est 50', calcIPOprice(50), 39)
eq('IPO est 175', calcIPOprice(175), 104)
eq('IPO est null', calcIPOprice(null), null)
eq('IPO est 0', calcIPOprice(0), 7)

// calcOpeningPts — 50/50 forecast-beat + sqrt-damped scale, with a flat -40
// flop penalty when a film opens below 60% of its estimate.
eq('PTS Spider-Man (2.1x est, $360M)', calcOpeningPts({ estM: 175, rt: null }, 360.09), 324)
eq('PTS The Invite (3x est, $6M)', calcOpeningPts({ estM: 2, rt: null }, 5.93), 217)
eq('PTS no result', calcOpeningPts({ estM: 10, rt: null }, null), 0)
eq('PTS flop (<60% of est) = -40 flat', calcOpeningPts({ estM: 100, rt: null }, 50), -40)
eq('PTS soft miss (65% of est) is NOT a flop', calcOpeningPts({ estM: 100, rt: null }, 65), 68)
eq('PTS Analyst chip +60 flat', calcOpeningPts({ estM: 10, rt: null }, 10, false, true),
  calcOpeningPts({ estM: 10, rt: null }, 10) + 60)
eq('PTS RT<50 penalty is small', // ~10% down, not 15%
  calcOpeningPts({ estM: 10, rt: 30 }, 10), Math.round(calcOpeningPts({ estM: 10, rt: null }, 10) * 0.90))

// calcWeeklyPts — legs = post-opening multiplier x 60, capped at 2.5x
eq('LEGS held ~1x its opening', calcWeeklyPts({ 2: 10, 3: 6, 4: 3 }, 20), 57)
eq('LEGS front-loaded (0.3x)', calcWeeklyPts({ 2: 4, 3: 1.5, 4: 0.5 }, 20), 18)
eq('LEGS no opening -> 0', calcWeeklyPts({ 2: 5 }, 0), 0)
eq('LEGS cap at 2.5x', calcWeeklyPts({ 2: 40, 3: 30, 4: 20, 5: 15 }, 20), 150)
eq('HOLD bonus: <30% wk2 drop', calcLegsBonus(20, 15), 25)
eq('HOLD bonus: big drop -> 0', calcLegsBonus(20, 8), 0)

// calcMarketValue — locked against the Task 3 backfill numbers
eq('MV Spider-Man', calcMarketValue({ basePrice: 59, estM: 175, rt: null }, 360.09, { 2: 144.25, 3: 70.71, 4: 39, 5: 22.51 }), 113)
eq('MV Moana', calcMarketValue({ basePrice: 29, estM: 70, rt: null }, 43.14, { 2: 17.94, 3: 10.64, 4: 5.61, 5: 2.98, 6: 1.25 }), 18)
eq('MV The Invite', calcMarketValue({ basePrice: 3, estM: 2, rt: null }, 5.93, { 2: 3.53, 3: 2.64 }), 7)
eq('MV Odyssey', calcMarketValue({ basePrice: 44, estM: 120, rt: null }, 123.5, { 2: 90.02, 3: 51.05, 4: 31.71, 5: 23.61, 6: 19.71 }), 55)
eq('MV no result -> basePrice', calcMarketValue({ basePrice: 12, estM: 20, rt: null }, null, {}), 12)
eq('MV opening only, met estimate', calcMarketValue({ basePrice: 10, estM: 10, rt: null }, 10, {}), 10)

if (failed) { console.log(`\n${failed} failing`); process.exit(1) }
console.log('\nall green')
