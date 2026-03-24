import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  app: { minHeight:'100vh', background:'#07080B', color:'#F2EEE8', fontFamily:'DM Mono, monospace' },
  topbar: { background:'#0C0E12', borderBottom:'1px solid #1E222C', padding:'0 24px', height:'52px', display:'flex', alignItems:'center', gap:'14px', position:'sticky', top:0, zIndex:100 },
  sidebar: { width:'200px', background:'#0C0E12', borderRight:'1px solid #1E222C', minHeight:'calc(100vh - 52px)', padding:'8px', flexShrink:0 },
  main: { flex:1, padding:'24px', overflowY:'auto' },
  card: { background:'#0C0E12', border:'1px solid #1E222C', borderRadius:'11px', padding:'16px', marginBottom:'12px' },
  btn: { border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'11px', letterSpacing:'1px', fontFamily:'DM Mono, monospace', cursor:'pointer', textTransform:'uppercase' },
  inp: { background:'#12141A', border:'1px solid #2A2F3C', color:'#F2EEE8', borderRadius:'7px', padding:'9px 12px', fontSize:'12px', fontFamily:'DM Mono, monospace', width:'100%', outline:'none' },
  gold: '#F0B429', green: '#2DD67A', red: '#FF4757',
}

const GENRE_COL = {
  Action:'#F4845F', Horror:'#C77DFF', Drama:'#74C0FC', Family:'#80ED99',
  'Sci-Fi':'#4D9EFF', Animation:'#FF9F43', Comedy:'#F5C842', Thriller:'#FF5C8A',
}

const FILMS = [
  {id:'f01',title:'Thunderbolts*',dist:'Marvel',genre:'Action',franchise:'MCU',basePrice:42,estM:88,rt:82,week:1,sleeper:false,trailer:'https://www.youtube.com/embed/-sAOWhvheK8'},
  {id:'f02',title:'Sinners',dist:'WB',genre:'Horror',franchise:null,basePrice:22,estM:45,rt:94,week:1,sleeper:false,trailer:'https://www.youtube.com/watch?v=XqvRVJXjSiU'},
  {id:'f03',title:'A Minecraft Movie',dist:'WB',genre:'Family',franchise:'Minecraft',basePrice:34,estM:75,rt:61,week:1,sleeper:false,trailer:'https://www.youtube.com/watch?v=nwqCHKFMnGI'},
  {id:'f04',title:'Final Destination 6',dist:'WB',genre:'Horror',franchise:'FD',basePrice:14,estM:30,rt:68,week:1,sleeper:false,trailer:'https://www.youtube.com/watch?v=wWFEFkvxORI'},
  {id:'f05',title:'Heart Eyes',dist:'Sony',genre:'Horror',franchise:null,basePrice:8,estM:14,rt:55,week:1,sleeper:true,trailer:'https://www.youtube.com/watch?v=aBDKxnLc7_E'},
  {id:'f06',title:'Mission: Impossible 8',dist:'Paramount',genre:'Action',franchise:'MI',basePrice:44,estM:72,rt:91,week:2,sleeper:false,trailer:'https://www.youtube.com/watch?v=avz_MFnDMwA'},
  {id:'f07',title:'Lilo & Stitch',dist:'Disney',genre:'Family',franchise:null,basePrice:36,estM:82,rt:78,week:2,sleeper:false,trailer:'https://www.youtube.com/watch?v=m9r0bP-TxB4'},
  {id:'f08',title:'28 Years Later',dist:'Sony',genre:'Horror',franchise:'28 Days',basePrice:24,estM:40,rt:88,week:2,sleeper:false,trailer:'https://www.youtube.com/watch?v=R4yrpnmEkxE'},
  {id:'f09',title:'Superman',dist:'DC/WB',genre:'Action',franchise:'DCU',basePrice:55,estM:120,rt:83,week:3,sleeper:false,trailer:'https://www.youtube.com/watch?v=zjgbTCFEfj8'},
  {id:'f10',title:'F1',dist:'Apple/WB',genre:'Drama',franchise:null,basePrice:28,estM:55,rt:89,week:3,sleeper:false,trailer:'https://www.youtube.com/watch?v=GFxuJkAR6iE'},
  {id:'f11',title:'Elio',dist:'Pixar',genre:'Animation',franchise:null,basePrice:26,estM:62,rt:80,week:3,sleeper:false,trailer:'https://www.youtube.com/watch?v=Ym4o3Gtu6rQ'},
  {id:'f12',title:'Jurassic World Rebirth',dist:'Universal',genre:'Action',franchise:'JW',basePrice:48,estM:110,rt:74,week:4,sleeper:false,trailer:'https://www.youtube.com/watch?v=Fnk5UHuHIY8'},
  {id:'f13',title:'How to Train Your Dragon',dist:'Universal',genre:'Family',franchise:'HTTYD',basePrice:42,estM:95,rt:85,week:4,sleeper:false,trailer:'https://www.youtube.com/watch?v=S3GBMgTHMtg'},
  {id:'f14',title:'Avatar: Fire and Ash',dist:'Disney',genre:'Sci-Fi',franchise:'Avatar',basePrice:72,estM:190,rt:null,week:5,sleeper:false,trailer:'https://www.youtube.com/watch?v=5HCH4tFaLVs'},
  {id:'f15',title:'The Fantastic Four',dist:'Marvel',genre:'Action',franchise:'MCU',basePrice:62,estM:140,rt:null,week:5,sleeper:false,trailer:'https://www.youtube.com/watch?v=V2hCMOPFWS0'},
]

