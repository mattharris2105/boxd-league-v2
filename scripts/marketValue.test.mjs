// Minimal regression test for the shared valuation formula.
// Run: node scripts/marketValue.test.mjs   (exits non-zero on failure)
import { calcMarketValue, calcIPOprice } from '../src/lib/marketValue.js'

let failed = 0
const eq = (name, got, exp) => {
  const ok = got === exp
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  got ${got}  expected ${exp}`)
}

// calcIPOprice
eq('IPO est 2', calcIPOprice(2), 3)
eq('IPO est 5', calcIPOprice(5), 4)
eq('IPO est 15', calcIPOprice(15), 9)
eq('IPO est 50', calcIPOprice(50), 22)
eq('IPO est 175', calcIPOprice(175), 59)
eq('IPO est null', calcIPOprice(null), null)
eq('IPO est 0', calcIPOprice(0), 3)

// calcMarketValue — locked against the Task 3 backfill numbers
eq('MV Spider-Man', calcMarketValue({ basePrice: 59, estM: 175, rt: null }, 360.09, { 2: 144.25, 3: 70.71, 4: 39, 5: 22.51 }), 113)
eq('MV Moana', calcMarketValue({ basePrice: 29, estM: 70, rt: null }, 43.14, { 2: 17.94, 3: 10.64, 4: 5.61, 5: 2.98, 6: 1.25 }), 18)
eq('MV The Invite', calcMarketValue({ basePrice: 3, estM: 2, rt: null }, 5.93, { 2: 3.53, 3: 2.64 }), 7)
eq('MV Odyssey', calcMarketValue({ basePrice: 44, estM: 120, rt: null }, 123.5, { 2: 90.02, 3: 51.05, 4: 31.71, 5: 23.61, 6: 19.71 }), 55)
eq('MV no result -> basePrice', calcMarketValue({ basePrice: 12, estM: 20, rt: null }, null, {}), 12)
eq('MV opening only, met estimate', calcMarketValue({ basePrice: 10, estM: 10, rt: null }, 10, {}), 10)

if (failed) { console.log(`\n${failed} failing`); process.exit(1) }
console.log('\nall green')