function calcMarketValue(film, actualM) {
  if (actualM == null) return film.basePrice
  let base = actualM * 0.35
  if (film.rt >= 90) base *= 1.20
  else if (film.rt >= 75) base *= 1.08
  else if (film.rt < 50 && film.rt != null) base *= 0.85
  base = Math.max(film.basePrice * 0.2, base)
  base = Math.min(film.basePrice * 3.5, base)
  return Math.round(base)
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('market')
  const [players, setPlayers] = useState([])
  const [rosters, setRosters] = useState([])
  const [results, setResults] = useState({})
  const [filmValues, setFilmValues] = useState({})
  const [weeklyGrosses, setWeeklyGrosses] = useState({})
  const [leagueConfig, setLeagueConfig] = useState({ current_week:1, season_budget:500, currency:'$', tx_fee:5, late_tax:0.15, max_roster:8 })
  const [notif, setNotif] = useState(null)
  const [trailerFilm, setTrailerFilm] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_e, session) => setSession(session))
  }, [])

  useEffect(() => {
    if (session) { loadProfile(); loadData() }
  }, [session])

  const notify = (msg, col=S.gold) => {
    setNotif({ msg, col })
    setTimeout(() => setNotif(null), 2800)
  }

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  const loadData = async () => {
    const [{ data: ps }, { data: rs }, { data: res }, { data: fv }, { data: cfg }, { data: wg }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('rosters').select('*').eq('active', true),
      supabase.from('results').select('*'),
      supabase.from('film_values').select('*'),
      supabase.from('league_config').select('*').eq('id', 1).single(),
      supabase.from('weekly_grosses').select('*'),
    ])
    if (ps) setPlayers(ps)
    if (rs) setRosters(rs)
    if (res) { const map = {}; res.forEach(r => map[r.film_id] = r.actual_m); setResults(map) }
    if (fv) { const map = {}; fv.forEach(v => map[v.film_id] = v.current_value); setFilmValues(map) }
    if (cfg) setLeagueConfig(cfg)
    if (wg) {
      const map = {}
      wg.forEach(w => {
        if (!map[w.film_id]) map[w.film_id] = {}
        map[w.film_id][w.week_num] = w.gross_m
      })
      setWeeklyGrosses(map)
    }
  }

  const getFilmValue = (film) => filmValues[film.id] ?? film.basePrice
  const getBudgetSpent = (pid) => rosters.filter(r => r.player_id === pid).reduce((s, r) => s + r.bought_price, 0)
  const getBudgetLeft = (pid) => leagueConfig.season_budget - getBudgetSpent(pid)

  const getWeeklyPts = (filmId) => {
    const weeks = weeklyGrosses[filmId] || {}
    return Object.values(weeks).reduce((s, g) => s + g * 0.5, 0)
  }

  const buyFilm = async (film) => {
    if (!profile) return notify('Create a profile first', S.red)
    if (rosters.find(r => r.player_id === profile.id && r.film_id === film.id && r.active)) return notify('Already in your roster', S.red)
    const myRoster = rosters.filter(r => r.player_id === profile.id && r.active)
    if (myRoster.length >= leagueConfig.max_roster) return notify(`Roster full (${leagueConfig.max_roster} max)`, S.red)
    const price = getFilmValue(film)
    const left = getBudgetLeft(profile.id)
    if (price > left) return notify(`Not enough budget ($${price} needed, $${left} left)`, S.red)
    const { error } = await supabase.from('rosters').insert({ player_id: profile.id, film_id: film.id, bought_price: price, bought_week: leagueConfig.current_week, active: true })
    if (error) return notify(error.message, S.red)
    await supabase.from('transactions').insert({ player_id: profile.id, film_id: film.id, type: 'buy', price, week: leagueConfig.current_week })
    notify(`Acquired ${film.title} for $${price}M`, S.green)
    loadData()
  }

  const sellFilm = async (film) => {
    const holding = rosters.find(r => r.player_id === profile.id && r.film_id === film.id)
    if (!holding) return
    const currentVal = getFilmValue(film)
    const fee = leagueConfig.tx_fee
    const proceeds = Math.max(0, currentVal - fee)
    await supabase.from('rosters').update({ active: false, sold_price: proceeds, sold_week: leagueConfig.current_week }).eq('id', holding.id)
    await supabase.from('transactions').insert([
      { player_id: profile.id, film_id: film.id, type: 'sell', price: proceeds, week: leagueConfig.current_week },
      { player_id: profile.id, film_id: film.id, type: 'fee', price: fee, week: leagueConfig.current_week },
    ])
    notify(`Sold ${film.title} — received $${proceeds}M`, S.gold)
    loadData()
  }

  const calcPoints = (pid) => {
    let total = 0
    rosters.filter(r => r.player_id === pid).forEach(holding => {
      const film = FILMS.find(f => f.id === holding.film_id)
      if (!film) return
      const actual = results[film.id]
      if (actual == null) return
      let pts = actual
      if (film.rt >= 90) pts *= 1.25
      else if (film.rt >= 75) pts *= 1.10
      else if (film.rt < 50 && film.rt != null) pts *= 0.85
      const ratio = actual / film.estM
      if (ratio >= 1.3) pts *= 1.30
      else if (ratio <= 0.5) pts -= 10
      pts += getWeeklyPts(film.id)
      total += Math.round(pts)
    })
    return total
  }

  if (loading) return <div style={{...S.app, display:'flex', alignItems:'center', justifyContent:'center'}}><div style={{color:S.gold, fontSize:'24px'}}>Loading...</div></div>
  if (!session) return <Login />
  if (!profile) return <CreateProfile session={session} onCreated={() => { loadProfile(); loadData() }} notify={notify} />

  const myRoster = rosters.filter(r => r.player_id === profile.id)
  const budgetLeft = getBudgetLeft(profile.id)
  const cur = leagueConfig.currency || '$'

  return (
    <div style={S.app}>
      <div style={S.topbar}>
        <div style={{fontFamily:'sans-serif', fontSize:'22px', fontWeight:900, color:S.gold, letterSpacing:'-1px'}}>BOXD</div>
        <div style={{fontSize:'10px', color:'#4A5168', letterSpacing:'2px'}}>FANTASY BOX OFFICE</div>
        <div style={{background:'#12141A', border:'1px solid #2A2F3C', borderRadius:'7px', padding:'5px 12px', marginLeft:'8px'}}>
          <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px'}}>BUDGET LEFT</div>
          <div style={{fontSize:'16px', fontWeight:700, color:budgetLeft < 50 ? S.red : S.green}}>{cur}{budgetLeft}M</div>
        </div>
        <div style={{marginLeft:'auto', display:'flex', gap:'6px', alignItems:'center'}}>
          <div style={{fontSize:'11px', color:'#4A5168'}}>{profile.name}</div>
          <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', fontSize:'9px'}} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      <div style={{display:'flex'}}>
        <div style={S.sidebar}>
          {[['market','🎬','Market'],['roster','📁','My Roster'],['league','🏆','League'],['results','📊','Results']].map(([id,ic,lb]) => (
            <div key={id} onClick={() => setPage(id)} style={{display:'flex', alignItems:'center', gap:'8px', padding:'9px 10px', borderRadius:'7px', cursor:'pointer', fontSize:'11px', marginBottom:'2px', background:page===id?'#F0B42914':'none', color:page===id?S.gold:'#6B7080'}}>
              <span>{ic}</span>{lb}
            </div>
          ))}
        </div>

        <div style={S.main}>
          {page === 'market' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'6px'}}>Film Market</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'20px'}}>Season budget: {cur}{leagueConfig.season_budget}M · Tx fee: {cur}{leagueConfig.tx_fee}M to drop · {myRoster.length}/{leagueConfig.max_roster} slots used</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px'}}>
                {FILMS.map(film => {
                  const owned = myRoster.find(r => r.film_id === film.id && r.active)
                  const val = getFilmValue(film)
                  const actual = results[film.id]
                  const genreCol = GENRE_COL[film.genre] || '#888'
                  const priceDelta = val - film.basePrice
                  const weeklyPts = getWeeklyPts(film.id)
                  return (
                    <div key={film.id} style={{...S.card, border:`1px solid ${owned ? S.gold+'44' : '#1E222C'}`, background:owned?'#F0B42908':'#0C0E12', position:'relative', overflow:'hidden'}}>
                      <div style={{position:'absolute', top:0, left:0, right:0, height:'2px', background:genreCol}} />
                      <div style={{fontSize:'12px', fontWeight:700, marginBottom:'2px', marginTop:'4px'}}>{film.title}</div>
                      <div style={{fontSize:'9px', color:'#4A5168', marginBottom:'10px'}}>{film.dist} · W{film.week}</div>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'8px'}}>
                        <div>
                          <div style={{fontSize:'18px', fontWeight:800, color:owned?S.gold:'#F2EEE8'}}>{cur}{val}M</div>
                          <div style={{fontSize:'9px', color:priceDelta>0?S.green:priceDelta<0?S.red:'#4A5168'}}>{priceDelta===0?'—':priceDelta>0?'▲':'▼'} IPO {cur}{film.basePrice}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          {film.rt && <div style={{fontSize:'9px', color:film.rt>=90?S.green:film.rt>=75?S.gold:S.red}}>🍅 {film.rt}%</div>}
                          <div style={{fontSize:'9px', color:'#4A5168'}}>Est ${film.estM}M</div>
                        </div>
                      </div>
                      <div style={{display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'10px'}}>
                        <span style={{fontSize:'8px', padding:'2px 6px', borderRadius:'4px', background:genreCol+'18', color:genreCol}}>{film.genre}</span>
                        {film.franchise && <span style={{fontSize:'8px', padding:'2px 6px', borderRadius:'4px', background:'#A855F718', color:'#A855F7'}}>{film.franchise}</span>}
                        {film.sleeper && <span style={{fontSize:'8px', padding:'2px 6px', borderRadius:'4px', background:'#4D9EFF18', color:'#4D9EFF'}}>💤 Sleeper</span>}
                      </div>
                      {actual != null && <div style={{fontSize:'10px', color:S.green, marginBottom:'4px'}}>Actual: ${actual}M</div>}
                      {weeklyPts > 0 && <div style={{fontSize:'9px', color:'#4D9EFF', marginBottom:'8px'}}>+{Math.round(weeklyPts)} weekly pts</div>}
                      {film.trailer && <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', width:'100%', fontSize:'9px', marginBottom:'8px'}} onClick={e => { e.stopPropagation(); setTrailerFilm(film) }}>▶ Watch Trailer</button>}
                      {owned
                        ? <button style={{...S.btn, background:'none', border:`1px solid ${S.red}44`, color:S.red, width:'100%', fontSize:'9px'}} onClick={() => sellFilm(film)}>Drop · get {cur}{Math.max(0,val-leagueConfig.tx_fee)}M</button>
                        : <button style={{...S.btn, background:S.gold, color:'#000', width:'100%', fontSize:'9px'}} onClick={() => buyFilm(film)}>Acquire · {cur}{val}M</button>
                      }
                      {(() => {
                        const owners = rosters.filter(r => r.film_id === film.id && r.active)
                        return owners.length > 0
                          ? <div style={{fontSize:'9px', color:'#4A5168', marginTop:'6px', textAlign:'center'}}>{owners.length} player{owners.length>1?'s':''} own this</div>
                          : null
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {page === 'roster' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'6px'}}>My Roster</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'20px'}}>{myRoster.length} films · {cur}{getBudgetSpent(profile.id)} spent · {cur}{budgetLeft} remaining</div>
              {myRoster.length === 0
                ? <div style={{...S.card, textAlign:'center', color:'#4A5168', padding:'32px'}}>No films yet. Go to Market to acquire.</div>
                : myRoster.map(holding => {
                    const film = FILMS.find(f => f.id === holding.film_id)
                    if (!film) return null
                    const val = getFilmValue(film)
                    const actual = results[film.id]
                    const pnl = val - holding.bought_price
                    const genreCol = GENRE_COL[film.genre] || '#888'
                    const weeklyPts = getWeeklyPts(film.id)
                    const weeks = weeklyGrosses[film.id] || {}
                    return (
                      <div key={holding.id} style={{...S.card}}>
                        <div style={{display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
                          <div style={{width:'3px', height:'36px', borderRadius:'2px', background:genreCol, flexShrink:0}} />
                          <div style={{flex:2, minWidth:'120px'}}>
                            <div style={{fontSize:'13px', fontWeight:600}}>{film.title}</div>
                            <div style={{fontSize:'9px', color:'#4A5168'}}>{film.dist} · Week {film.week}</div>
                          </div>
                          <div style={{textAlign:'center'}}><div style={{fontSize:'8px', color:'#4A5168'}}>BOUGHT</div><div style={{fontSize:'12px'}}>{cur}{holding.bought_price}</div></div>
                          <div style={{textAlign:'center'}}><div style={{fontSize:'8px', color:'#4A5168'}}>NOW</div><div style={{fontSize:'12px', color:pnl>=0?S.green:S.red}}>{cur}{val}</div></div>
                          <div style={{textAlign:'center'}}><div style={{fontSize:'8px', color:'#4A5168'}}>P&L</div><div style={{fontSize:'13px', fontWeight:700, color:pnl>=0?S.green:S.red}}>{pnl>=0?'+':''}{pnl}</div></div>
                          {actual != null && <div style={{textAlign:'center'}}><div style={{fontSize:'8px', color:'#4A5168'}}>OPENING</div><div style={{fontSize:'12px', color:S.green}}>${actual}M</div></div>}
                          {weeklyPts > 0 && <div style={{textAlign:'center'}}><div style={{fontSize:'8px', color:'#4A5168'}}>WEEKLY PTS</div><div style={{fontSize:'12px', color:'#4D9EFF'}}>+{Math.round(weeklyPts)}</div></div>}
                        </div>
                        {Object.keys(weeks).length > 0 && (
                          <div style={{marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #1E222C', display:'flex', gap:'8px', flexWrap:'wrap'}}>
                            {Object.entries(weeks).sort((a,b)=>a[0]-b[0]).map(([wk, gross]) => (
                              <div key={wk} style={{background:'#12141A', borderRadius:'6px', padding:'4px 10px', fontSize:'10px'}}>
                                <span style={{color:'#4A5168'}}>W{wk}: </span>
                                <span style={{color:'#4D9EFF'}}>${gross}M</span>
                                <span style={{color:'#4A5168'}}> (+{Math.round(gross*0.5)}pts)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
              }
            </div>
          )}

          {page === 'league' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'20px'}}>League Standings</div>
              {players.length === 0 && <div style={{...S.card, textAlign:'center', color:'#4A5168'}}>No players yet.</div>}
              {[...players].sort((a,b) => calcPoints(b.id) - calcPoints(a.id)).map((player, i) => {
                const pts = calcPoints(player.id)
                const rank = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`
                return (
                  <div key={player.id} style={{...S.card, display:'flex', alignItems:'center', gap:'14px'}}>
                    <div style={{fontSize:'22px', minWidth:'32px'}}>{rank}</div>
                    <div style={{width:'9px', height:'9px', borderRadius:'50%', background:player.color||S.gold}} />
                    <div style={{flex:1}}>
                      <div style={{fontSize:'14px', fontWeight:600, color:player.color||S.gold}}>{player.name}</div>
                      <div style={{fontSize:'9px', color:'#4A5168'}}>{rosters.filter(r=>r.player_id===player.id).length} films · {cur}{getBudgetLeft(player.id)} left</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'28px', fontWeight:800, color:i===0?S.gold:'#F2EEE8'}}>{pts}</div>
                      <div style={{fontSize:'8px', color:'#4A5168'}}>PTS</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {page === 'results' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'6px'}}>Enter Results</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'20px'}}>Commissioner view · Enter opening weekend + weekly grosses</div>
              {FILMS.map(film => {
                const actual = results[film.id]
                const weeks = weeklyGrosses[film.id] || {}
                return (
                  <div key={film.id} style={{...S.card}}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap', marginBottom: actual != null ? '12px' : '0'}}>
                      <div style={{flex:2, minWidth:'130px'}}>
                        <div style={{fontSize:'13px', fontWeight:500}}>{film.title}</div>
                        <div style={{fontSize:'9px', color:'#4A5168'}}>Est ${film.estM}M · IPO ${film.basePrice}</div>
                      </div>
                      <input type="number" step="0.1" defaultValue={actual||''} placeholder="Opening $M" id={`res-${film.id}`} style={{...S.inp, width:'120px'}} />
                      <button style={{...S.btn, background:S.green, color:'#000'}} onClick={async () => {
                        const val = parseFloat(document.getElementById(`res-${film.id}`).value)
                        if (isNaN(val)) return notify('Enter a number', S.red)
                        const newValue = calcMarketValue(film, val)
                        await supabase.from('results').upsert({ film_id: film.id, actual_m: val })
                        await supabase.from('film_values').upsert({ film_id: film.id, current_value: newValue })
                        notify(`Saved · ${film.title} now $${newValue}`, S.gold)
                        loadData()
                      }}>Save Opening</button>
                      {actual != null && <div style={{fontSize:'12px', color:S.green}}>${actual}M → $${getFilmValue(film)}</div>}
                    </div>
                    {actual != null && (
                      <div style={{borderTop:'1px solid #1E222C', paddingTop:'10px'}}>
                        <div style={{fontSize:'9px', color:'#4A5168', letterSpacing:'1px', marginBottom:'8px'}}>WEEKLY GROSSES (Week 2 onwards · 0.5pts per $1M)</div>
                        <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                          {[2,3,4,5,6,7,8].map(wk => (
                            <div key={wk} style={{display:'flex', flexDirection:'column', gap:'4px', alignItems:'center'}}>
                              <div style={{fontSize:'9px', color:'#4A5168'}}>W{wk}</div>
                              <input
                                type="number" step="0.1" placeholder="$M"
                                defaultValue={weeks[wk]||''}
                                id={`weekly-${film.id}-${wk}`}
                                style={{...S.inp, width:'70px', fontSize:'11px', padding:'6px 8px'}}
                              />
                              <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', fontSize:'8px', padding:'3px 8px'}}
                                onClick={async () => {
                                  const val = parseFloat(document.getElementById(`weekly-${film.id}-${wk}`).value)
                                  if (isNaN(val)) return notify('Enter a number', S.red)
                                  await supabase.from('weekly_grosses').upsert({ film_id: film.id, week_num: wk, gross_m: val })
                                  notify(`W${wk} saved · +${Math.round(val*0.5)}pts`, S.gold)
                                  loadData()
                                }}>Save</button>
                              {weeks[wk] && <div style={{fontSize:'9px', color:'#4D9EFF'}}>+{Math.round(weeks[wk]*0.5)}pts</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {notif && (
        <div style={{position:'fixed', bottom:'20px', right:'20px', background:'#0C0E12', border:`1px solid ${notif.col}`, borderRadius:'9px', padding:'11px 16px', fontSize:'11px', zIndex:600, maxWidth:'280px'}}>
          {notif.msg}
        </div>
      )}
      {trailerFilm && (
        <div style={{position:'fixed', inset:0, background:'#000000EE', display:'flex', alignItems:'center', justifyContent:'center', zIndex:700, padding:'20px'}} onClick={() => setTrailerFilm(null)}>
          <div style={{width:'100%', maxWidth:'800px'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
              <div style={{fontSize:'14px', fontWeight:700, color:'#F2EEE8'}}>{trailerFilm.title}</div>
              <button style={{background:'none', border:'1px solid #2A2F3C', color:'#4A5168', borderRadius:'6px', padding:'4px 12px', cursor:'pointer', fontFamily:'DM Mono, monospace', fontSize:'11px'}} onClick={() => setTrailerFilm(null)}>✕ Close</button>
            </div>
            <div style={{position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:'10px'}}>
              <iframe src={`${trailerFilm.trailer}?autoplay=1`} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:'10px'}} allow="autoplay; fullscreen" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://boxd-league-v2.vercel.app' }
    })
    if (error) alert(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div style={{minHeight:'100vh', background:'#07080B', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px', fontWeight:900, color:'#F0B429', marginBottom:'16px'}}>BOXD</div>
        <div style={{color:'#F2EEE8', marginBottom:'8px'}}>Check your email</div>
        <div style={{color:'#4A5168', fontSize:'12px'}}>Magic link sent to {email}</div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#07080B', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace'}}>
      <div style={{width:'320px'}}>
        <div style={{fontSize:'48px', fontWeight:900, color:'#F0B429', marginBottom:'8px'}}>BOXD</div>
        <div style={{color:'#4A5168', fontSize:'11px', letterSpacing:'3px', marginBottom:'32px'}}>FANTASY BOX OFFICE</div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{width:'100%', background:'#12141A', border:'1px solid #2A2F3C', color:'white', borderRadius:'8px', padding:'12px', fontSize:'13px', fontFamily:'monospace', marginBottom:'10px', outline:'none'}} />
          <button type="submit" disabled={loading}
            style={{width:'100%', background:'#F0B429', color:'#000', border:'none', borderRadius:'8px', padding:'12px', fontSize:'12px', fontWeight:700, cursor:'pointer', letterSpacing:'1px', fontFamily:'monospace'}}>
            {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
          </button>
        </form>
      </div>
    </div>
  )
}

function CreateProfile({ session, onCreated, notify }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const COLORS = ['#F0B429','#2DD67A','#FF5C8A','#4D9EFF','#FF8C3D','#A855F7']
  const [color, setColor] = useState(COLORS[0])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase.from('profiles').insert({ id: session.user.id, name: name.trim(), color })
    if (error) { notify(error.message, '#FF4757'); setLoading(false); return }
    onCreated()
  }

  return (
    <div style={{minHeight:'100vh', background:'#07080B', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace'}}>
      <div style={{width:'320px'}}>
        <div style={{fontSize:'48px', fontWeight:900, color:'#F0B429', marginBottom:'8px'}}>BOXD</div>
        <div style={{color:'#F2EEE8', marginBottom:'6px', fontSize:'14px'}}>Create your player profile</div>
        <div style={{color:'#4A5168', fontSize:'11px', marginBottom:'24px'}}>{session.user.email}</div>
        <form onSubmit={handleCreate}>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required
            style={{width:'100%', background:'#12141A', border:'1px solid #2A2F3C', color:'white', borderRadius:'8px', padding:'12px', fontSize:'13px', fontFamily:'monospace', marginBottom:'14px', outline:'none'}} />
          <div style={{fontSize:'9px', color:'#4A5168', letterSpacing:'1px', marginBottom:'8px'}}>PICK YOUR COLOUR</div>
          <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{width:'28px', height:'28px', borderRadius:'50%', background:c, cursor:'pointer', border:color===c?'2px solid white':'2px solid transparent'}} />
            ))}
          </div>
          <button type="submit" disabled={loading}
            style={{width:'100%', background:'#F0B429', color:'#000', border:'none', borderRadius:'8px', padding:'12px', fontSize:'12px', fontWeight:700, cursor:'pointer', letterSpacing:'1px', fontFamily:'monospace'}}>
            {loading ? 'CREATING...' : 'JOIN LEAGUE'}
          </button>
        </form>
      </div>
    </div>
  )
}
