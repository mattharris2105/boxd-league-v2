import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────────
const T = {
  bg:        '#0D0A08',
  surface:   '#161210',
  surfaceUp: '#1E1916',
  border:    '#2A2420',
  borderUp:  '#382E28',
  text:      '#F2EAE0',
  textSub:   '#8A7A6E',
  textDim:   '#46392E',
  gold:      '#E8A020',
  goldSoft:  '#E8A02018',
  green:     '#3DD68C',
  red:       '#F04F5A',
  blue:      '#4A9EF5',
  purple:    '#B06EF0',
  orange:    '#F08030',
  mono:      '"DM Mono", "Fira Mono", "Courier New", monospace',
}

const GENRE_COL = {
  Action:'#F4845F', Horror:'#B06EF0', Drama:'#74C0FC', Family:'#80ED99',
  'Sci-Fi':'#4DA8FF', Animation:'#FFB040', Comedy:'#F5C842',
  Thriller:'#FF5C8A', Concert:'#FF8C3D', Adventure:'#3DD68C',
}

const COMMISSIONER_EMAIL = 'mattharris2105@gmail.com'
const EARLY_BIRD_WEEKS   = 4
const MAX_ROSTER         = 6
const PHASE_BUDGETS      = { 1:80, 2:150, 3:80, 4:100, 5:120 }
const PHASE_NAMES        = { 1:'Dead Zone', 2:'Summer Slate', 3:'Horror Window', 4:'Awards Season', 5:'Oscar Sprint' }
const TMDB_TOKEN         = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZjA0OTBiOGU0OWQxNjFmYmIzMjBmYjg5NGJhOTQ1MyIsIm5iZiI6MTc3NTA4Mjg0Mi4xNzcsInN1YiI6IjY5Y2Q5ZDVhZGE4ZjEwZmZmNTJmNmE3MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.fxBTZG1YMdHkUUgz55l2TUWGa7YKsDUz8JbuFgr84q0'
const EMOJI_OPTIONS      = ['🔥','💀','😂','🎯','📈','📉','👑','💸','🍿','😬']

const BOTTOM_TABS = [
  { id:'market',  icon:'🎬', label:'Market'  },
  { id:'roster',  icon:'📁', label:'Roster'  },
  { id:'chips',   icon:'⚡', label:'Chips'   },
  { id:'league',  icon:'🥇', label:'League'  },
  { id:'feed',    icon:'📡', label:'Feed'    },
]

const PLAYER_COLORS = ['#E8A020','#3DD68C','#F04F5A','#4A9EF5','#F08030','#B06EF0','#FF5C8A','#74C0FC']

// ── GLOBAL CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin:0; padding:0; background:${T.bg}; }
  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:3px; }
  @keyframes shimmer {
    0%   { background-position:-600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes pulse {
    0%,100% { opacity:1;   }
    50%      { opacity:0.4; }
  }
  @keyframes slideUp {
    from { transform:translateY(100%); }
    to   { transform:translateY(0);    }
  }
  .hoverable { transition:border-color .15s, transform .15s, background .15s; }
  .hoverable:active { transform:scale(0.985); opacity:0.9; }
  .pressable:active { transform:scale(0.96); opacity:0.8; }
`

// ── SHARED STYLES ───────────────────────────────────────────────────────────────
const S = {
  btn: {
    border:'none', borderRadius:'9px', fontFamily:T.mono,
    cursor:'pointer', fontWeight:500, letterSpacing:'0.7px',
    textTransform:'uppercase', transition:'opacity .15s, transform .15s',
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'5px',
  },
  inp: {
    background:T.surfaceUp, border:`1px solid ${T.border}`,
    color:T.text, borderRadius:'9px', padding:'11px 14px',
    fontSize:'13px', fontFamily:T.mono, width:'100%', outline:'none',
    transition:'border-color .15s',
  },
  card: {
    background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:'14px', padding:'16px',
  },
  label: {
    fontSize:'10px', color:T.textDim, letterSpacing:'1.8px',
    textTransform:'uppercase', fontWeight:500, fontFamily:T.mono,
  },
  pageTitle: {
    fontSize:'24px', fontWeight:700, color:T.text,
    letterSpacing:'-0.5px', lineHeight:1.2, fontFamily:T.mono,
  },
  sectionTitle: {
    fontSize:'13px', fontWeight:600, color:T.textSub,
    letterSpacing:'0.3px', fontFamily:T.mono,
  },
}

function Btn({ children, onClick, color=T.gold, textColor='#0D0A08', variant='solid', size='md', disabled, full, sx={} }) {
  const pad  = size==='sm' ? '8px 14px' : size==='lg' ? '14px 24px' : '10px 18px'
  const fs   = size==='sm' ? '11px'     : size==='lg' ? '13px'      : '12px'
  return (
    <button onClick={onClick} disabled={disabled} className="pressable" style={{
      ...S.btn, padding:pad, fontSize:fs,
      background: variant==='solid' ? color : 'transparent',
      color:      variant==='solid' ? textColor : color,
      border:     variant==='outline' ? `1px solid ${color}55` : 'none',
      opacity:    disabled ? 0.35 : 1,
      cursor:     disabled ? 'not-allowed' : 'pointer',
      width:      full ? '100%' : undefined,
      ...sx,
    }}>{children}</button>
  )
}

function Badge({ children, color=T.gold }) {
  return (
    <span style={{
      fontSize:'10px', fontWeight:500, color,
      background:`${color}20`, padding:'2px 8px',
      borderRadius:'20px', display:'inline-flex', alignItems:'center', gap:'3px', lineHeight:1.5,
    }}>{children}</span>
  )
}

function Pill({ children, color=T.textSub }) {
  return (
    <span style={{
      fontSize:'11px', color, background:`${color}18`,
      padding:'3px 9px', borderRadius:'20px',
      display:'inline-block', lineHeight:1.4, whiteSpace:'nowrap',
    }}>{children}</span>
  )
}

function Divider({ my=12 }) {
  return <div style={{ height:'1px', background:T.border, margin:`${my}px 0` }}/>
}

function StatBox({ label, value, color=T.text, sub }) {
  return (
    <div style={{ background:T.surfaceUp, borderRadius:'10px', padding:'12px 14px', flex:1, minWidth:0 }}>
      <div style={{ ...S.label, marginBottom:'5px' }}>{label}</div>
      <div style={{ fontSize:'22px', fontWeight:700, color, lineHeight:1, fontFamily:T.mono }}>{value}</div>
      {sub && <div style={{ fontSize:'11px', color:T.textSub, marginTop:'3px' }}>{sub}</div>}
    </div>
  )
}

// ── TMDB POSTER SYSTEM ─────────────────────────────────────────────────────────
const posterCache = {}

async function fetchTMDBPoster(title) {
  if (posterCache[title] !== undefined) return posterCache[title]
  posterCache[title] = null

  const queries = [
    title,
    title.replace(/\s*\(.*?\)\s*/g, '').trim(),
    title.split(':')[0].trim(),
    title.replace(/[^a-zA-Z0-9\s]/g, '').trim(),
  ].filter((q, i, a) => q && a.indexOf(q) === i)

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&language=en-US&page=1&include_adult=false`,
        { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' } }
      )
      if (!res.ok) continue
      const data = await res.json()
      const hit = (data.results || []).find(r => r.poster_path)
      if (hit?.poster_path) {
        posterCache[title] = `https://image.tmdb.org/t/p/w342${hit.poster_path}`
        return posterCache[title]
      }
    } catch {}
  }
  return null
}

function PosterSkeleton({ width, height, radius=8 }) {
  return (
    <div style={{
      width, height, borderRadius:radius, flexShrink:0, overflow:'hidden',
      background:`linear-gradient(90deg, ${T.surfaceUp} 25%, ${T.border} 50%, ${T.surfaceUp} 75%)`,
      backgroundSize:'600px 100%',
      animation:'shimmer 1.6s ease-in-out infinite',
      willChange:'background-position',
    }}/>
  )
}

// Outer wrapper always reserves the exact pixel space — no layout shift ever
function FilmPoster({ film, width, height, radius=8, imgStyle={} }) {
  const [url, setUrl] = useState(posterCache[film?.title] !== undefined ? posterCache[film.title] : undefined)
  const gc = GENRE_COL[film?.genre] || T.textSub

  useEffect(() => {
    if (!film?.title) { setUrl(null); return }
    // Already resolved synchronously in useState initialiser — skip
    if (posterCache[film.title] !== undefined) return
    let cancelled = false
    fetchTMDBPoster(film.title).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [film?.title])

  const w = typeof width  === 'number' ? `${width}px`  : width
  const h = typeof height === 'number' ? `${height}px` : height

  // Always render a wrapper of fixed size — only inner content swaps
  return (
    <div style={{ width:w, height:h, borderRadius:radius, flexShrink:0, overflow:'hidden', position:'relative', contain:'strict', transform:'translateZ(0)', isolation:'isolate' }}>
      {url === undefined && (
        <div style={{
          position:'absolute', inset:0,
          background:`linear-gradient(90deg, ${T.surfaceUp} 25%, ${T.border} 50%, ${T.surfaceUp} 75%)`,
          backgroundSize:'600px 100%',
          animation:'shimmer 1.6s ease-in-out infinite',
          willChange:'background-position',
        }}/>
      )}
      {url === null && (
        <div style={{
          position:'absolute', inset:0,
          background:`linear-gradient(145deg, ${gc}28 0%, ${T.surfaceUp} 100%)`,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5,
        }}>
          <div style={{ fontSize: typeof width === 'number' ? Math.max(16, width * 0.28) : 20, lineHeight:1 }}>🎬</div>
          <div style={{ fontSize:'9px', color:gc, textAlign:'center', padding:'0 6px', lineHeight:1.2, letterSpacing:'0.5px' }}>{film?.genre}</div>
        </div>
      )}
      {url && (
        <img
          src={url} alt={film?.title}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block', ...imgStyle }}
          onError={() => setUrl(null)}
        />
      )}
    </div>
  )
}

// ── SCORING ────────────────────────────────────────────────────────────────────
function calcMarketValue(film, actualM) {
  if (actualM == null) return film.basePrice
  const r = actualM / film.estM
  const perf = r>=2?2 : r>=1.5?1.6 : r>=1.3?1.35 : r>=1.1?1.15 : r>=0.95?1 : r>=0.8?0.85 : r>=0.6?0.65 : r>=0.4?0.45 : 0.25
  const rt   = film.rt!=null ? (film.rt>=90?1.15 : film.rt>=75?1.08 : film.rt<50?0.9 : 1) : 1
  return Math.round(Math.max(film.basePrice*0.15, Math.min(film.basePrice*3, film.basePrice*perf*rt)))
}

function calcOpeningPts(film, actualM, isEB=false, isAnalyst=false) {
  if (actualM == null) return 0
  const r    = actualM / film.estM
  const perf = r>=2?2 : r>=1.5?1.6 : r>=1.3?1.35 : r>=1.1?1.15 : r>=0.95?1 : r>=0.8?0.85 : r>=0.6?0.65 : 0.45
  const rt   = film.rt!=null ? (film.rt>=90?1.25 : film.rt>=75?1.1 : film.rt<50?0.85 : 1) : 1
  let pts = Math.round(actualM * perf * rt)
  if (isEB && r >= 1.1) pts = Math.round(pts * 1.1)
  if (isAnalyst)        pts += 60
  return pts
}

function calcLegsBonus(actualM, week2Gross) {
  return (actualM!=null && week2Gross!=null && (actualM-week2Gross)/actualM < 0.3) ? 25 : 0
}

function calcWeeklyPts(weekMap) {
  return Object.entries(weekMap).reduce((s, [wk, g]) => s + Number(g) * (Number(wk) >= 4 ? 1.1 : 1), 0)
}

function calcDemandMult(film, rosters, phase, totalPlayers) {
  if (!totalPlayers) return 1
  const pct = rosters.filter(r => r.film_id===film.id && r.phase===phase && r.active).length / totalPlayers
  return pct>0.4?1.4 : pct>0.25?1.25 : pct>0.15?1.1 : pct<0.05?0.9 : 1
}

function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d/60000), h = Math.floor(d/3600000), dy = Math.floor(d/86400000)
  return d<60000 ? 'just now' : m<60 ? `${m}m` : h<24 ? `${h}h` : `${dy}d`
}

// ── DB HELPERS ─────────────────────────────────────────────────────────────────
async function dbUpsert(table, col, val, data) {
  const { data:ex } = await supabase.from(table).select(col).eq(col, val)
  if (ex?.length) return supabase.from(table).update(data).eq(col, val)
  return supabase.from(table).insert({ [col]:val, ...data })
}
async function dbUpsertWeekly(filmId, wk, g) {
  const { data:ex } = await supabase.from('weekly_grosses').select('id').eq('film_id',filmId).eq('week_num',wk)
  if (ex?.length) return supabase.from('weekly_grosses').update({gross_m:g}).eq('film_id',filmId).eq('week_num',wk)
  return supabase.from('weekly_grosses').insert({film_id:filmId, week_num:wk, gross_m:g})
}
async function logActivity(uid, type, payload) {
  try { await supabase.from('activity_feed').insert({ user_id:uid, type, payload }) } catch {}
}

// ── FILM DATA ──────────────────────────────────────────────────────────────────
const FILMS_DEFAULT = [
  {id:'f001',title:'We Bury the Dead',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,phase:1,week:1,basePrice:8,estM:14,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f002',title:'Greenland 2: Migration',dist:'Lionsgate',genre:'Action',franchise:'Greenland',starActor:'Gerard Butler',phase:1,week:1,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f003',title:'Primate',dist:'Universal',genre:'Thriller',franchise:null,starActor:null,phase:1,week:1,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f004',title:'28 Years Later: The Bone Temple',dist:'Sony',genre:'Horror',franchise:'28 Days Later',starActor:"Jack O'Connell",phase:1,week:2,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f005',title:"Dead Man's Wire",dist:'WB',genre:'Thriller',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f006',title:'Killer Whale',dist:'Paramount',genre:'Thriller',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f007',title:'Night Patrol',dist:'Sony',genre:'Action',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f008',title:'Return to Silent Hill',dist:'Sony',genre:'Horror',franchise:'Silent Hill',starActor:null,phase:1,week:3,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f009',title:'Mercy',dist:'Netflix',genre:'Thriller',franchise:null,starActor:null,phase:1,week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f010',title:'Send Help',dist:'Universal',genre:'Horror',franchise:null,starActor:'Rachel McAdams',phase:1,week:3,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f011',title:'Iron Lung',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:1,week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f012',title:'The Strangers: Chapter 3',dist:'Lionsgate',genre:'Horror',franchise:'The Strangers',starActor:null,phase:1,week:5,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f013',title:'Dracula: A Love Tale',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,week:5,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f014',title:'Whistle',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:1,week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f015',title:'Good Luck Have Fun',dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:null,phase:1,week:5,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f016',title:'Cold Storage',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:1,week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f017',title:'GOAT',dist:'Sony Animation',genre:'Animation',franchise:null,starActor:null,phase:1,week:5,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f018',title:'Wuthering Heights',dist:'WB',genre:'Drama',franchise:null,starActor:'Margot Robbie',phase:1,week:6,basePrice:32,estM:58,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f019',title:'Crime 101',dist:'A24',genre:'Thriller',franchise:null,starActor:'Glen Powell',phase:1,week:6,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f020',title:'Psycho Killer',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,week:7,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f021',title:'I Can Only Imagine 2',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:7,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f022',title:'Dreams',dist:'Universal',genre:'Drama',franchise:null,starActor:'Glen Powell',phase:1,week:7,basePrice:18,estM:34,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f023',title:'Scream 7',dist:'Paramount',genre:'Horror',franchise:'Scream',starActor:'Neve Campbell',phase:1,week:8,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f024',title:'The Cat in the Hat',dist:'WB',genre:'Animation',franchise:null,starActor:'Bill Hader',phase:1,week:8,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f025',title:'Hoppers',dist:'Disney/Pixar',genre:'Animation',franchise:null,starActor:null,phase:1,week:9,basePrice:26,estM:50,rt:97,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f026',title:'The Bride',dist:'Universal',genre:'Horror',franchise:null,starActor:'Christian Bale',phase:1,week:9,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f027',title:'Peaky Blinders: The Immortal Man',dist:'Netflix',genre:'Drama',franchise:'Peaky Blinders',starActor:'Cillian Murphy',phase:1,week:9,basePrice:14,estM:26,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f028',title:'Reminders of Him',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:1,week:10,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f029',title:'Project Hail Mary',dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:'Ryan Gosling',phase:1,week:11,basePrice:55,estM:80,rt:95,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f030',title:'They Will Kill You',dist:'Amazon MGM',genre:'Horror',franchise:null,starActor:'Zazie Beetz',phase:1,week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f031',title:'Romeo and Juliet',dist:'Paramount',genre:'Drama',franchise:null,starActor:null,phase:1,week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f032',title:'The Magic Faraway Tree',dist:'StudioCanal',genre:'Family',franchise:null,starActor:null,phase:1,week:11,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f033',title:'Bluey At The Cinema',dist:'Lionsgate',genre:'Family',franchise:'Bluey',starActor:null,phase:1,week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f034',title:'Ready or Not 2',dist:'Searchlight',genre:'Horror',franchise:null,starActor:'Samara Weaving',phase:1,week:11,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:''},
  {id:'f035',title:'Super Mario Galaxy Movie',dist:'Universal/Illumination',genre:'Animation',franchise:'Mario',starActor:'Jack Black',phase:1,week:13,basePrice:52,estM:100,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f036',title:'Michael',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jaafar Jackson',phase:1,week:16,basePrice:26,estM:48,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f037',title:'The Devil Wears Prada 2',dist:'Disney/20th',genre:'Comedy',franchise:'The Devil Wears Prada',starActor:'Meryl Streep',phase:2,week:17,basePrice:50,estM:80,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f038',title:'Iron Maiden: Burning Ambition',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Iron Maiden',phase:2,week:17,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f039',title:'Mortal Kombat II',dist:'WB/New Line',genre:'Action',franchise:'Mortal Kombat',starActor:'Lewis Tan',phase:2,week:18,basePrice:28,estM:52,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f040',title:'Billie Eilish Tour Film',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Billie Eilish',phase:2,week:18,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f041',title:'The Mandalorian and Grogu',dist:'Disney/Lucasfilm',genre:'Action',franchise:'Star Wars',starActor:'Pedro Pascal',phase:2,week:20,basePrice:70,estM:135,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f042',title:'Tom and Jerry: Forbidden Compass',dist:'WB',genre:'Animation',franchise:'Tom & Jerry',starActor:null,phase:2,week:20,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f043',title:'Masters of the Universe',dist:'Amazon MGM',genre:'Action',franchise:'Masters of the Universe',starActor:'Nicholas Galitzine',phase:2,week:22,basePrice:35,estM:65,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f044',title:'Scary Movie 6',dist:'Paramount',genre:'Comedy',franchise:'Scary Movie',starActor:null,phase:2,week:22,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f045',title:'Toy Story 5',dist:'Disney/Pixar',genre:'Animation',franchise:'Toy Story',starActor:'Tom Hanks',phase:2,week:24,basePrice:75,estM:145,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f046',title:'Supergirl: Woman of Tomorrow',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Milly Alcock',phase:2,week:25,basePrice:52,estM:98,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f047',title:'Jackass Forever 2',dist:'Paramount',genre:'Comedy',franchise:'Jackass',starActor:null,phase:2,week:25,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f048',title:'Minions and Monsters',dist:'Universal/Illumination',genre:'Animation',franchise:'Despicable Me',starActor:'Steve Carell',phase:2,week:26,basePrice:58,estM:110,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f049',title:'Moana',dist:'Disney',genre:'Family',franchise:'Moana',starActor:'Dwayne Johnson',phase:2,week:27,basePrice:62,estM:118,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f050',title:'The Odyssey',dist:'Universal',genre:'Drama',franchise:null,starActor:'Matt Damon',phase:2,week:27,basePrice:60,estM:115,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f051',title:'Spider-Man: Brand New Day',dist:'Sony/Marvel',genre:'Action',franchise:'Spider-Man',starActor:'Tom Holland',phase:2,week:27,basePrice:85,estM:165,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f052',title:'Evil Dead Burn',dist:'Sony',genre:'Horror',franchise:'Evil Dead',starActor:null,phase:2,week:27,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f053',title:'Insidious: The Bleeding World',dist:'Sony/Blumhouse',genre:'Horror',franchise:'Insidious',starActor:'Lin Shaye',phase:2,week:33,basePrice:14,estM:28,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f054',title:'Paw Patrol: The Dino Movie',dist:'Paramount',genre:'Family',franchise:'Paw Patrol',starActor:null,phase:2,week:32,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f055',title:'Practical Magic 2',dist:'WB',genre:'Horror',franchise:'Practical Magic',starActor:'Sandra Bullock',phase:3,week:36,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f056',title:'Clayface',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Tom Rhys Harries',phase:3,week:36,basePrice:30,estM:55,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f057',title:'Resident Evil',dist:'Sony',genre:'Horror',franchise:'Resident Evil',starActor:null,phase:3,week:37,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f058',title:'Verity',dist:'Amazon MGM',genre:'Thriller',franchise:null,starActor:'Blake Lively',phase:3,week:39,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f059',title:'The Social Reckoning',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jeremy Strong',phase:3,week:40,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f060',title:'The Legend of Aang',dist:'Paramount',genre:'Animation',franchise:'Avatar: The Last Airbender',starActor:null,phase:3,week:40,basePrice:35,estM:65,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f061',title:'Street Fighter',dist:'Paramount',genre:'Action',franchise:'Street Fighter',starActor:'Andrew Koji',phase:3,week:41,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f062',title:'Terrifier 4',dist:'Cineverse',genre:'Horror',franchise:'Terrifier',starActor:null,phase:3,week:42,basePrice:10,estM:20,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f063',title:'The Hunger Games: Sunrise on the Reaping',dist:'Lionsgate',genre:'Action',franchise:'The Hunger Games',starActor:'Joseph Zada',phase:4,week:46,basePrice:58,estM:110,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f064',title:'Focker In-Law',dist:'Paramount',genre:'Comedy',franchise:'Meet the Fockers',starActor:'Ben Stiller',phase:4,week:46,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f065',title:'Narnia: The Magician\'s Nephew',dist:'Netflix/Sony',genre:'Adventure',franchise:'The Chronicles of Narnia',starActor:'Daniel Craig',phase:4,week:47,basePrice:50,estM:95,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f066',title:'Violent Night 2',dist:'Universal',genre:'Action',franchise:'Violent Night',starActor:'David Harbour',phase:4,week:48,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f067',title:'Jumanji 3',dist:'Sony',genre:'Action',franchise:'Jumanji',starActor:'Dwayne Johnson',phase:4,week:49,basePrice:44,estM:82,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f068',title:'Dune: Part Three',dist:'WB',genre:'Sci-Fi',franchise:'Dune',starActor:'Timothée Chalamet',phase:4,week:49,basePrice:80,estM:155,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f069',title:'Avengers: Doomsday',dist:'Marvel/Disney',genre:'Action',franchise:'MCU',starActor:'Robert Downey Jr',phase:4,week:50,basePrice:98,estM:210,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f070',title:'The Thomas Crown Affair',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:5,week:57,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f071',title:'Ice Age: Boiling Point',dist:'Disney/20th',genre:'Animation',franchise:'Ice Age',starActor:null,phase:5,week:58,basePrice:30,estM:58,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f072',title:'Sonic the Hedgehog 4',dist:'Paramount',genre:'Family',franchise:'Sonic the Hedgehog',starActor:'Jim Carrey',phase:5,week:60,basePrice:34,estM:65,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
  {id:'f073',title:'Avengers: Secret Wars',dist:'Marvel/Disney',genre:'Action',franchise:'MCU',starActor:null,phase:5,week:62,basePrice:98,estM:200,rt:null,sleeper:false,trailer:'',affiliateUrl:''},
]

// ── SCORE BREAKDOWN MODAL ──────────────────────────────────────────────────────
function ScoreBreakdownModal({ film, holding, results, weeklyGrosses, allChips, auteurDeclarations, weekendWinners, isEarlyBird, onClose }) {
  const actual = results[film.id]
  const weeks  = weeklyGrosses[film.id] || {}
  const pid    = holding.player_id
  const chip   = allChips.find(c => c.player_id === pid)
  const analystWin  = chip?.analyst_film_id === film.id && chip?.analyst_result === 'win'
  const shortResult = chip?.short_film_id   === film.id ? chip?.short_result : null
  const eb     = isEarlyBird(holding)
  const auteur = auteurDeclarations.find(a => a.player_id===pid)?.film_ids?.includes(film.id)
  const isWW   = Object.values(weekendWinners).includes(film.id)
  const gc     = GENRE_COL[film.genre] || T.textSub

  const baseOpen   = actual != null ? calcOpeningPts(film, actual, false, false) : 0
  const ebBonus    = (eb && actual != null && actual/film.estM >= 1.1) ? Math.round(baseOpen * 0.1) : 0
  const analystBon = analystWin ? 60 : 0
  const auteurBon  = auteur ? Math.round((baseOpen + ebBonus) * 0.1) : 0
  const openPts    = baseOpen + ebBonus + analystBon + auteurBon
  const wkPts      = Math.round(calcWeeklyPts(weeks))
  const lb         = calcLegsBonus(actual, weeks[2])
  const ww         = isWW ? 15 : 0
  const sb         = shortResult==='win' ? 100 : shortResult==='lose' ? -30 : 0
  const total      = openPts + wkPts + lb + ww + sb

  const Row = ({ label, value, color, sub }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'12px 0', borderBottom:`1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize:'13px', color:T.text, lineHeight:1.4 }}>{label}</div>
        {sub && <div style={{ fontSize:'11px', color:T.textSub, marginTop:'3px' }}>{sub}</div>}
      </div>
      <div style={{ fontSize:'16px', fontWeight:700, color: color || T.text, flexShrink:0, marginLeft:'16px' }}>{value}</div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:800 }} onClick={onClose}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', animation:'slideUp .25s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 20px 0' }}>
          <div style={{ width:'36px', height:'4px', background:T.border, borderRadius:'2px', margin:'0 auto 20px' }}/>
          <div style={{ height:'3px', background:gc, borderRadius:'2px', marginBottom:'16px' }}/>
          <div style={{ display:'flex', gap:'16px', marginBottom:'20px', alignItems:'flex-start' }}>
            <FilmPoster film={film} width={72} height={108} radius={10} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'18px', fontWeight:700, lineHeight:1.3, color:T.text }}>{film.title}</div>
              <div style={{ fontSize:'12px', color:T.textSub, marginTop:'4px' }}>{film.dist} · Week {film.week} · Phase {film.phase}</div>
              {actual != null && (
                <div style={{ display:'flex', gap:'14px', marginTop:'12px', flexWrap:'wrap' }}>
                  {[['ACTUAL',`$${actual}M`,T.green],['EST',`$${film.estM}M`,T.text],['RATIO',`${(actual/film.estM).toFixed(2)}×`,actual/film.estM>=1?T.green:T.red],...(film.rt!=null?[['RT',`${film.rt}%`,film.rt>=90?T.green:film.rt>=75?T.gold:T.red]]:[])].map(([l,v,c])=>(
                    <div key={l}><div style={S.label}>{l}</div><div style={{ fontSize:'15px', fontWeight:700, color:c, marginTop:'3px' }}>{v}</div></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding:'0 20px 20px' }}>
          {actual == null
            ? <div style={{ textAlign:'center', color:T.textSub, padding:'32px', fontSize:'13px' }}>No results yet — check back after opening weekend.</div>
            : <>
                <div style={S.label}>Points Breakdown</div>
                <div style={{ marginTop:'8px' }}>
                  <Row label="Base opening pts" value={`+${baseOpen}`} sub={`$${actual}M actual · ${(actual/film.estM).toFixed(2)}× performance`} />
                  {eb && ebBonus > 0 && <Row label="🐦 Early Bird +10%" value={`+${ebBonus}`} color={T.green} />}
                  {analystWin     && <Row label="🎯 Analyst bonus" value="+60" color={T.blue} />}
                  {auteur && auteurBon > 0 && <Row label="🎭 Auteur +10%" value={`+${auteurBon}`} color={T.orange} />}
                  {wkPts > 0      && <Row label="📅 Weekly grosses" value={`+${wkPts}`} color={T.blue} sub="W1–3: 1pt/$1M · W4+: 1.1pts/$1M" />}
                  {lb > 0         && <Row label="🦵 Legs (W2 drop <30%)" value="+25" color={T.green} />}
                  {isWW           && <Row label="🥇 Weekend #1" value="+15" color={T.gold} />}
                  {sb !== 0       && <Row label={sb>0 ? '📉 Short WIN' : '📉 Short LOSE'} value={sb>0?'+100':'-30'} color={sb>0?T.green:T.red} />}
                </div>
                <div style={{ marginTop:'20px', background:T.surfaceUp, borderRadius:'14px', padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ ...S.label }}>Total Points</div>
                  <div style={{ fontSize:'44px', fontWeight:900, color:T.gold, letterSpacing:'-2px', fontFamily:T.mono }}>{total}</div>
                </div>
              </>
          }
          <Btn onClick={onClose} variant="outline" color={T.textSub} full sx={{ marginTop:'16px' }} size="lg">Close</Btn>
        </div>
      </div>
    </div>
  )
}

// ── FILM DETAIL MODAL ──────────────────────────────────────────────────────────
function FilmDetailModal({ film, profile, players, results, onClose }) {
  const [comments, setComments] = useState([])
  const [reactions, setReactions] = useState([])
  const [text, setText] = useState('')
  const actual = results[film.id]
  const gc = GENRE_COL[film.genre] || T.textSub

  useEffect(() => {
    loadComments(); loadReactions()
    const ch = supabase.channel(`film-detail-${film.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'film_comments',filter:`film_id=eq.${film.id}`}, loadComments)
      .on('postgres_changes',{event:'*',schema:'public',table:'reactions',filter:`target_id=eq.${film.id}`}, loadReactions)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const loadComments  = async () => { const {data} = await supabase.from('film_comments').select('*').eq('film_id',film.id).order('created_at',{ascending:true}); if(data) setComments(data) }
  const loadReactions = async () => { const {data} = await supabase.from('reactions').select('*').eq('target_type','film').eq('target_id',film.id); if(data) setReactions(data) }

  const post = async () => {
    if (!text.trim()) return
    await supabase.from('film_comments').insert({ user_id:profile.id, film_id:film.id, comment:text.trim() })
    setText('')
  }

  const toggleReaction = async (emoji) => {
    const mine = reactions.find(r => r.user_id===profile.id && r.emoji===emoji)
    if (mine) await supabase.from('reactions').delete().eq('id', mine.id)
    else       await supabase.from('reactions').insert({ user_id:profile.id, target_type:'film', target_id:film.id, emoji })
    loadReactions()
  }

  const counts = EMOJI_OPTIONS.reduce((a,e) => ({...a,[e]:reactions.filter(r=>r.emoji===e).length}), {})
  const myEmojis = reactions.filter(r => r.user_id===profile.id).map(r => r.emoji)

  return (
    <div style={{ position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'center', justifyContent:'center', zIndex:800, padding:'12px' }} onClick={onClose}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:'20px', width:'100%', maxWidth:'700px', height:'min(92vh, 840px)', display:'flex', flexDirection:'column', animation:'fadeUp .2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'28px 28px 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
            <div style={{ fontSize:'20px', fontWeight:800, color:T.text }}>Film Details</div>
            <button onClick={onClose} style={{ background:'none', border:`1px solid ${T.border}`, color:T.textSub, borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontFamily:T.mono, fontSize:'12px' }}>✕ Close</button>
          </div>
          <div style={{ height:'3px', background:gc, borderRadius:'2px', marginBottom:'20px' }}/>
          <div style={{ display:'flex', gap:'20px', alignItems:'flex-start', marginBottom:'24px' }}>
            <FilmPoster film={film} width={100} height={150} radius={10} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'22px', fontWeight:800, lineHeight:1.25, letterSpacing:'-0.5px' }}>{film.title}</div>
              <div style={{ fontSize:'14px', color:T.textSub, marginTop:'6px' }}>{film.dist} · {film.genre} · Week {film.week} · Phase {film.phase}</div>
              {film.starActor && <div style={{ fontSize:'14px', color:T.textSub, marginTop:'4px' }}>⭐ {film.starActor}</div>}
              {film.franchise && <div style={{ fontSize:'13px', color:T.textDim, marginTop:'4px' }}>📽 {film.franchise}</div>}
              <div style={{ display:'flex', gap:'14px', marginTop:'14px', flexWrap:'wrap' }}>
                <div><div style={{ ...S.label, marginBottom:'4px' }}>Est</div><div style={{ fontSize:'17px', fontWeight:700 }}>${film.estM}M</div></div>
                <div><div style={{ ...S.label, marginBottom:'4px' }}>IPO</div><div style={{ fontSize:'17px', fontWeight:700 }}>${film.basePrice}M</div></div>
                {actual != null && <div><div style={{ ...S.label, marginBottom:'4px' }}>Actual</div><div style={{ fontSize:'17px', fontWeight:700, color:T.green }}>${actual}M</div></div>}
                {film.rt != null && <div><div style={{ ...S.label, marginBottom:'4px' }}>RT</div><div style={{ fontSize:'17px', fontWeight:700, color:film.rt>=75?T.green:T.red }}>{film.rt}%</div></div>}
              </div>
            </div>
          </div>
          <div style={{ ...S.label, marginBottom:'12px' }}>Reactions</div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px' }}>
            {EMOJI_OPTIONS.map(emoji => {
              const count = counts[emoji], ismine = myEmojis.includes(emoji)
              return (
                <button key={emoji} onClick={() => toggleReaction(emoji)} style={{
                  background: ismine ? `${T.gold}22` : T.surfaceUp,
                  border:`1px solid ${ismine ? T.gold+'66' : T.border}`,
                  borderRadius:'20px', padding:'6px 12px', cursor:'pointer',
                  fontSize:'14px', display:'flex', alignItems:'center', gap:'5px',
                  fontFamily:T.mono, color: count>0 ? (ismine?T.gold:T.text) : T.textSub,
                  transition:'all .15s',
                }}>
                  {emoji}{count>0 && <span style={{ fontSize:'11px' }}>{count}</span>}
                </button>
              )
            })}
          </div>
          <Divider my={0} />
          <div style={{ ...S.label, margin:'14px 0 4px' }}>Comments ({comments.length})</div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'12px 28px' }}>
          {comments.length === 0 && <div style={{ fontSize:'14px', color:T.textSub, padding:'20px 0' }}>No comments yet — be first!</div>}
          {comments.map(c => {
            const p = players.find(pl => pl.id===c.user_id)
            return (
              <div key={c.id} style={{ display:'flex', gap:'12px', marginBottom:'18px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:p?.color||T.gold, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#0D0A08' }}>{p?.name?.[0]||'?'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:'8px', alignItems:'baseline', marginBottom:'4px' }}>
                    <span style={{ fontSize:'13px', fontWeight:600, color:p?.color||T.gold }}>{p?.name}</span>
                    <span style={{ fontSize:'11px', color:T.textDim }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize:'14px', color:T.text, lineHeight:1.55 }}>{c.comment}</div>
                </div>
                {c.user_id === profile.id && (
                  <button onClick={() => supabase.from('film_comments').delete().eq('id',c.id).then(loadComments)} style={{ background:'none', border:'none', color:T.textDim, cursor:'pointer', fontSize:'13px', padding:'2px 8px' }}>✕</button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ padding:'18px 28px 28px', borderTop:`1px solid ${T.border}`, flexShrink:0, display:'flex', gap:'12px' }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key==='Enter' && post()} placeholder="Add a comment…" style={{ ...S.inp, flex:1, fontSize:'15px', padding:'13px 16px' }}/>
          <Btn onClick={post} color={T.blue} textColor="#fff" size="lg">Post</Btn>
        </div>
      </div>
    </div>
  )
}

// ── PLAYER PROFILE PAGE ────────────────────────────────────────────────────────
function PlayerProfilePage({ player, films, rosters, results, weeklyG, allChips, auteurDecl, wwWinners,
  oscarPreds, calcPoints, calcPhasePoints, budgetLeft, cur,
  isEarlyBird, analystActive, auteurBonus, shortBonus, wwBonus,
  curPhase_ref, onBack }) {

  const [activePhase, setActivePhase] = useState(null)

  const totalPts    = calcPoints(player.id)
  const chip        = allChips.find(c => c.player_id===player.id)
  const auteur      = auteurDecl.find(a => a.player_id===player.id)
  const oscar       = oscarPreds.find(o => o.player_id===player.id)
  const pc          = player.color || T.gold
  const allHoldings = rosters.filter(r => r.player_id===player.id && films.find(f=>f.id===r.film_id))
  const activeNow   = allHoldings.filter(r => r.active)
  const totalSpend  = allHoldings.reduce((s,h) => s+(h.bought_price||0), 0)

  const scoredHoldings = allHoldings.map(h => {
    const film = films.find(f=>f.id===h.film_id)
    if (!film || results[film.id]==null) return null
    const pts = calcOpeningPts(film, results[film.id], isEarlyBird(h), analystActive(player.id, film.id))
    return { h, film, pts }
  }).filter(Boolean)
  const bestPick  = scoredHoldings.length ? scoredHoldings.reduce((b,x) => x.pts>b.pts?x:b) : null
  const worstPick = scoredHoldings.length > 1 ? scoredHoldings.reduce((b,x) => x.pts<b.pts?x:b) : null

  // ── Phase drill-down ──────────────────────────────────────────────────────────
  const PhaseView = ({ ph }) => {
    const phHoldings = allHoldings.filter(r => r.phase===ph)
    const phPts = calcPhasePoints(player.id, ph)
    return (
      <div style={{ animation:'fadeUp .2s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'20px', fontWeight:800, color:pc, lineHeight:1 }}>Phase {ph}</div>
            <div style={{ fontSize:'12px', color:T.textSub, marginTop:3 }}>{PHASE_NAMES[ph]}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'40px', fontWeight:900, color:T.gold, lineHeight:1, letterSpacing:'-1px' }}>{phPts}</div>
            <div style={S.label}>phase pts</div>
          </div>
        </div>
        {phHoldings.length === 0
          ? <div style={{ ...S.card, textAlign:'center', padding:'40px', color:T.textSub }}>No films this phase</div>
          : phHoldings.map(h => {
              const film = films.find(f=>f.id===h.film_id); if(!film) return null
              const actual = results[film.id]
              const gc  = GENRE_COL[film.genre] || T.textDim
              const eb  = isEarlyBird(h)
              const aa  = analystActive(player.id, film.id)
              const au  = auteurBonus(player.id, film.id)
              const sb  = shortBonus(player.id, film.id)
              const wb  = wwBonus(film.id)
              let op    = calcOpeningPts(film, actual, eb, aa)
              if (au) op = Math.round(op * 1.1)
              const wp  = Math.round(calcWeeklyPts(weeklyG[film.id]||{}))
              const lb  = calcLegsBonus(actual, weeklyG[film.id]?.[2])
              const filmTotal = op + wp + lb + wb + sb
              const pnl_ = h.active
                ? (actual!=null ? actual - h.bought_price : 0)
                : (h.sold_price||0) - h.bought_price
              return (
                <div key={h.id} style={{ ...S.card, marginBottom:'10px' }}>
                  <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <FilmPoster film={film} width={52} height={78} radius={8} />
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:gc, borderRadius:'8px 8px 0 0' }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'4px' }}>
                        <div style={{ fontSize:'14px', fontWeight:700, lineHeight:1.3 }}>{film.title}</div>
                        {!h.active && <Pill color={T.textDim}>sold</Pill>}
                        {h.active && actual==null && <Pill color={T.blue}>held</Pill>}
                      </div>
                      <div style={{ fontSize:'11px', color:T.textSub }}>{film.dist} · W{film.week}</div>
                      <div style={{ display:'flex', gap:'14px', marginTop:'10px', flexWrap:'wrap' }}>
                        <div><div style={S.label}>Paid</div><div style={{ fontSize:'14px', fontWeight:600, marginTop:'2px' }}>${h.bought_price}M</div></div>
                        {!h.active && <div><div style={S.label}>Sold</div><div style={{ fontSize:'14px', fontWeight:600, color:pnl_>=0?T.green:T.red, marginTop:'2px' }}>${h.sold_price||0}M</div></div>}
                        {actual!=null && <div><div style={S.label}>Actual</div><div style={{ fontSize:'14px', fontWeight:600, color:T.green, marginTop:'2px' }}>${actual}M</div></div>}
                        <div><div style={S.label}>P&amp;L</div><div style={{ fontSize:'14px', fontWeight:700, color:pnl_>=0?T.green:T.red, marginTop:'2px' }}>{pnl_>=0?'+':''}{pnl_}M</div></div>
                      </div>
                      {actual != null && (
                        <div style={{ marginTop:'10px', background:T.surfaceUp, borderRadius:'9px', padding:'10px 12px' }}>
                          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>
                            <div><div style={S.label}>Opening</div><div style={{ fontSize:'13px', fontWeight:600, color:T.gold, marginTop:'2px' }}>+{op}</div></div>
                            {wp>0 && <div><div style={S.label}>Weekly</div><div style={{ fontSize:'13px', fontWeight:600, color:T.blue, marginTop:'2px' }}>+{wp}</div></div>}
                            {lb>0 && <div><div style={S.label}>Legs 🦵</div><div style={{ fontSize:'13px', fontWeight:600, color:T.green, marginTop:'2px' }}>+25</div></div>}
                            {wb>0 && <div><div style={S.label}>W/E #1 🥇</div><div style={{ fontSize:'13px', fontWeight:600, color:T.gold, marginTop:'2px' }}>+15</div></div>}
                            {sb!==0 && <div><div style={S.label}>Short 📉</div><div style={{ fontSize:'13px', fontWeight:600, color:sb>0?T.green:T.red, marginTop:'2px' }}>{sb>0?'+':''}{sb}</div></div>}
                            <div style={{ marginLeft:'auto' }}><div style={S.label}>Total</div><div style={{ fontSize:'22px', fontWeight:900, color:T.gold, marginTop:'2px', letterSpacing:'-0.5px' }}>{filmTotal}pts</div></div>
                          </div>
                          {(eb||aa||au) && (
                            <div style={{ display:'flex', gap:'5px', marginTop:'8px', flexWrap:'wrap' }}>
                              {eb && <Badge color={T.green}>🐦 Early Bird +10%</Badge>}
                              {aa && <Badge color={T.blue}>🎯 Analyst +60</Badge>}
                              {au && <Badge color={T.orange}>🎭 Auteur +10%</Badge>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
        }
      </div>
    )
  }

  // ── Overview ──────────────────────────────────────────────────────────────────
  const Overview = () => (
    <div style={{ animation:'fadeUp .2s ease' }}>

      {/* Hero */}
      <div style={{ background:T.surfaceUp, borderRadius:'16px', padding:'24px', marginBottom:'16px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:pc }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
          <div style={{ width:'68px', height:'68px', borderRadius:'50%', background:pc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px', fontWeight:900, color:'#000', flexShrink:0 }}>{player.name?.[0]||'?'}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'26px', fontWeight:900, color:pc, letterSpacing:'-0.5px', lineHeight:1 }}>{player.name}</div>
            <div style={{ fontSize:'13px', color:T.textSub, marginTop:'6px' }}>{activeNow.length} films active · {budgetLeft(player.id)}M left</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'48px', fontWeight:900, color:T.gold, lineHeight:1, letterSpacing:'-2px' }}>{totalPts}</div>
            <div style={S.label}>grand pts</div>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
        <StatBox label="Films ever" value={allHoldings.length} />
        <StatBox label="Total spend" value={`${cur}${totalSpend}M`} color={T.textSub} />
        <StatBox label="Scored" value={scoredHoldings.length} />
      </div>
      {(bestPick || worstPick) && (
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
          {bestPick  && <StatBox label="🏆 Best"  value={`+${bestPick.pts}pts`}  color={T.gold} sub={bestPick.film.title.split(':')[0]} />}
          {worstPick && worstPick.film.id!==bestPick?.film.id && <StatBox label="💀 Worst" value={`${worstPick.pts}pts`} color={T.red} sub={worstPick.film.title.split(':')[0]} />}
          {scoredHoldings.length>0 && <StatBox label="Avg pts" value={Math.round(scoredHoldings.reduce((s,x)=>s+x.pts,0)/scoredHoldings.length)} />}
        </div>
      )}

      {/* Phase breakdown — tappable */}
      <div style={S.label}>Phase Breakdown — tap to drill in</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'8px', margin:'12px 0 20px' }}>
        {[1,2,3,4,5].map(ph => {
          const phPts = calcPhasePoints(player.id, ph)
          const phAll = allHoldings.filter(r=>r.phase===ph)
          const phSco = phAll.filter(r=>results[r.film_id]!=null)
          const isCur = ph === curPhase_ref
          return (
            <div key={ph} onClick={() => setActivePhase(ph)} style={{
              background: isCur ? `${pc}12` : T.surface,
              border: `1px solid ${isCur ? `${pc}55` : T.border}`,
              borderRadius:'12px', padding:'14px 16px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:'14px', transition:'border-color .15s',
            }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:isCur?`${pc}22`:T.surfaceUp, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:isCur?pc:T.textSub, flexShrink:0 }}>P{ph}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'14px', fontWeight:600, color:isCur?pc:T.text }}>{PHASE_NAMES[ph]}</div>
                <div style={{ fontSize:'11px', color:T.textSub, marginTop:'2px' }}>{phAll.length} films · {phSco.length} scored{isCur?' · current':''}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'26px', fontWeight:900, color:phPts>0?T.gold:T.textDim, letterSpacing:'-0.5px', lineHeight:1 }}>{phPts}</div>
                <div style={S.label}>pts</div>
              </div>
              <div style={{ color:T.textDim, fontSize:'18px' }}>›</div>
            </div>
          )
        })}
      </div>

      {/* Chips */}
      <div style={S.label}>Chips &amp; Specials</div>
      <div style={{ ...S.card, margin:'12px 0 20px' }}>
        {!chip && !auteur && !oscar
          ? <div style={{ fontSize:'13px', color:T.textSub }}>No chips used yet</div>
          : <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {chip?.recut_used && (
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ fontSize:'24px' }}>🎬</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:600, color:T.purple }}>The Recut</div><div style={{ fontSize:'11px', color:T.textSub }}>Full free rebuild</div></div>
                  <Pill color={T.purple}>Used</Pill>
                </div>
              )}
              {chip?.short_film_id && (()=>{
                const f=films.find(fl=>fl.id===chip.short_film_id), r_=chip.short_result
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'24px' }}>📉</span>
                    <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:600, color:T.red }}>The Short</div><div style={{ fontSize:'11px', color:T.textSub }}>{f?.title} · pred ${chip.short_prediction}M</div></div>
                    {r_==='win'?<Badge color={T.green}>✅ +100pts</Badge>:r_==='lose'?<Badge color={T.red}>❌ −30pts</Badge>:<Badge color={T.textSub}>Pending</Badge>}
                  </div>
                )
              })()}
              {chip?.analyst_film_id && (()=>{
                const f=films.find(fl=>fl.id===chip.analyst_film_id), r_=chip.analyst_result
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'24px' }}>🎯</span>
                    <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:600, color:T.blue }}>The Analyst</div><div style={{ fontSize:'11px', color:T.textSub }}>{f?.title} · pred ${chip.analyst_prediction}M</div></div>
                    {r_==='win'?<Badge color={T.green}>✅ +60pts</Badge>:r_==='lose'?<Badge color={T.red}>❌ Missed</Badge>:<Badge color={T.textSub}>Pending</Badge>}
                  </div>
                )
              })()}
              {auteur && (
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ fontSize:'24px' }}>🎭</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:600, color:T.orange }}>The Auteur</div><div style={{ fontSize:'11px', color:T.textSub }}>⭐ {auteur.star_actor} · {auteur.film_ids?.length} films · Phase {auteur.phase}</div></div>
                  <Badge color={T.orange}>+10% each</Badge>
                </div>
              )}
              {oscar && (()=>{
                const f=films.find(fl=>fl.id===oscar.best_picture_film_id)
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'24px' }}>🏆</span>
                    <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:600, color:T.gold }}>Best Picture Pick</div><div style={{ fontSize:'11px', color:T.textSub }}>{f?.title}</div></div>
                    {oscar.correct===true?<Badge color={T.green}>✅ +75pts</Badge>:oscar.correct===false?<Badge color={T.red}>❌ Wrong</Badge>:<Badge color={T.textSub}>Pending</Badge>}
                  </div>
                )
              })()}
            </div>
        }
      </div>

      {/* Current holdings */}
      {activeNow.length > 0 && <>
        <div style={S.label}>Currently Held</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'12px' }}>
          {activeNow.map(h => {
            const film=films.find(f=>f.id===h.film_id); if(!film) return null
            const actual=results[film.id]
            const gc=GENRE_COL[film.genre]||T.textDim
            const pts=actual!=null?calcOpeningPts(film,actual,isEarlyBird(h),analystActive(player.id,film.id)):null
            return (
              <div key={h.id} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'12px 14px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:'12px' }}>
                <FilmPoster film={film} width={36} height={54} radius={6} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'13px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{film.title}</div>
                  <div style={{ fontSize:'11px', color:T.textSub, marginTop:'2px' }}>W{film.week} · ${h.bought_price}M paid</div>
                </div>
                {pts!=null?<div style={{ fontSize:'15px', fontWeight:700, color:T.gold, flexShrink:0 }}>{pts}pts</div>:<Pill color={gc}>{film.genre}</Pill>}
              </div>
            )
          })}
        </div>
      </>}
    </div>
  )

  return (
    <div style={{ animation:'fadeUp .2s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
        <button onClick={activePhase!==null?()=>setActivePhase(null):onBack} style={{ background:T.surfaceUp, border:`1px solid ${T.border}`, color:T.textSub, borderRadius:'8px', padding:'8px 16px', cursor:'pointer', fontFamily:T.mono, fontSize:'12px' }}>
          ← {activePhase!==null?'Overview':'Back'}
        </button>
        <div style={{ fontSize:'13px', color:T.textSub }}>
          {activePhase!==null?`Phase ${activePhase} · ${PHASE_NAMES[activePhase]}`:`Profile · ${player.name}`}
        </div>
      </div>
      {activePhase !== null ? <PhaseView ph={activePhase} /> : <Overview />}
    </div>
  )
}


// ── TRADE MODAL ────────────────────────────────────────────────────────────────
function TradeModal({ profile, players, rosters, films, filmVal, curPhase, onClose, notify, onDone }) {
  const [target,    setTarget]    = useState('')
  const [myFilm,    setMyFilm]    = useState('')
  const [theirFilm, setTheirFilm] = useState('')
  const ph = curPhase()
  const myR    = rosters.filter(r => r.player_id===profile.id && r.phase===ph && r.active && films.find(f=>f.id===r.film_id))
  const theirR = rosters.filter(r => r.player_id===target && r.phase===ph && r.active && films.find(f=>f.id===r.film_id))
  const mf = films.find(f => f.id===myFilm)
  const tf = films.find(f => f.id===theirFilm)

  const propose = async () => {
    if (!target||!myFilm||!theirFilm) return notify('Fill all fields', T.red)
    const { error } = await supabase.from('trades').insert({ proposer_id:profile.id, receiver_id:target, proposer_film_id:myFilm, receiver_film_id:theirFilm, status:'pending', phase:ph })
    if (error) return notify(error.message, T.red)
    await logActivity(profile.id,'trade_proposed',{ player_name:profile.name, my_film:mf?.title, their_film:tf?.title })
    notify('Trade proposal sent!', T.blue); onDone()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:700 }} onClick={onClose}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:'20px 20px 0 0', padding:'24px', width:'100%', maxWidth:'480px', maxHeight:'85vh', overflowY:'auto', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', animation:'slideUp .25s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ width:'36px', height:'4px', background:T.border, borderRadius:'2px', margin:'0 auto 20px' }}/>
        <div style={{ fontSize:'20px', fontWeight:700, color:T.blue, marginBottom:'6px' }}>🔄 Propose Trade</div>
        <div style={{ fontSize:'12px', color:T.textSub, marginBottom:'20px' }}>Phase {ph} films only · swaps are instant on acceptance</div>

        <div style={{ marginBottom:'14px' }}>
          <div style={{ ...S.label, marginBottom:'6px' }}>Trade with</div>
          <select value={target} onChange={e => { setTarget(e.target.value); setTheirFilm('') }} style={S.inp}>
            <option value="">Select player…</option>
            {players.filter(p => p.id!==profile.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          <div>
            <div style={{ ...S.label, marginBottom:'6px' }}>You give</div>
            <select value={myFilm} onChange={e => setMyFilm(e.target.value)} style={{ ...S.inp, fontSize:'12px' }}>
              <option value="">Your film…</option>
              {myR.map(r => { const f=films.find(fl=>fl.id===r.film_id); return f ? <option key={f.id} value={f.id}>{f.title}</option> : null })}
            </select>
          </div>
          <div>
            <div style={{ ...S.label, marginBottom:'6px' }}>You get</div>
            <select value={theirFilm} onChange={e => setTheirFilm(e.target.value)} disabled={!target} style={{ ...S.inp, fontSize:'12px', opacity:target?1:0.4 }}>
              <option value="">Their film…</option>
              {theirR.map(r => { const f=films.find(fl=>fl.id===r.film_id); return f ? <option key={f.id} value={f.id}>{f.title}</option> : null })}
            </select>
          </div>
        </div>

        {mf && tf && (
          <div style={{ background:T.surfaceUp, borderRadius:'12px', padding:'14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'16px' }}>
            <FilmPoster film={mf} width={44} height={66} radius={6} />
            <div style={{ flex:1, textAlign:'center', color:T.textSub, fontSize:'22px' }}>⇄</div>
            <FilmPoster film={tf} width={44} height={66} radius={6} />
          </div>
        )}

        <div style={{ display:'flex', gap:'10px' }}>
          <Btn onClick={onClose} variant="outline" color={T.textSub} sx={{ flex:1 }} size="lg">Cancel</Btn>
          <Btn onClick={propose} color={T.blue} textColor="#fff" sx={{ flex:2 }} size="lg">Send Proposal</Btn>
        </div>
      </div>
    </div>
  )
}

// ── APP ROOT ───────────────────────────────────────────────────────────────────
export default function App() {
  const [session,    setSession]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [profile,    setProfile]    = useState(null)
  const [page,       setPage]       = useState('market')
  const [players,    setPlayers]    = useState([])
  const [rosters,    setRosters]    = useState([])
  const [results,    setResults]    = useState({})
  const [filmValues, setFilmValues] = useState({})
  const [weeklyG,    setWeeklyG]    = useState({})
  const [chips,      setChips]      = useState(null)
  const [allChips,   setAllChips]   = useState([])
  const [films,      setFilms]      = useState(FILMS_DEFAULT)
  const [forecasts,  setForecasts]  = useState({})
  const [allForecasts, setAllForecasts] = useState([])
  const [oscarPreds, setOscarPreds] = useState([])
  const [myOscar,    setMyOscar]    = useState(null)
  const [auteurDecl, setAuteurDecl] = useState([])
  const [wwWinners,  setWwWinners]  = useState({})
  const [phaseBudgets, setPhaseBudgets] = useState([])
  const [trades,     setTrades]     = useState([])
  const [cfg,        setCfg]        = useState({ current_week:1, current_phase:1, currency:'$', tx_fee:5, phase_window_active:false, phase_window_opened_at:null })
  const [feedItems,  setFeedItems]  = useState([])
  const [notif,      setNotif]      = useState(null)
  const [trailerFilm,  setTrailerFilm]  = useState(null)
  const [chipModal,    setChipModal]    = useState(null)
  const [scoreModal,   setScoreModal]   = useState(null)
  const [filmDetail,   setFilmDetail]   = useState(null)
  const [profilePlayer, setProfilePlayer] = useState(null)  // player object when on profile page
  const [prevPage,      setPrevPage]      = useState('league')
  const [tradeModal,   setTradeModal]   = useState(false)
  const [addFilm,      setAddFilm]      = useState(false)
  const [newFilm,      setNewFilm]      = useState({ title:'', dist:'', genre:'Action', franchise:'', basePrice:20, estM:30, rt:'', week:1, phase:1, sleeper:false, starActor:'', trailer:'', affiliateUrl:'' })
  const [auteurActor,  setAuteurActor]  = useState('')
  const [auteurFilms,  setAuteurFilms]  = useState([])
  const [moreOpen,     setMoreOpen]     = useState(false)
  const [marketSearch, setMarketSearch] = useState('')
  const [marketGenre,  setMarketGenre]  = useState('All')
  const [now,          setNow]          = useState(Date.now())

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

  // Inject CSS
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = GLOBAL_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setSession(session); setLoading(false) })
    supabase.auth.onAuthStateChange((_,s) => setSession(s))
  }, [])

  useEffect(() => { if (session) { loadProfile(); loadData(); loadFeed() } }, [session])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!session) return
    const ch = supabase.channel('rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'activity_feed'}, () => loadFeed())
      .on('postgres_changes',{event:'*',schema:'public',table:'trades'}, () => loadTrades())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [session])

  const notify = (msg, color=T.gold) => {
    setNotif({ msg, color })
    setTimeout(() => setNotif(null), 3000)
  }

  const goToProfile = (player) => {
    setPrevPage(page)
    setProfilePlayer(player)
    setPage('profile')
  }

  const isCommissioner = session?.user?.email === COMMISSIONER_EMAIL

  const loadProfile = async () => {
    const {data} = await supabase.from('profiles').select('*').eq('id',session.user.id).single()
    if (data) setProfile(data)
  }
  const loadFeed = async () => {
    const {data} = await supabase.from('activity_feed').select('*').order('created_at',{ascending:false}).limit(80)
    if (data) setFeedItems(data)
  }
  const loadTrades = async () => {
    const {data} = await supabase.from('trades').select('*').order('created_at',{ascending:false})
    if (data) setTrades(data)
  }
  const loadData = async () => {
    const [
      {data:ps},{data:rs},{data:res},{data:fv},{data:cf},{data:wg},
      {data:ch},{data:fc},{data:op},{data:ad},{data:ww},{data:pb}
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('rosters').select('*'),
      supabase.from('results').select('*'),
      supabase.from('film_values').select('*'),
      supabase.from('league_config').select('*').eq('id',1).single(),
      supabase.from('weekly_grosses').select('*'),
      supabase.from('chips').select('*'),
      supabase.from('forecasts').select('*'),
      supabase.from('oscar_predictions').select('*'),
      supabase.from('auteur_declarations').select('*'),
      supabase.from('weekend_winners').select('*'),
      supabase.from('phase_budgets').select('*'),
    ])
    if (ps) setPlayers(ps)
    if (rs) setRosters(rs)
    if (res) { const m={}; res.forEach(r => m[r.film_id]=r.actual_m); setResults(m) }
    if (fv)  { const m={}; fv.forEach(v => m[v.film_id]=v.current_value); setFilmValues(m) }
    if (cf)  setCfg(cf)
    if (wg)  { const m={}; wg.forEach(w => { if(!m[w.film_id]) m[w.film_id]={}; m[w.film_id][w.week_num]=w.gross_m }); setWeeklyG(m) }
    if (ch)  { setAllChips(ch); setChips(ch.find(c=>c.player_id===session?.user?.id)||null) }
    if (fc)  { setAllForecasts(fc); const m={}; fc.filter(f=>f.player_id===session?.user?.id).forEach(f=>m[f.film_id]=f.predicted_m); setForecasts(m) }
    if (op)  { setOscarPreds(op); setMyOscar(op.find(o=>o.player_id===session?.user?.id)||null) }
    if (ad)  setAuteurDecl(ad)
    if (ww)  { const m={}; ww.forEach(w=>m[w.week]=w.film_id); setWwWinners(m) }
    if (pb)  setPhaseBudgets(pb)
    loadTrades()
  }

  // ── BUDGET HELPERS ──────────────────────────────────────────────────────────
  const curPhase     = () => cfg.current_phase || 1
  const isWindow     = () => cfg.phase_window_active || false
  const phaseBanked  = (pid, ph) => ph<=1 ? 0 : phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph-1)?.budget_banked || 0
  const phaseAlloc   = (pid, ph) => { const s=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph); return s ? s.budget_allocated : (PHASE_BUDGETS[ph]||100)+phaseBanked(pid,ph) }
  const phaseSpent   = (pid, ph) => rosters.filter(r=>r.player_id===pid&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).reduce((s,r)=>s+r.bought_price,0)
  const budgetLeft   = (pid)     => Math.max(0, phaseAlloc(pid,curPhase())-phaseSpent(pid,curPhase()))
  const bankBudget   = async (pid,ph) => {
    const alloc=phaseAlloc(pid,ph), spent=phaseSpent(pid,ph), banked=Math.max(0,alloc-spent)
    const ex=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph)
    if (ex) await supabase.from('phase_budgets').update({budget_allocated:alloc,budget_spent:spent,budget_banked:banked}).eq('id',ex.id)
    else    await supabase.from('phase_budgets').insert({player_id:pid,phase:ph,budget_allocated:alloc,budget_spent:spent,budget_banked:banked})
  }

  // ── SCORING HELPERS ─────────────────────────────────────────────────────────
  const filmVal    = (film) => Math.round((filmValues[film.id]??film.basePrice)*calcDemandMult(film,rosters,curPhase(),players.length))
  const isEarlyBird = (h)  => { const f=films.find(fl=>fl.id===h.film_id); return f ? f.week-(h.acquired_week||h.bought_week||0)>=EARLY_BIRD_WEEKS : false }
  const auteurOn   = (pid,fid) => auteurDecl.find(a=>a.player_id===pid&&a.phase===curPhase())?.film_ids?.includes(fid)||false
  const shortBonus = (pid,fid) => { const c=allChips.find(c=>c.player_id===pid); if(!c?.short_film_id||c.short_film_id!==fid) return 0; return c.short_result==='win'?100:c.short_result==='lose'?-30:0 }
  const analystOn  = (pid,fid) => { const c=allChips.find(c=>c.player_id===pid); return c?.analyst_film_id===fid&&c?.analyst_result==='win' }
  const wwBonus    = (fid)     => Object.values(wwWinners).includes(fid) ? 15 : 0

  const forecasterPhaseScore = (pid,ph) => {
    const phFilms = films.filter(f=>f.phase===ph&&results[f.id]!=null); if(!phFilms.length) return null
    const pfc = allForecasts.filter(f=>f.player_id===pid&&phFilms.find(pf=>pf.id===f.film_id)); if(!pfc.length) return null
    return pfc.reduce((s,fc)=>s+Math.abs(fc.predicted_m-results[fc.film_id])/results[fc.film_id],0)/pfc.length
  }
  const forecasterBonus = (pid,ph) => {
    const sc=players.map(p=>({id:p.id,s:forecasterPhaseScore(p.id,ph)})).filter(x=>x.s!=null)
    if(!sc.length) return 0
    return sc.reduce((a,b)=>a.s<b.s?a:b).id===pid ? 15 : 0
  }
  const seasonForecasterBonus = (pid) => {
    const ss=players.map(p=>{const sc=[1,2,3,4,5].map(ph=>forecasterPhaseScore(p.id,ph)).filter(s=>s!=null);return{id:p.id,s:sc.length?sc.reduce((a,b)=>a+b,0)/sc.length:null}}).filter(x=>x.s!=null)
    if(!ss.length) return 0
    return ss.reduce((a,b)=>a.s<b.s?a:b).id===pid ? 50 : 0
  }

  const calcPhasePoints = (pid,ph) => {
    let t=0
    rosters.filter(r=>r.player_id===pid&&r.phase===ph&&films.find(f=>f.id===r.film_id)).forEach(h=>{
      const film=films.find(f=>f.id===h.film_id); if(!film) return
      const actual=results[film.id]; if(actual==null) return
      let op=calcOpeningPts(film,actual,isEarlyBird(h),analystOn(pid,film.id))
      if(auteurOn(pid,film.id)) op=Math.round(op*1.1)
      t+=op+Math.round(calcWeeklyPts(weeklyG[film.id]||{}))+calcLegsBonus(actual,weeklyG[film.id]?.[2])+wwBonus(film.id)+shortBonus(pid,film.id)
    })
    return t+forecasterBonus(pid,ph)
  }
  const calcPoints = (pid) => {
    let t=[1,2,3,4,5].reduce((s,ph)=>s+calcPhasePoints(pid,ph),0)
    if(oscarPreds.find(o=>o.player_id===pid)?.correct) t+=75
    return t+seasonForecasterBonus(pid)
  }

  // ── BUY / SELL ──────────────────────────────────────────────────────────────
  const buyFilm = async (film) => {
    if (!profile) return notify('Create a profile first', T.red)
    const ph=curPhase()
    if (film.phase!==ph) return notify(`Film is Phase ${film.phase} — you are in Phase ${ph}`, T.red)
    if (rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active)) return notify('Already in your roster', T.red)
    if (rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length>=MAX_ROSTER) return notify(`Phase roster full (${MAX_ROSTER} max)`, T.red)
    const price=filmVal(film), left=budgetLeft(profile.id)
    if (price>left) return notify(`Not enough budget — need $${price}M, have $${left}M`, T.red)
    const {error}=await supabase.from('rosters').insert({ player_id:profile.id, film_id:film.id, bought_price:price, bought_week:cfg.current_week, acquired_week:cfg.current_week, phase:ph, active:true })
    if (error) return notify(error.message, T.red)
    await supabase.from('transactions').insert({ player_id:profile.id, film_id:film.id, type:'buy', price, week:cfg.current_week })
    await logActivity(profile.id,'buy',{film_id:film.id,film_title:film.title,price,player_name:profile.name})
    notify(`Acquired ${film.title} · $${price}M`, T.green); loadData()
  }

  const sellFilm = async (film) => {
    const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active); if(!h) return
    const win=isWindow(), val=filmVal(film), fee=win?0:cfg.tx_fee, proceeds=Math.max(0,val-fee)
    await supabase.from('rosters').update({active:false,sold_price:proceeds,sold_week:cfg.current_week}).eq('id',h.id)
    await supabase.from('transactions').insert([{player_id:profile.id,film_id:film.id,type:'sell',price:proceeds,week:cfg.current_week},...(fee>0?[{player_id:profile.id,film_id:film.id,type:'fee',price:fee,week:cfg.current_week}]:[])])
    await logActivity(profile.id,'sell',{film_id:film.id,film_title:film.title,proceeds,player_name:profile.name})
    notify(`Dropped ${film.title} · $${proceeds}M${win?' (free)':''}`, T.gold); loadData()
  }

  // ── TRADES ──────────────────────────────────────────────────────────────────
  const acceptTrade = async (trade) => {
    const myH    = rosters.find(r=>r.player_id===trade.receiver_id&&r.film_id===trade.receiver_film_id&&r.active)
    const theirH = rosters.find(r=>r.player_id===trade.proposer_id&&r.film_id===trade.proposer_film_id&&r.active)
    if (!myH||!theirH) return notify('One of the films is no longer available', T.red)
    await supabase.from('rosters').update({active:false,sold_price:0,sold_week:cfg.current_week}).eq('id',myH.id)
    await supabase.from('rosters').update({active:false,sold_price:0,sold_week:cfg.current_week}).eq('id',theirH.id)
    await supabase.from('rosters').insert({player_id:trade.receiver_id,film_id:trade.proposer_film_id,bought_price:theirH.bought_price,bought_week:cfg.current_week,acquired_week:theirH.acquired_week,phase:trade.phase,active:true})
    await supabase.from('rosters').insert({player_id:trade.proposer_id,film_id:trade.receiver_film_id,bought_price:myH.bought_price,bought_week:cfg.current_week,acquired_week:myH.acquired_week,phase:trade.phase,active:true})
    await supabase.from('trades').update({status:'accepted',resolved_at:new Date().toISOString()}).eq('id',trade.id)
    await logActivity(profile.id,'trade_accepted',{film_given:films.find(f=>f.id===trade.receiver_film_id)?.title,film_received:films.find(f=>f.id===trade.proposer_film_id)?.title})
    notify('Trade complete — rosters swapped!', T.green); loadData()
  }
  const rejectTrade = async (trade) => { await supabase.from('trades').update({status:'rejected',resolved_at:new Date().toISOString()}).eq('id',trade.id); notify('Trade rejected',T.red); loadTrades() }
  const cancelTrade = async (trade) => { await supabase.from('trades').update({status:'cancelled',resolved_at:new Date().toISOString()}).eq('id',trade.id); notify('Trade cancelled',T.gold); loadTrades() }

  // ── CHIPS ───────────────────────────────────────────────────────────────────
  const activateRecut = async () => {
    if (chips?.recut_used) return notify('Recut already used', T.red)
    if (!confirm('Activate THE RECUT? Your roster clears — zero fees.')) return
    for (const h of rosters.filter(r=>r.player_id===profile.id&&r.active))
      await supabase.from('rosters').update({active:false,sold_price:filmVal(films.find(f=>f.id===h.film_id)||{}),sold_week:cfg.current_week}).eq('id',h.id)
    if (chips) await supabase.from('chips').update({recut_used:true}).eq('player_id',profile.id)
    else       await supabase.from('chips').insert({player_id:profile.id,recut_used:true})
    await logActivity(profile.id,'chip_recut',{player_name:profile.name})
    notify('🎬 RECUT activated', T.purple); setChipModal(null); loadData()
  }
  const activateShort = async (filmId, pred) => {
    if (chips?.short_film_id) return notify('Short already used', T.red)
    if (allChips.find(c=>c.short_film_id===filmId)) return notify('Film already shorted', T.red)
    if (chips) await supabase.from('chips').update({short_film_id:filmId,short_phase:curPhase(),short_prediction:pred}).eq('player_id',profile.id)
    else       await supabase.from('chips').insert({player_id:profile.id,short_film_id:filmId,short_phase:curPhase(),short_prediction:pred})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_short',{film_title:ft,prediction:pred,player_name:profile.name})
    notify(`📉 SHORT on ${ft}`, T.red); setChipModal(null); loadData()
  }
  const activateAnalyst = async (filmId, pred) => {
    if (chips?.analyst_film_id) return notify('Analyst already used', T.red)
    if (allChips.find(c=>c.analyst_film_id===filmId)) return notify('Film already Analysed', T.red)
    if (!rosters.find(r=>r.player_id===profile.id&&r.film_id===filmId&&r.active)) return notify('You must own this film', T.red)
    if (chips) await supabase.from('chips').update({analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred}).eq('player_id',profile.id)
    else       await supabase.from('chips').insert({player_id:profile.id,analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_analyst',{film_title:ft,prediction:pred,player_name:profile.name})
    notify(`🎯 ANALYST on ${ft}`, T.blue); setChipModal(null); loadData()
  }
  const resolveChips = async (filmId, actualM) => {
    const film=films.find(f=>f.id===filmId); if(!film) return
    for (const c of allChips) {
      if (c.short_film_id===filmId&&!c.short_result)   await supabase.from('chips').update({short_result:(actualM/film.estM)<0.6?'win':'lose'}).eq('player_id',c.player_id)
      if (c.analyst_film_id===filmId&&!c.analyst_result) {
        const within=c.analyst_prediction&&Math.abs(actualM-c.analyst_prediction)/c.analyst_prediction<=0.1
        await supabase.from('chips').update({analyst_result:within?'win':'lose'}).eq('player_id',c.player_id)
      }
    }
  }
  const submitOscarPick = async (filmId) => {
    if (myOscar) return notify('Already submitted', T.red)
    await supabase.from('oscar_predictions').insert({player_id:profile.id,best_picture_film_id:filmId})
    await logActivity(profile.id,'oscar',{film_title:films.find(f=>f.id===filmId)?.title,player_name:profile.name})
    notify(`🏆 Locked — ${films.find(f=>f.id===filmId)?.title}`, T.gold); loadData()
  }
  const submitAuteur = async (actor, filmIds) => {
    if (filmIds.length<2) return notify('Select at least 2 films', T.red)
    const ph=curPhase(), ex=auteurDecl.find(a=>a.player_id===profile.id&&a.phase===ph)
    if (ex) await supabase.from('auteur_declarations').update({star_actor:actor,film_ids:filmIds}).eq('id',ex.id)
    else    await supabase.from('auteur_declarations').insert({player_id:profile.id,phase:ph,star_actor:actor,film_ids:filmIds})
    await logActivity(profile.id,'auteur',{actor,film_count:filmIds.length,player_name:profile.name})
    notify(`🎭 Auteur — ${actor} · ${filmIds.length} films`, T.orange)
    setChipModal(null); setAuteurActor(''); setAuteurFilms([]); loadData()
  }
  const saveForecast = async (filmId, predicted) => {
    const ex=allForecasts.find(f=>f.player_id===profile.id&&f.film_id===filmId)
    if (ex) await supabase.from('forecasts').update({predicted_m:predicted}).eq('id',ex.id)
    else    await supabase.from('forecasts').insert({player_id:profile.id,film_id:filmId,phase:curPhase(),predicted_m:predicted})
    await logActivity(profile.id,'forecast',{film_title:films.find(f=>f.id===filmId)?.title,predicted_m:predicted,player_name:profile.name})
    notify(`Forecast saved — $${predicted}M`, T.blue); loadData()
  }

  // ── LOADING / AUTH SCREENS ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.mono }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'52px', fontWeight:900, color:T.gold, letterSpacing:'-2px', marginBottom:'16px' }}>BOXD</div>
        <div style={{ width:'40px', height:'3px', background:T.gold, borderRadius:'2px', margin:'0 auto', animation:'pulse 1.2s ease-in-out infinite' }}/>
      </div>
    </div>
  )
  if (!session)  return <Login />
  if (!profile)  return <CreateProfile session={session} onCreated={() => { loadProfile(); loadData() }} notify={notify} />

  // ── DERIVED STATE ───────────────────────────────────────────────────────────
  const ph           = curPhase()
  const win          = isWindow()
  const cur          = cfg.currency || '$'
  const phaseFilms   = films.filter(f => f.phase===ph)
  const myRoster     = rosters.filter(r => r.player_id===profile.id && r.phase===ph && r.active && films.find(f=>f.id===r.film_id))
  const myBudget     = budgetLeft(profile.id)
  const pendingForMe = trades.filter(t => t.receiver_id===profile.id && t.status==='pending')
  const recutUsed    = chips?.recut_used || false
  const shortUsed    = !!chips?.short_film_id
  const analystUsed  = !!chips?.analyst_film_id

  // Window timer
  const wMs = cfg.phase_window_opened_at ? Math.max(0, 72*3600000-(now-new Date(cfg.phase_window_opened_at).getTime())) : 0
  const wH=Math.floor(wMs/3600000), wMin=Math.floor((wMs%3600000)/60000), wS=Math.floor((wMs%60000)/1000)

  const ALL_PAGES = [
    {id:'market',icon:'🎬',label:'Market'},
    {id:'roster',icon:'📁',label:'Roster'},
    {id:'chips', icon:'⚡',label:'Chips'},
    {id:'league',icon:'🥇',label:'League'},
    {id:'feed',  icon:'📡',label:'Feed'},
    {id:'trades',icon:'🔄',label:'Trades'},
    {id:'forecaster',icon:'📊',label:'Forecaster'},
    {id:'oscar', icon:'🏆',label:'Oscars'},
    {id:'results',icon:'📋',label:'Results'},
    ...(isCommissioner ? [{id:'commissioner',icon:'⚙️',label:'Panel'}] : [])
  ]

  // ── MARKET ──────────────────────────────────────────────────────────────────
  const MarketPage = () => {
    const genres  = ['All', ...Object.keys(GENRE_COL)]
    const visible = phaseFilms.filter(f => {
      const ms = !marketSearch || f.title.toLowerCase().includes(marketSearch.toLowerCase()) || f.dist.toLowerCase().includes(marketSearch.toLowerCase())
      return ms && (marketGenre==='All' || f.genre===marketGenre)
    })

    return (
      <div>
        {/* Phase hero */}
        <div style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:'10px', marginBottom:'3px' }}>
            <div style={S.pageTitle}>Phase {ph}</div>
            <div style={{ fontSize:'14px', color:T.gold, fontWeight:500 }}>{PHASE_NAMES[ph]}</div>
          </div>
          <div style={{ display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', color:T.textSub }}>{cur}{myBudget}M budget · {myRoster.length}/{MAX_ROSTER} slots</span>
            {win && <Pill color={T.orange}>🔓 Free drops · {wH}h {wMin}m</Pill>}
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
          <input value={marketSearch} onChange={e=>setMarketSearch(e.target.value)} placeholder="Search films…" style={{ ...S.inp, flex:1 }}/>
          <select value={marketGenre} onChange={e=>setMarketGenre(e.target.value)} style={{ ...S.inp, flex:'0 0 auto', width:'100px', fontSize:'12px' }}>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Film grid */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(200px,1fr))', gap:'12px' }}>
          {visible.map(film => {
            const owned = myRoster.find(r => r.film_id===film.id)
            const val   = filmVal(film)
            const actual = results[film.id]
            const gc    = GENRE_COL[film.genre] || T.textSub
            const ipo   = film.basePrice
            const diff  = (filmValues[film.id]??ipo) - ipo
            const op    = actual!=null ? calcOpeningPts(film,actual,owned?isEarlyBird(owned):false,analystOn(profile.id,film.id)) : 0
            const wp    = actual!=null ? Math.round(calcWeeklyPts(weeklyG[film.id]||{})) : 0
            const ownCount  = rosters.filter(r=>r.film_id===film.id&&r.phase===ph&&r.active).length
            const demandPct = players.length ? Math.round(ownCount/players.length*100) : 0
            const isShorted  = chips?.short_film_id===film.id
            const isAnalyst_ = chips?.analyst_film_id===film.id
            const isAuteur_  = auteurOn(profile.id,film.id)
            const isEB       = owned && isEarlyBird(owned)

            return (
              <div key={film.id} className="hoverable" style={{
                background: owned ? `linear-gradient(155deg, ${T.gold}14 0%, ${T.surface} 55%)` : T.surface,
                border:`1px solid ${owned ? T.gold+'55' : T.border}`,
                borderRadius:'14px', overflow:'hidden',
                display:'flex', flexDirection:'column',
              }}>
                {/* Genre stripe */}
                <div style={{ height:'3px', background:gc, flexShrink:0 }}/>

                {/* Poster area */}
                <div style={{ position:'relative', cursor:'pointer', flexShrink:0 }} onClick={() => setFilmDetail(film)}>
                  <FilmPoster film={film} width="100%" height={isMobile?168:196} radius={0} imgStyle={{ width:'100%' }}/>
                  {/* Gradient overlay */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 45%, rgba(13,10,8,0.95) 100%)' }}/>
                  {/* Price overlay */}
                  <div style={{ position:'absolute', bottom:'10px', left:'12px' }}>
                    <div style={{ fontSize:'20px', fontWeight:800, color:owned?T.gold:T.text, lineHeight:1, fontFamily:T.mono }}>{cur}{val}M</div>
                    <div style={{ fontSize:'11px', color: diff>0?T.green:diff<0?T.red:T.textSub, marginTop:'2px' }}>
                      {diff===0?'—':diff>0?`▲ ${cur}${diff}`:`▼ ${cur}${Math.abs(diff)}`} IPO
                    </div>
                  </div>
                  {/* Badge cluster */}
                  <div style={{ position:'absolute', top:'8px', right:'8px', display:'flex', flexDirection:'column', gap:'4px', alignItems:'flex-end' }}>
                    {film.sleeper  && <Badge color={T.blue}>💤 sleeper</Badge>}
                    {isEB          && <Badge color={T.green}>🐦 early</Badge>}
                    {isShorted     && <Badge color={T.red}>📉 short</Badge>}
                    {isAnalyst_    && <Badge color={T.blue}>🎯 analyst</Badge>}
                    {isAuteur_     && <Badge color={T.orange}>🎭 auteur</Badge>}
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding:'12px', flex:1, display:'flex', flexDirection:'column', gap:'8px' }}>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, lineHeight:1.35, color:T.text }}>{film.title}</div>
                    <div style={{ fontSize:'11px', color:T.textSub, marginTop:'3px' }}>{film.dist} · W{film.week}</div>
                  </div>

                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                    <Pill color={gc}>{film.genre}</Pill>
                    {film.franchise && <Pill>{film.franchise.split(':')[0]}</Pill>}
                    {film.rt!=null  && <Pill color={film.rt>=90?T.green:film.rt>=75?T.gold:T.red}>🍅 {film.rt}%</Pill>}
                  </div>

                  {ownCount>0 && (
                    <div style={{ fontSize:'12px', color:demandPct>=40?T.red:demandPct>=25?T.orange:T.textSub }}>
                      {demandPct>=40?'🔥 ':demandPct>=15?'📈 ':''}{ownCount} own · {demandPct}%
                    </div>
                  )}

                  {actual!=null && (
                    <div style={{ background:T.surfaceUp, borderRadius:'9px', padding:'9px 11px', cursor:owned?'pointer':'default' }}
                      onClick={() => owned && setScoreModal({film,holding:owned})}>
                      <div style={{ fontSize:'13px', color:T.green, fontWeight:600 }}>${actual}M actual</div>
                      <div style={{ fontSize:'12px', color:T.gold, marginTop:'2px' }}>
                        {op}pts{wp>0?` +${wp}w`:''}{calcLegsBonus(actual,weeklyG[film.id]?.[2])>0?' 🦵':''}{wwBonus(film.id)>0?' 🥇':''}
                      </div>
                      {owned && <div style={{ fontSize:'10px', color:T.textDim, marginTop:'2px' }}>tap for breakdown →</div>}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:'6px' }}>
                    <button onClick={() => setFilmDetail(film)} style={{ ...S.btn, background:T.surfaceUp, color:T.textSub, fontSize:'13px', padding:'8px', flex:1 }}>💬</button>
                    {film.trailer?.length>5 && (
                      <button onClick={e=>{e.stopPropagation();setTrailerFilm(film)}} style={{ ...S.btn, background:T.surfaceUp, color:T.textSub, fontSize:'13px', padding:'8px', flex:1 }}>▶</button>
                    )}
                    {film.affiliateUrl && film.week<=cfg.current_week && (
                      <a href={film.affiliateUrl} target="_blank" rel="noopener noreferrer" style={{ ...S.btn, background:T.surfaceUp, color:T.gold, fontSize:'13px', padding:'8px', flex:1, textDecoration:'none' }}>🎟</a>
                    )}
                  </div>

                  {owned
                    ? <Btn onClick={() => sellFilm(film)} variant="outline" color={T.red} full size="md">
                        Drop{win ? ' FREE' : ` · $${Math.max(0,val-cfg.tx_fee)}M`}
                      </Btn>
                    : <Btn onClick={() => buyFilm(film)} color={T.gold} full size="md">
                        Acquire · {cur}{val}M
                      </Btn>
                  }
                </div>
              </div>
            )
          })}
          {visible.length===0 && (
            <div style={{ gridColumn:'1/-1', ...S.card, textAlign:'center', padding:'48px', color:T.textSub }}>No films match your search.</div>
          )}
        </div>
      </div>
    )
  }

  // ── ROSTER ──────────────────────────────────────────────────────────────────
  const RosterPage = () => (
    <div>
      <div style={S.pageTitle}>My Roster</div>
      <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'4px' }}>Phase {ph} · {PHASE_NAMES[ph]}</div>
      <div style={{ fontSize:'13px', color:T.textSub, marginBottom:'20px' }}>
        {myRoster.length}/{MAX_ROSTER} films · {cur}{myBudget}M left{phaseBanked(profile.id,ph)>0?` (incl. ${cur}${phaseBanked(profile.id,ph)}M banked)`:''}
      </div>

      {/* Phase score tabs */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'20px', overflowX:'auto', paddingBottom:'2px' }}>
        {[1,2,3,4,5].map(p => {
          const pts=calcPhasePoints(profile.id,p)
          const nr=rosters.filter(r=>r.player_id===profile.id&&r.phase===p&&films.find(f=>f.id===r.film_id)).length
          return (
            <div key={p} style={{ background:p===ph?`${T.gold}18`:T.surfaceUp, border:`1px solid ${p===ph?T.gold+'55':T.border}`, borderRadius:'10px', padding:'10px 14px', textAlign:'center', flexShrink:0, minWidth:'60px' }}>
              <div style={{ ...S.label, color:p===ph?T.gold:T.textDim, marginBottom:'4px' }}>PH{p}</div>
              <div style={{ fontSize:'16px', fontWeight:700, color:p===ph?T.gold:T.text }}>{pts}</div>
              <div style={{ fontSize:'11px', color:T.textSub, marginTop:'2px' }}>{nr} films</div>
            </div>
          )
        })}
      </div>

      {myRoster.length===0
        ? <div style={{ ...S.card, textAlign:'center', padding:'48px 24px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>🎬</div>
            <div style={{ fontSize:'14px', color:T.textSub }}>No films this phase.</div>
            <div style={{ fontSize:'12px', color:T.textDim, marginTop:'6px' }}>Head to Market to acquire.</div>
          </div>
        : myRoster.map(h => {
            const film=films.find(f=>f.id===h.film_id); if(!film) return null
            const val=filmVal(film), actual=results[film.id], pnl=val-h.bought_price
            const gc=GENRE_COL[film.genre]||T.textSub
            const wp=actual!=null?Math.round(calcWeeklyPts(weeklyG[film.id]||{})):0
            const eb=isEarlyBird(h), ao=analystOn(profile.id,film.id), au=auteurOn(profile.id,film.id)
            let op=actual!=null?calcOpeningPts(film,actual,eb,ao):0; if(au&&actual!=null) op=Math.round(op*1.1)
            const lb=calcLegsBonus(actual,weeklyG[film.id]?.[2])
            const wb=wwBonus(film.id), sb=shortBonus(profile.id,film.id)
            const total=op+wp+lb+wb+sb

            return (
              <div key={h.id} className="hoverable" style={{ ...S.card, display:'flex', gap:'14px', alignItems:'flex-start', marginBottom:'10px', cursor:actual!=null?'pointer':'default' }}
                onClick={() => actual!=null && setScoreModal({film,holding:h})}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <FilmPoster film={film} width={56} height={84} radius={9} />
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:gc, borderRadius:'9px 9px 0 0' }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'15px', fontWeight:700, marginBottom:'3px', lineHeight:1.3 }}>{film.title}</div>
                  <div style={{ fontSize:'12px', color:T.textSub, marginBottom:'10px' }}>{film.dist} · W{film.week}</div>
                  <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'8px' }}>
                    <div><div style={S.label}>Paid</div><div style={{ fontSize:'15px', fontWeight:600, marginTop:'3px' }}>{cur}{h.bought_price}M</div></div>
                    <div><div style={S.label}>Now</div><div style={{ fontSize:'15px', fontWeight:600, color:pnl>=0?T.green:T.red, marginTop:'3px' }}>{cur}{val}M</div></div>
                    <div><div style={S.label}>P&L</div><div style={{ fontSize:'15px', fontWeight:700, color:pnl>=0?T.green:T.red, marginTop:'3px' }}>{pnl>=0?'+':''}{pnl}M</div></div>
                    {actual!=null && <div><div style={S.label}>Pts</div><div style={{ fontSize:'15px', fontWeight:700, color:T.gold, marginTop:'3px' }}>{total}</div></div>}
                  </div>
                  <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                    {eb && <Badge color={T.green}>🐦 early bird</Badge>}
                    {ao && <Badge color={T.blue}>🎯 +60</Badge>}
                    {au && <Badge color={T.orange}>🎭 +10%</Badge>}
                    {actual!=null && <span style={{ fontSize:'11px', color:T.textDim, alignSelf:'center' }}>tap for breakdown →</span>}
                  </div>
                </div>
              </div>
            )
          })
      }
    </div>
  )

  // ── CHIPS ───────────────────────────────────────────────────────────────────
  const ChipsPage = () => {
    const myAuteur = auteurDecl.find(a => a.player_id===profile.id && a.phase===ph)
    return (
      <div>
        <div style={S.pageTitle}>My Chips</div>
        <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'20px' }}>One of each per season · first-come first-served on Shorts & Analyst</div>

        {[
          { key:'recut',   icon:'🎬', label:'THE RECUT',   desc:'Wipe your roster completely — zero fees, anytime',                              used:recutUsed,  col:T.purple, usedLabel:'Used', action:activateRecut },
          { key:'short',   icon:'📉', label:'THE SHORT',   desc:'Call a bomb — under 60% est = +100pts · overshoots = −30pts',                  used:shortUsed,  col:T.red,    usedLabel:chips?.short_result==='win'?'✅ +100pts':chips?.short_result==='lose'?'❌ −30pts':`📉 ${films.find(f=>f.id===chips?.short_film_id)?.title||'Active'}`, action:()=>setChipModal('short') },
          { key:'analyst', icon:'🎯', label:'THE ANALYST', desc:'Predict opening ±10% on a film you own — correct = +60pts flat',              used:analystUsed,col:T.blue,   usedLabel:chips?.analyst_result==='win'?'✅ +60pts':chips?.analyst_result==='lose'?'❌ Missed':`🎯 ${films.find(f=>f.id===chips?.analyst_film_id)?.title||'Active'}`, action:()=>setChipModal('analyst') },
        ].map(({ key, icon, label, desc, used, col, usedLabel, action }) => (
          <div key={key} style={{ ...S.card, border:`1px solid ${used?T.border:col+'44'}`, marginBottom:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <div style={{ fontSize:'30px', lineHeight:1, flexShrink:0 }}>{icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:used?T.textSub:col, marginBottom:'3px' }}>{label}</div>
                <div style={{ fontSize:'12px', color:T.textSub, lineHeight:1.5 }}>{desc}</div>
              </div>
              {used
                ? <span style={{ fontSize:'11px', color:T.textSub, padding:'5px 12px', border:`1px solid ${T.border}`, borderRadius:'20px', whiteSpace:'nowrap', flexShrink:0 }}>{usedLabel}</span>
                : <Btn onClick={action} color={col} textColor="#0D0A08" size="sm">Activate</Btn>
              }
            </div>
          </div>
        ))}

        {/* Auteur */}
        <div style={{ ...S.card, border:`1px solid ${myAuteur?T.border:T.orange+'44'}`, marginBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ fontSize:'30px', lineHeight:1, flexShrink:0 }}>🎭</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'15px', fontWeight:700, color:myAuteur?T.textSub:T.orange, marginBottom:'3px' }}>THE AUTEUR</div>
              <div style={{ fontSize:'12px', color:T.textSub, lineHeight:1.5 }}>Declare 2+ films by the same star actor — +10% opening pts each</div>
              {myAuteur && <div style={{ fontSize:'12px', color:T.orange, marginTop:'5px', fontWeight:500 }}>⭐ {myAuteur.star_actor} · {myAuteur.film_ids.length} films</div>}
            </div>
            <Btn onClick={() => setChipModal('auteur')} color={myAuteur?T.surfaceUp:T.orange} textColor={myAuteur?T.textSub:'#0D0A08'} variant={myAuteur?'outline':'solid'} size="sm">
              {myAuteur ? 'Update' : 'Declare'}
            </Btn>
          </div>
        </div>

        {/* League chip activity */}
        {allChips.filter(c => c.player_id!==profile.id && (c.short_film_id||c.analyst_film_id)).length>0 && (
          <div>
            <div style={{ ...S.sectionTitle, marginBottom:'12px' }}>League Chip Activity</div>
            {allChips.filter(c=>c.player_id!==profile.id).map(c => {
              const p=players.find(pl=>pl.id===c.player_id)
              return (
                <div key={c.id} style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'8px' }}>
                  {c.short_film_id && (
                    <div style={{ background:T.surfaceUp, borderRadius:'9px', padding:'7px 14px', fontSize:'12px' }}>
                      <span style={{ color:T.red }}>📉 {p?.name}</span>
                      <span style={{ color:T.textSub }}> → {films.find(f=>f.id===c.short_film_id)?.title}</span>
                      {c.short_result && <span style={{ color:c.short_result==='win'?T.green:T.red }}> {c.short_result==='win'?'✅':'❌'}</span>}
                    </div>
                  )}
                  {c.analyst_film_id && (
                    <div style={{ background:T.surfaceUp, borderRadius:'9px', padding:'7px 14px', fontSize:'12px' }}>
                      <span style={{ color:T.blue }}>🎯 {p?.name}</span>
                      <span style={{ color:T.textSub }}> → {films.find(f=>f.id===c.analyst_film_id)?.title}</span>
                      {c.analyst_result && <span style={{ color:c.analyst_result==='win'?T.green:T.red }}> {c.analyst_result==='win'?'✅':'❌'}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── LEAGUE ──────────────────────────────────────────────────────────────────
  const LeaguePage = () => (
    <div>
      <div style={S.pageTitle}>Standings</div>
      <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'20px' }}>Grand League · W{cfg.current_week} · Phase {ph}</div>

      {/* Phase leader grid */}
      <div style={{ ...S.card, marginBottom:'20px' }}>
        <div style={{ ...S.sectionTitle, marginBottom:'14px' }}>Phase Leaders</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>
          {[1,2,3,4,5].map(p => {
            const sc=[...players].map(pl=>({pl,pts:calcPhasePoints(pl.id,p)})).sort((a,b)=>b.pts-a.pts)
            const leader=sc[0]
            return (
              <div key={p} style={{ background:p===ph?`${T.gold}15`:T.surfaceUp, border:`1px solid ${p===ph?T.gold+'44':T.border}`, borderRadius:'10px', padding:'10px 4px', textAlign:'center' }}>
                <div style={{ ...S.label, color:p===ph?T.gold:T.textDim, marginBottom:'4px' }}>PH{p}</div>
                {leader?.pts>0
                  ? <><div style={{ fontSize:'11px', fontWeight:600, color:players.find(pl=>pl.id===leader.pl.id)?.color||T.gold, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:'0 2px' }}>{leader.pl.name}</div>
                      <div style={{ fontSize:'14px', fontWeight:800, color:p===ph?T.gold:T.text, marginTop:'2px' }}>{leader.pts}</div></>
                  : <div style={{ fontSize:'12px', color:T.textDim, paddingTop:'6px' }}>—</div>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Player rankings */}
      {[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id)).map((player,i) => {
        const pts  = calcPoints(player.id)
        const rank = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`
        const pc   = allChips.find(c=>c.player_id===player.id)
        const pa   = auteurDecl.find(a=>a.player_id===player.id&&a.phase===ph)

        return (
          <div key={player.id} className="hoverable" style={{ ...S.card, display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px', cursor:'pointer' }}
            onClick={() => goToProfile(player)}>
            <div style={{ fontSize:'24px', minWidth:'30px', textAlign:'center' }}>{rank}</div>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:player.color||T.gold, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, color:'#0D0A08' }}>{player.name?.[0]||'?'}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'15px', fontWeight:600, color:player.color||T.gold, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player.name}</div>
              <div style={{ display:'flex', gap:'6px', marginTop:'4px', flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:'12px', color:T.textSub }}>Ph{ph}: {calcPhasePoints(player.id,ph)}pts</span>
                <span style={{ fontSize:'11px', color:T.textDim }}>·</span>
                <span style={{ fontSize:'12px', color:T.textSub }}>{cur}{budgetLeft(player.id)} left</span>
                {pc?.recut_used      && <Badge color={T.purple}>🎬</Badge>}
                {pc?.short_film_id   && <Badge color={T.red}>📉</Badge>}
                {pc?.analyst_film_id && <Badge color={T.blue}>🎯</Badge>}
                {pa                  && <Badge color={T.orange}>🎭</Badge>}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'30px', fontWeight:900, color:i===0?T.gold:T.text, lineHeight:1, fontFamily:T.mono }}>{pts}</div>
              <div style={S.label}>pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── FEED ────────────────────────────────────────────────────────────────────
  const FeedPage = () => {
    const getItem = item => {
      const p=item.payload||{}, pl=players.find(pl=>pl.id===item.user_id)
      const pName=p.player_name||pl?.name||'Someone', pCol=pl?.color||T.gold
      const pSpan = <span style={{ color:pCol, fontWeight:600 }}>{pName}</span>
      switch(item.type) {
        case 'buy':            return { icon:'🎬', text:<>{pSpan} acquired <b style={{color:T.text}}>{p.film_title}</b> for <span style={{color:T.green}}>${p.price}M</span></>, col:T.green }
        case 'sell':           return { icon:'💸', text:<>{pSpan} dropped <b style={{color:T.text}}>{p.film_title}</b></>, col:T.gold }
        case 'chip_recut':     return { icon:'🎬', text:<>{pSpan} activated <span style={{color:T.purple,fontWeight:700}}>THE RECUT</span></>, col:T.purple }
        case 'chip_short':     return { icon:'📉', text:<>{pSpan} shorted <b>{p.film_title}</b> at <span style={{color:T.red}}>${p.prediction}M</span></>, col:T.red }
        case 'chip_analyst':   return { icon:'🎯', text:<>{pSpan} went Analyst on <b>{p.film_title}</b> at <span style={{color:T.blue}}>${p.prediction}M</span></>, col:T.blue }
        case 'auteur':         return { icon:'🎭', text:<>{pSpan} declared Auteur — <span style={{color:T.orange,fontWeight:600}}>{p.actor}</span></>, col:T.orange }
        case 'forecast':       return { icon:'📊', text:<>{pSpan} forecast <b>{p.film_title}</b> at <span style={{color:T.blue}}>${p.predicted_m}M</span></>, col:T.blue }
        case 'oscar':          return { icon:'🏆', text:<>{pSpan} locked Best Picture — <span style={{color:T.gold,fontWeight:600}}>{p.film_title}</span></>, col:T.gold }
        case 'trade_proposed': return { icon:'🔄', text:<>{pSpan} proposed a trade</>, col:T.blue }
        case 'trade_accepted': return { icon:'🤝', text:<>Trade complete — <span style={{color:T.green}}>{p.film_received}</span></>, col:T.green }
        default:               return { icon:'📡', text:pSpan, col:T.textSub }
      }
    }

    const grouped = feedItems.reduce((acc, item) => {
      const day = new Date(item.created_at).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})
      if (!acc[day]) acc[day]=[]
      acc[day].push(item)
      return acc
    }, {})

    return (
      <div>
        <div style={S.pageTitle}>League Feed</div>
        <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'20px' }}>Live · updates in real time</div>
        {feedItems.length===0 && (
          <div style={{ ...S.card, textAlign:'center', padding:'48px 24px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>📡</div>
            <div style={{ fontSize:'14px', color:T.textSub }}>No activity yet</div>
          </div>
        )}
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div style={{ ...S.label, margin:'20px 0 10px' }}>{day}</div>
            {items.map(item => {
              const { icon, text, col } = getItem(item)
              return (
                <div key={item.id} style={{ ...S.card, padding:'13px 15px', marginBottom:'8px', borderLeft:`3px solid ${col}55`, display:'flex', gap:'14px', alignItems:'flex-start', animation:'fadeUp .3s ease' }}>
                  <div style={{ fontSize:'18px', flexShrink:0, marginTop:'1px' }}>{icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', lineHeight:1.6, color:T.text }}>{text}</div>
                    <div style={{ fontSize:'11px', color:T.textDim, marginTop:'4px' }}>{timeAgo(item.created_at)} ago</div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // ── TRADES ──────────────────────────────────────────────────────────────────
  const TradesPage = () => {
    const myProposed = trades.filter(t => t.proposer_id===profile.id)
    const myReceived = trades.filter(t => t.receiver_id===profile.id)

    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
          <div>
            <div style={S.pageTitle}>Trades</div>
            <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px' }}>Phase {ph} films · instant on acceptance</div>
          </div>
          <Btn onClick={() => setTradeModal(true)} color={T.blue} textColor="#fff">+ Propose</Btn>
        </div>

        {pendingForMe.length>0 && (
          <div style={{ ...S.card, border:`1px solid ${T.blue}44`, marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', color:T.blue, fontWeight:600, marginBottom:'14px' }}>📬 Incoming ({pendingForMe.length})</div>
            {pendingForMe.map(t => {
              const proposer=players.find(p=>p.id===t.proposer_id)
              const theirFilm=films.find(f=>f.id===t.proposer_film_id)
              const myFilm_=films.find(f=>f.id===t.receiver_film_id)
              return (
                <div key={t.id} style={{ background:T.surfaceUp, borderRadius:'12px', padding:'14px', marginBottom:'10px' }}>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'12px' }}>
                    <FilmPoster film={theirFilm} width={40} height={60} radius={6} />
                    <div style={{ flex:1, fontSize:'13px', lineHeight:1.6 }}>
                      <span style={{ color:proposer?.color||T.gold, fontWeight:600 }}>{proposer?.name}</span>
                      <span style={{ color:T.textSub }}> offers </span>
                      <span style={{ color:T.blue, fontWeight:500 }}>{theirFilm?.title}</span>
                      <span style={{ color:T.textSub }}> for your </span>
                      <span style={{ color:T.gold, fontWeight:500 }}>{myFilm_?.title}</span>
                    </div>
                    <FilmPoster film={myFilm_} width={40} height={60} radius={6} />
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <Btn onClick={() => acceptTrade(t)} color={T.green} textColor="#0D0A08" sx={{ flex:1 }}>Accept</Btn>
                    <Btn onClick={() => rejectTrade(t)} variant="outline" color={T.red} sx={{ flex:1 }}>Decline</Btn>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {myProposed.length>0 && (
          <div>
            <div style={{ ...S.sectionTitle, marginBottom:'12px' }}>My Proposals</div>
            {myProposed.map(t => {
              const receiver=players.find(p=>p.id===t.receiver_id)
              const mf=films.find(f=>f.id===t.proposer_film_id)
              const tf=films.find(f=>f.id===t.receiver_film_id)
              const sc={accepted:T.green,rejected:T.red,cancelled:T.textDim,pending:T.blue}[t.status]||T.textSub
              return (
                <div key={t.id} style={{ ...S.card, marginBottom:'8px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                    <span style={{ fontSize:'13px', color:receiver?.color||T.gold, fontWeight:600 }}>{receiver?.name}</span>
                    <Pill color={sc}>{t.status}</Pill>
                  </div>
                  <div style={{ fontSize:'13px', color:T.textSub, lineHeight:1.5 }}>
                    Give <span style={{ color:T.text }}>{mf?.title}</span> · Get <span style={{ color:T.text }}>{tf?.title}</span>
                  </div>
                  <div style={{ fontSize:'11px', color:T.textDim, marginTop:'5px' }}>{timeAgo(t.created_at)} ago</div>
                  {t.status==='pending' && <Btn onClick={() => cancelTrade(t)} variant="outline" color={T.textSub} size="sm" sx={{ marginTop:'10px' }}>Cancel</Btn>}
                </div>
              )
            })}
          </div>
        )}

        {myProposed.length===0 && pendingForMe.length===0 && (
          <div style={{ ...S.card, textAlign:'center', padding:'48px 24px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>🔄</div>
            <div style={{ fontSize:'14px', color:T.textSub }}>No trades yet — propose one above!</div>
          </div>
        )}
      </div>
    )
  }

  // ── FORECASTER ──────────────────────────────────────────────────────────────
  const ForecasterPage = () => (
    <div>
      <div style={S.pageTitle}>Forecaster</div>
      <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'20px' }}>Best phase accuracy = +15pts · Best season = +50pts</div>
      {films.filter(f=>!results[f.id]).map(film => {
        const fc=forecasts[film.id]
        return (
          <div key={film.id} style={{ ...S.card, display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap', marginBottom:'8px' }}>
            <FilmPoster film={film} width={36} height={54} radius={6} />
            <div style={{ flex:2, minWidth:'120px' }}>
              <div style={{ fontSize:'14px', fontWeight:500 }}>{film.title}</div>
              <div style={{ fontSize:'12px', color:T.textSub }}>Est ${film.estM}M · Ph{film.phase}</div>
            </div>
            <input type="number" step="0.1" defaultValue={fc||''} placeholder="$M" id={`fc-${film.id}`} style={{ ...S.inp, width:'90px' }}/>
            <Btn color={T.blue} textColor="#fff" onClick={() => { const v=parseFloat(document.getElementById(`fc-${film.id}`).value); if(isNaN(v)) return notify('Enter a number',T.red); saveForecast(film.id,v) }}>Lock</Btn>
            {fc && <span style={{ fontSize:'13px', color:T.blue }}>${fc}M</span>}
          </div>
        )
      })}

      {films.filter(f=>results[f.id]).length>0 && (
        <div style={{ marginTop:'28px' }}>
          <div style={{ ...S.sectionTitle, marginBottom:'14px' }}>Results</div>
          {films.filter(f=>results[f.id]).map(film => {
            const actual=results[film.id], pfc=allForecasts.filter(f=>f.film_id===film.id)
            return (
              <div key={film.id} style={{ ...S.card, marginBottom:'10px' }}>
                <div style={{ fontSize:'14px', fontWeight:600, marginBottom:'10px' }}>{film.title} <span style={{ color:T.green, fontWeight:400 }}>— ${actual}M</span></div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {pfc.map(fc => {
                    const p=players.find(pl=>pl.id===fc.player_id)
                    const pct=Math.round((Math.abs(fc.predicted_m-actual)/actual)*100)
                    return <div key={fc.id} style={{ background:T.surfaceUp, borderRadius:'9px', padding:'5px 12px', fontSize:'12px' }}><span style={{color:p?.color||T.gold}}>{p?.name}</span><span style={{color:T.textSub}}> ${fc.predicted_m}M </span><span style={{color:pct<=10?T.green:T.red}}>{pct<=10?'✅ ':''}{pct}% off</span></div>
                  })}
                  {!pfc.length && <div style={{ fontSize:'12px', color:T.textSub }}>No predictions</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── OSCARS ──────────────────────────────────────────────────────────────────
  const OscarPage = () => (
    <div>
      <div style={S.pageTitle}>🏆 Oscars</div>
      <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'20px' }}>Predict Best Picture · correct = +75pts</div>
      {myOscar
        ? <div style={{ ...S.card, border:`1px solid ${T.gold}44`, marginBottom:'20px' }}>
            <div style={{ ...S.label, marginBottom:'12px' }}>Your Pick</div>
            <div style={{ display:'flex', gap:'14px', alignItems:'center' }}>
              <FilmPoster film={films.find(f=>f.id===myOscar.best_picture_film_id)} width={56} height={84} radius={8} />
              <div>
                <div style={{ fontSize:'18px', fontWeight:700, color:T.gold }}>{films.find(f=>f.id===myOscar.best_picture_film_id)?.title||'—'}</div>
                <div style={{ fontSize:'13px', color:T.textSub, marginTop:'6px' }}>
                  {myOscar.correct===true?'✅ CORRECT — +75pts':myOscar.correct===false?'❌ Incorrect':'Awaiting Oscar night'}
                </div>
              </div>
            </div>
          </div>
        : <div style={{ ...S.card, marginBottom:'20px' }}>
            <div style={{ fontSize:'13px', color:T.textSub, marginBottom:'14px' }}>Locks immediately — cannot be changed</div>
            <select id="oscar-pick" style={{ ...S.inp, marginBottom:'14px' }}><option value="">Select a film…</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
            <Btn onClick={() => { const id=document.getElementById('oscar-pick').value; if(!id) return notify('Select a film',T.red); submitOscarPick(id) }} color={T.gold} full size="lg">🏆 Lock In</Btn>
          </div>
      }
      {oscarPreds.length>0 && (
        <div>
          <div style={{ ...S.sectionTitle, marginBottom:'12px' }}>All Picks</div>
          {oscarPreds.map(op => {
            const p=players.find(pl=>pl.id===op.player_id), f=films.find(fl=>fl.id===op.best_picture_film_id)
            return (
              <div key={op.id} style={{ ...S.card, display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                <FilmPoster film={f} width={32} height={48} radius={6} />
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:p?.color||T.gold, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:'13px', color:p?.color||T.gold, fontWeight:500 }}>{p?.name}</div>
                <div style={{ fontSize:'13px', color:T.text }}>{f?.title||'—'}</div>
                {op.correct===true  && <span style={{color:T.green}}>✅ +75</span>}
                {op.correct===false && <span style={{color:T.red}}>❌</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  const ResultsPage = () => (
    <div>
      <div style={S.pageTitle}>Enter Results</div>
      <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'20px' }}>Opening weekend · weekly grosses · weekend #1</div>
      {films.map(film => {
        const actual=results[film.id], weeks=weeklyG[film.id]||{}, lb=calcLegsBonus(actual,weeks[2]), isWinner=wwWinners[film.week]===film.id
        return (
          <div key={film.id} style={{ ...S.card, marginBottom:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
              <FilmPoster film={film} width={32} height={48} radius={6} />
              <div style={{ flex:2, minWidth:'120px' }}>
                <div style={{ fontSize:'13px', fontWeight:500 }}>{film.title} {isWinner&&'🥇'}</div>
                <div style={{ fontSize:'11px', color:T.textSub }}>Est ${film.estM}M · Ph{film.phase} W{film.week}</div>
              </div>
              <input type="number" step="0.1" defaultValue={actual||''} placeholder="Opening $M" id={`res-${film.id}`} style={{ ...S.inp, width:'110px' }}/>
              <Btn color={T.green} textColor="#0D0A08" onClick={async () => {
                const v=parseFloat(document.getElementById(`res-${film.id}`).value); if(isNaN(v)) return notify('Enter a number',T.red)
                const nv=calcMarketValue(film,v)
                await dbUpsert('results','film_id',film.id,{actual_m:v})
                await dbUpsert('film_values','film_id',film.id,{current_value:nv})
                await resolveChips(film.id,v)
                await logActivity(session.user.id,'result',{film_title:film.title,actual_m:v})
                notify(`✅ ${film.title} · $${nv} · ${calcOpeningPts(film,v)}pts`,T.gold); loadData()
              }}>Save</Btn>
              <button style={{ ...S.btn, background:isWinner?T.gold:T.surfaceUp, border:isWinner?'none':`1px solid ${T.border}`, color:isWinner?'#0D0A08':T.textSub, fontSize:'12px', padding:'9px 12px' }}
                onClick={async () => {
                  if(isWinner) { await supabase.from('weekend_winners').delete().eq('week',film.week) }
                  else { const ex=await supabase.from('weekend_winners').select('id').eq('week',film.week).single(); if(ex.data) await supabase.from('weekend_winners').update({film_id:film.id,phase:ph}).eq('week',film.week); else await supabase.from('weekend_winners').insert({film_id:film.id,week:film.week,phase:ph}) }
                  notify(isWinner?'Removed':`🥇 ${film.title} · +15pts`,T.gold); loadData()
                }}>{isWinner?'🥇 #1':'#1?'}</button>
              {actual!=null && <span style={{ fontSize:'12px', color:T.green }}>${actual}M → ${filmVal(film)}M · {calcOpeningPts(film,actual)}pts</span>}
            </div>

            {actual!=null && (
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:'12px', marginTop:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                  <div style={S.label}>Weekly Grosses</div>
                  {lb>0 && <Badge color={T.green}>🦵 Legs +25pts</Badge>}
                </div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {[2,3,4,5,6,7,8].map(wk => {
                    const rate=wk>=4?1.1:1
                    return (
                      <div key={wk} style={{ display:'flex', flexDirection:'column', gap:'4px', alignItems:'center' }}>
                        <div style={{ fontSize:'10px', color:T.textDim }}>W{wk}{wk>=4?'×1.1':''}</div>
                        <input type="number" step="0.1" placeholder="$M" defaultValue={weeks[wk]||''} id={`wk-${film.id}-${wk}`} style={{ ...S.inp, width:'60px', fontSize:'11px', padding:'5px 6px' }}/>
                        <button style={{ ...S.btn, background:T.surfaceUp, border:`1px solid ${T.border}`, color:T.textSub, fontSize:'9px', padding:'3px 6px' }}
                          onClick={async () => { const v=parseFloat(document.getElementById(`wk-${film.id}-${wk}`).value); if(isNaN(v)) return; await dbUpsertWeekly(film.id,wk,v); notify(`W${wk} saved`,T.gold); loadData() }}>Save</button>
                        {weeks[wk] && <div style={{ fontSize:'10px', color:T.blue }}>+{Math.round(Number(weeks[wk])*rate)}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── COMMISSIONER ─────────────────────────────────────────────────────────────
  const CommissionerPage = () => (
    <div>
      <div style={S.pageTitle}>⚙️ Panel</div>
      <div style={{ fontSize:'13px', color:T.textSub, marginTop:'4px', marginBottom:'20px' }}>Commissioner controls</div>

      <div style={{ ...S.card, marginBottom:'12px' }}>
        <div style={{ ...S.sectionTitle, color:T.gold, marginBottom:'14px' }}>League Controls</div>
        <div style={{ fontSize:'13px', color:T.textSub, marginBottom:'12px' }}>W{cfg.current_week} · Ph{ph} · {PHASE_NAMES[ph]}</div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <Btn color={T.gold} size="sm" onClick={async()=>{await supabase.from('league_config').update({current_week:cfg.current_week+1}).eq('id',1);notify(`Week ${cfg.current_week+1}`,T.green);loadData()}}>Next Week →</Btn>
          <Btn color={win?T.orange:T.purple} textColor="#fff" size="sm" onClick={async()=>{const ni=new Date().toISOString();await supabase.from('league_config').update({phase_window_active:!win,phase_window_opened_at:!win?ni:null}).eq('id',1);notify(win?'Window closed':'🔓 72hr window open!',T.orange);loadData()}}>{win?'🔒 Close Window':'🔓 72hr Window'}</Btn>
          <Btn variant="outline" color={T.gold} size="sm" onClick={async()=>{if(!confirm(`Advance to Phase ${ph+1}?`)) return; for(const p of players) await bankBudget(p.id,ph); await supabase.from('league_config').update({current_phase:ph+1,phase_window_active:false,phase_window_opened_at:null}).eq('id',1); notify(`Phase ${ph+1} started`,T.green); loadData()}}>Next Phase →</Btn>
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'14px' }}>
          {players.map(p => (
            <div key={p.id} style={{ background:T.surfaceUp, borderRadius:'8px', padding:'6px 12px', fontSize:'12px' }}>
              <span style={{color:p.color||T.gold}}>{p.name}</span>
              <span style={{color:T.textSub}}> {cur}{budgetLeft(p.id)}M</span>
              {phaseBanked(p.id,ph)>0 && <span style={{color:T.orange}}> +{phaseBanked(p.id,ph)}banked</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:'12px', border:`1px solid ${T.red}33` }}>
        <div style={{ ...S.sectionTitle, color:T.red, marginBottom:'8px' }}>Roster Maintenance</div>
        <div style={{ fontSize:'12px', color:T.textSub, marginBottom:'12px' }}>Fix orphaned active roster rows from deleted films.</div>
        <Btn variant="outline" color={T.red} size="sm" onClick={async()=>{
          const ids=new Set(films.map(f=>f.id)), orphans=rosters.filter(r=>r.active&&!ids.has(r.film_id))
          if(!orphans.length) return notify('No orphans found ✅',T.green)
          for(const o of orphans) await supabase.from('rosters').update({active:false}).eq('id',o.id)
          notify(`Fixed ${orphans.length} orphaned rows`,T.green); loadData()
        }}>Scan & Fix Orphans ({rosters.filter(r=>r.active&&!films.find(f=>f.id===r.film_id)).length})</Btn>
      </div>

      <div style={{ ...S.card, marginBottom:'12px' }}>
        <div style={{ ...S.sectionTitle, color:T.gold, marginBottom:'14px' }}>Oscar Night</div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <select id="oscar-win" style={{ ...S.inp, flex:1, minWidth:'180px' }}><option value="">Best Picture winner…</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
          <Btn color={T.gold} onClick={async()=>{ const id=document.getElementById('oscar-win').value; if(!id) return; await supabase.from('league_config').update({best_picture_winner:id}).eq('id',1); for(const op of oscarPreds) await supabase.from('oscar_predictions').update({correct:op.best_picture_film_id===id}).eq('player_id',op.player_id); notify(`🏆 ${films.find(f=>f.id===id)?.title}`,T.gold); loadData() }}>Set Winner</Btn>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:'12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <div style={{ ...S.sectionTitle, color:T.gold }}>Film Management</div>
          <Btn color={T.green} textColor="#0D0A08" size="sm" onClick={()=>setAddFilm(true)}>+ Add Film</Btn>
        </div>
        {[1,2,3,4,5].map(p => {
          const pf=films.filter(f=>f.phase===p); if(!pf.length) return null
          return (
            <div key={p} style={{ marginBottom:'16px' }}>
              <div style={{ ...S.label, color:p===ph?T.gold:T.textDim, marginBottom:'8px' }}>Phase {p} — {PHASE_NAMES[p]}</div>
              {pf.map(film=>(
                <div key={film.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 0', borderBottom:`1px solid ${T.border}`, flexWrap:'wrap' }}>
                  <FilmPoster film={film} width={24} height={36} radius={4} />
                  <div style={{ flex:2, minWidth:'100px' }}>
                    <div style={{ fontSize:'12px' }}>{film.title}</div>
                    <div style={{ fontSize:'10px', color:T.textSub }}>W{film.week}</div>
                  </div>
                  {[['IPO','basePrice',50],['EST','estM',50],['RT%','rt',44]].map(([lbl,fld,w])=>(
                    <div key={fld}>
                      <div style={{ fontSize:'9px', color:T.textDim, marginBottom:'2px' }}>{lbl}</div>
                      <input type="number" defaultValue={film[fld]||''} id={`${fld}-${film.id}`} style={{ ...S.inp, width:`${w}px`, fontSize:'11px', padding:'4px 6px' }}/>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize:'9px', color:T.textDim, marginBottom:'2px' }}>AFF</div>
                    <input type="text" defaultValue={film.affiliateUrl||''} id={`aff-${film.id}`} style={{ ...S.inp, width:'80px', fontSize:'10px', padding:'4px 6px' }}/>
                  </div>
                  <Btn size="sm" variant="outline" color={T.gold} onClick={()=>{const ni=parseInt(document.getElementById(`basePrice-${film.id}`).value),ne=parseInt(document.getElementById(`estM-${film.id}`).value),nr=parseInt(document.getElementById(`rt-${film.id}`).value)||null,na=document.getElementById(`aff-${film.id}`).value.trim();setFilms(prev=>prev.map(f=>f.id===film.id?{...f,basePrice:ni,estM:ne,rt:nr,affiliateUrl:na}:f));notify(`Updated ${film.title}`,T.green)}}>Save</Btn>
                  <Btn size="sm" variant="outline" color={T.red} onClick={()=>{if(!confirm(`Remove ${film.title}?`)) return; setFilms(prev=>prev.filter(f=>f.id!==film.id)); notify(`Removed ${film.title}`,T.red)}}>✕</Btn>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div style={S.card}>
        <div style={{ ...S.sectionTitle, color:T.gold, marginBottom:'14px' }}>Chip Overrides</div>
        {!allChips.length && <div style={{ fontSize:'13px', color:T.textSub }}>No chips activated yet.</div>}
        {allChips.map(c => {
          const p=players.find(pl=>pl.id===c.player_id)
          return (
            <div key={c.id} style={{ padding:'12px 0', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:'13px', fontWeight:600, color:p?.color||T.gold, marginBottom:'8px' }}>{p?.name}</div>
              {c.short_film_id && (
                <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap', marginBottom:'6px' }}>
                  <span style={{ fontSize:'12px', color:T.red }}>📉 {films.find(f=>f.id===c.short_film_id)?.title}</span>
                  <span style={{ fontSize:'12px', color:T.textSub }}>→ {c.short_result||'pending'}</span>
                  {!c.short_result && <><Btn color={T.green} textColor="#0D0A08" size="sm" onClick={async()=>{await supabase.from('chips').update({short_result:'win'}).eq('player_id',c.player_id);notify('Short WIN',T.green);loadData()}}>Win</Btn><Btn color={T.red} textColor="#fff" size="sm" onClick={async()=>{await supabase.from('chips').update({short_result:'lose'}).eq('player_id',c.player_id);notify('Short LOSE',T.red);loadData()}}>Lose</Btn></>}
                </div>
              )}
              {c.analyst_film_id && (
                <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'12px', color:T.blue }}>🎯 {films.find(f=>f.id===c.analyst_film_id)?.title} · ${c.analyst_prediction}M</span>
                  <span style={{ fontSize:'12px', color:T.textSub }}>→ {c.analyst_result||'pending'}</span>
                  {!c.analyst_result && <><Btn color={T.green} textColor="#0D0A08" size="sm" onClick={async()=>{await supabase.from('chips').update({analyst_result:'win'}).eq('player_id',c.player_id);notify('Analyst WIN',T.green);loadData()}}>Win</Btn><Btn color={T.red} textColor="#fff" size="sm" onClick={async()=>{await supabase.from('chips').update({analyst_result:'lose'}).eq('player_id',c.player_id);notify('Analyst LOSE',T.red);loadData()}}>Lose</Btn></>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── LAYOUT ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.mono }}>

      {/* TOP BAR */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, height:'72px', display:'flex', alignItems:'center', padding:'0 24px', gap:'16px', position:'sticky', top:0, zIndex:100 }}>
        <div
          onClick={() => !isMobile && setSidebarOpen(o => !o)}
          title={!isMobile ? (sidebarOpen ? 'Hide menu' : 'Show menu') : undefined}
          style={{ fontSize:'32px', fontWeight:900, color:T.gold, letterSpacing:'-2px', userSelect:'none', flexShrink:0, cursor: isMobile?'default':'pointer', lineHeight:1, padding:'6px 10px', borderRadius:'10px', transition:'background .15s', background: (!isMobile && sidebarOpen) ? `${T.gold}15` : 'transparent' }}
        >BOXD</div>

        {!isMobile && (
          <div onClick={() => setSidebarOpen(o => !o)} style={{ fontSize:'12px', color:T.textDim, cursor:'pointer', userSelect:'none', letterSpacing:'0.5px', transition:'color .15s', padding:'4px 8px', borderRadius:'6px', background:T.surfaceUp, border:`1px solid ${T.border}` }}>
            {sidebarOpen ? '← hide' : '→ menu'}
          </div>
        )}

        {win && wMs>0 && (
          <div style={{ background:`${T.orange}18`, border:`1px solid ${T.orange}44`, borderRadius:'9px', padding:'5px 14px', fontSize:'12px', color:T.orange, letterSpacing:'0.5px' }}>
            🔓 {wH}h {wMin}m {wS}s
          </div>
        )}

        <div style={{ marginLeft:'auto', display:'flex', gap:'12px', alignItems:'center' }}>
          {/* Budget pill */}
          <div style={{ background:T.surfaceUp, border:`1px solid ${T.border}`, borderRadius:'12px', padding:'8px 16px' }}>
            <div style={{ fontSize:'10px', color:T.textDim, letterSpacing:'1.5px' }}>PH{ph} BUDGET</div>
            <div style={{ fontSize:'22px', fontWeight:900, color:myBudget<20?T.red:T.green, lineHeight:1.1, fontFamily:T.mono, letterSpacing:'-1px' }}>{cur}{myBudget}M</div>
          </div>

          {pendingForMe.length>0 && (
            <div onClick={() => setPage('trades')} style={{ background:`${T.red}22`, border:`1px solid ${T.red}44`, borderRadius:'10px', padding:'8px 16px', fontSize:'14px', color:T.red, cursor:'pointer', flexShrink:0 }}>
              🔄 {pendingForMe.length}
            </div>
          )}

          {/* Avatar */}
          <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:profile?.color||T.gold, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:900, color:'#0D0A08', cursor:'pointer', flexShrink:0 }}
            onClick={() => goToProfile(players.find(p=>p.id===profile?.id))}>
            {profile?.name?.[0]||'?'}
          </div>

          <button style={{ ...S.btn, background:T.surfaceUp, border:`1px solid ${T.border}`, color:T.textSub, fontSize:'11px', padding:'8px 14px' }} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>

      {/* CONTENT + SIDEBAR */}
      <div style={{ display:'flex', minHeight:'calc(100vh - 72px)' }}>

        {/* DESKTOP SIDEBAR — collapsible via BOXD logo click */}
        {!isMobile && sidebarOpen && (
          <div style={{ width:'220px', background:T.surface, borderRight:`1px solid ${T.border}`, padding:'16px 10px', flexShrink:0, position:'sticky', top:'72px', height:'calc(100vh - 72px)', overflowY:'auto' }}>
            {ALL_PAGES.map(({ id, icon, label }) => (
              <div key={id} onClick={() => setPage(id)} style={{
                display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px',
                borderRadius:'12px', cursor:'pointer', fontSize:'15px', marginBottom:'3px',
                background: page===id ? `${T.gold}18` : 'transparent',
                color:      page===id ? T.gold : T.textSub,
                transition:'all .15s', position:'relative',
              }}>
                <span style={{ fontSize:'20px' }}>{icon}</span>
                <span style={{ fontWeight: page===id ? 600 : 400 }}>{label}</span>
                {id==='trades' && pendingForMe.length>0 && (
                  <span style={{ marginLeft:'auto', background:T.red, color:'#fff', fontSize:'10px', padding:'2px 7px', borderRadius:'10px', fontWeight:700 }}>{pendingForMe.length}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PAGE CONTENT */}
        <div style={{ flex:1, padding:'20px 16px', overflowY:'auto', minWidth:0, paddingBottom: isMobile ? '100px' : '32px' }}>
          {page==='market'       && <MarketPage/>}
          {page==='roster'       && <RosterPage/>}
          {page==='chips'        && <ChipsPage/>}
          {page==='league'       && <LeaguePage/>}
          {page==='feed'         && <FeedPage/>}
          {page==='profile'      && profilePlayer && (
            <PlayerProfilePage
              player={profilePlayer}
              films={films} rosters={rosters} results={results} weeklyG={weeklyG}
              allChips={allChips} auteurDecl={auteurDecl} wwWinners={wwWinners}
              oscarPreds={oscarPreds} calcPoints={calcPoints} calcPhasePoints={calcPhasePoints}
              budgetLeft={budgetLeft} cur={cur} isMobile={isMobile}
              isEarlyBird={isEarlyBird} analystActive={analystOn}
              auteurBonus={auteurOn} shortBonus={shortBonus} wwBonus={wwBonus}
              curPhase_ref={curPhase()}
              onBack={() => { setPage(prevPage); setProfilePlayer(null) }}
            />
          )}
          {page==='trades'       && <TradesPage/>}
          {page==='forecaster'   && <ForecasterPage/>}
          {page==='oscar'        && <OscarPage/>}
          {page==='results'      && <ResultsPage/>}
          {page==='commissioner' && isCommissioner && <CommissionerPage/>}
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:T.surface, borderTop:`1px solid ${T.border}`, display:'flex', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)', backdropFilter:'blur(12px)' }}>
          {BOTTOM_TABS.map(({ id, icon, label }) => {
            const active = page===id
            return (
              <button key={id} onClick={() => { setPage(id); setMoreOpen(false) }} style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
                padding:'14px 2px 12px', background:'none', border:'none', cursor:'pointer',
                color: active ? T.gold : T.textSub, fontFamily:T.mono, transition:'color .15s',
                position:'relative',
              }}>
                {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'32px', height:'3px', background:T.gold, borderRadius:'0 0 4px 4px' }}/>}
                <span style={{ fontSize:'26px', lineHeight:1 }}>{icon}</span>
                <span style={{ fontSize:'12px', fontWeight: active?600:400, letterSpacing:'0.2px' }}>{label}</span>
              </button>
            )
          })}

          {/* More button */}
          <button onClick={() => setMoreOpen(o => !o)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
            padding:'14px 2px 12px', background:'none', border:'none', cursor:'pointer',
            color: moreOpen || !BOTTOM_TABS.find(t=>t.id===page) ? T.gold : T.textSub,
            fontFamily:T.mono, transition:'color .15s', position:'relative',
          }}>
            {(moreOpen || !BOTTOM_TABS.find(t=>t.id===page)) && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'32px', height:'3px', background:T.gold, borderRadius:'0 0 4px 4px' }}/>}
            <span style={{ fontSize:'26px', lineHeight:1 }}>⋯</span>
            <span style={{ fontSize:'12px', letterSpacing:'0.2px' }}>More</span>
          </button>
        </div>
      )}

      {/* MOBILE MORE DRAWER */}
      {isMobile && moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} style={{ position:'fixed', inset:0, background:'#00000066', zIndex:200 }}/>
          <div style={{ position:'fixed', bottom:0, left:0, right:0, background:T.surface, borderTop:`1px solid ${T.border}`, borderRadius:'20px 20px 0 0', zIndex:201, padding:'16px 16px calc(80px + env(safe-area-inset-bottom))', animation:'slideUp .22s ease' }}>
            <div style={{ width:'36px', height:'4px', background:T.border, borderRadius:'2px', margin:'0 auto 20px' }}/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {ALL_PAGES.filter(p => !BOTTOM_TABS.find(t => t.id===p.id)).map(({ id, icon, label }) => (
                <button key={id} onClick={() => { setPage(id); setMoreOpen(false) }} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'7px',
                  padding:'16px 8px', background: page===id ? `${T.gold}18` : T.surfaceUp,
                  border:`1px solid ${page===id ? T.gold+'55' : T.border}`,
                  borderRadius:'13px', cursor:'pointer', fontFamily:T.mono,
                  color: page===id ? T.gold : T.text, position:'relative', transition:'all .15s',
                }}>
                  <span style={{ fontSize:'22px' }}>{icon}</span>
                  <span style={{ fontSize:'12px', fontWeight:500 }}>{label}</span>
                  {id==='trades' && pendingForMe.length>0 && (
                    <span style={{ position:'absolute', top:'8px', right:'8px', background:T.red, color:'#fff', fontSize:'10px', padding:'2px 6px', borderRadius:'9px', fontWeight:700 }}>{pendingForMe.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* NOTIFICATION TOAST */}
      {notif && (
        <div style={{ position:'fixed', bottom: isMobile?'92px':'20px', right:'16px', left: isMobile?'16px':'auto', background:T.surfaceUp, border:`1px solid ${notif.color}55`, borderRadius:'12px', padding:'13px 18px', fontSize:'13px', zIndex:600, maxWidth:'320px', animation:'fadeUp .2s ease', boxShadow:`0 8px 32px ${notif.color}22`, lineHeight:1.5 }}>
          {notif.msg}
        </div>
      )}

      {/* ── MODALS ── */}

      {scoreModal && (
        <ScoreBreakdownModal film={scoreModal.film} holding={scoreModal.holding} results={results} weeklyGrosses={weeklyG} allChips={allChips} auteurDeclarations={auteurDecl} weekendWinners={wwWinners} isEarlyBird={isEarlyBird} onClose={() => setScoreModal(null)}/>
      )}

      {filmDetail && (
        <FilmDetailModal film={filmDetail} profile={profile} players={players} results={results} onClose={() => setFilmDetail(null)}/>
      )}

      {tradeModal && (
        <TradeModal profile={profile} players={players} rosters={rosters} films={films} filmVal={filmVal} curPhase={curPhase} onClose={() => setTradeModal(false)} notify={notify} onDone={() => { setTradeModal(false); loadData(); setPage('trades') }}/>
      )}

      {/* Trailer modal */}
      {trailerFilm && (
        <div style={{ position:'fixed', inset:0, background:'#000000EE', display:'flex', alignItems:'center', justifyContent:'center', zIndex:700, padding:'20px' }} onClick={() => setTrailerFilm(null)}>
          <div style={{ width:'100%', maxWidth:'800px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'14px' }}>
              <div style={{ fontSize:'16px', fontWeight:700 }}>{trailerFilm.title}</div>
              <button style={{ background:'none', border:`1px solid ${T.border}`, color:T.textSub, borderRadius:'8px', padding:'5px 14px', cursor:'pointer', fontFamily:T.mono, fontSize:'12px' }} onClick={() => setTrailerFilm(null)}>✕ Close</button>
            </div>
            <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:'12px' }}>
              <iframe src={`${trailerFilm.trailer}?autoplay=1`} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:'12px' }} allow="autoplay; fullscreen" allowFullScreen/>
            </div>
          </div>
        </div>
      )}

      {/* Add Film modal */}
      {addFilm && (
        <div style={{ position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'center', justifyContent:'center', zIndex:700, padding:'16px' }} onClick={() => setAddFilm(false)}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:'20px', padding:'24px', width:'480px', maxWidth:'96vw', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'18px', fontWeight:800, color:T.green, marginBottom:'20px' }}>+ Add Film</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
              {[['Title','title','text'],['Distributor','dist','text'],['Franchise','franchise','text'],['Star Actor','starActor','text'],['IPO $M','basePrice','number'],['Est $M','estM','number'],['RT%','rt','number'],['Week','week','number'],['Phase','phase','number']].map(([label,field,type])=>(
                <div key={field} style={{ gridColumn:field==='title'||field==='dist'?'1/-1':'auto' }}>
                  <div style={{ ...S.label, marginBottom:'5px' }}>{label}</div>
                  <input type={type} value={newFilm[field]||''} style={S.inp} onChange={e=>setNewFilm(prev=>({...prev,[field]:type==='number'?parseFloat(e.target.value)||'':e.target.value}))}/>
                </div>
              ))}
              <div>
                <div style={{ ...S.label, marginBottom:'5px' }}>Genre</div>
                <select value={newFilm.genre} style={S.inp} onChange={e=>setNewFilm(prev=>({...prev,genre:e.target.value}))}>{Object.keys(GENRE_COL).map(g=><option key={g} value={g}>{g}</option>)}</select>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', paddingTop:'18px' }}>
                <input type="checkbox" checked={newFilm.sleeper} id="sleeper" onChange={e=>setNewFilm(prev=>({...prev,sleeper:e.target.checked}))} style={{ width:'16px', height:'16px' }}/>
                <label htmlFor="sleeper" style={{ fontSize:'13px', color:T.textSub, cursor:'pointer' }}>Sleeper</label>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <div style={{ ...S.label, marginBottom:'5px' }}>Trailer URL</div>
                <input type="text" placeholder="https://youtube.com/embed/…" value={newFilm.trailer} style={S.inp} onChange={e=>setNewFilm(prev=>({...prev,trailer:e.target.value}))}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <Btn onClick={() => setAddFilm(false)} variant="outline" color={T.textSub} sx={{ flex:1 }} size="lg">Cancel</Btn>
              <Btn onClick={() => {
                if(!newFilm.title||!newFilm.dist) return notify('Title and distributor required',T.red)
                const film={...newFilm,id:'f'+Date.now().toString(36),basePrice:Number(newFilm.basePrice)||20,estM:Number(newFilm.estM)||30,rt:newFilm.rt!==''?Number(newFilm.rt):null,week:Number(newFilm.week)||1,phase:Number(newFilm.phase)||1,franchise:newFilm.franchise||null,starActor:newFilm.starActor||null,affiliateUrl:''}
                setFilms(prev=>[...prev,film]); setAddFilm(false); notify(`✅ ${film.title} added`,T.green)
                setNewFilm({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:'',affiliateUrl:''})
              }} color={T.green} textColor="#0D0A08" sx={{ flex:2 }} size="lg">Add Film</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Chip modals */}
      {chipModal && (
        <div style={{ position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:700 }} onClick={() => setChipModal(null)}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:'20px 20px 0 0', padding:'24px', width:'100%', maxWidth:'480px', maxHeight:'88vh', overflowY:'auto', paddingBottom:'calc(24px + env(safe-area-inset-bottom))', animation:'slideUp .22s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ width:'36px', height:'4px', background:T.border, borderRadius:'2px', margin:'0 auto 20px' }}/>

            {chipModal==='short' && (
              <>
                <div style={{ fontSize:'20px', fontWeight:700, color:T.red, marginBottom:'6px' }}>📉 The Short</div>
                <div style={{ fontSize:'13px', color:T.textSub, marginBottom:'20px', lineHeight:1.6 }}>Call a bomb. Under 60% of estimate = +100pts. Hits = −30pts.</div>
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ ...S.label, marginBottom:'6px' }}>Film</div>
                  <select id="short-film" style={S.inp}>{films.filter(f=>!results[f.id]&&!allChips.find(c=>c.short_film_id===f.id)).map(f=><option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>)}</select>
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ ...S.label, marginBottom:'6px' }}>Your Prediction ($M)</div>
                  <input type="number" id="short-pred" placeholder="e.g. 18" style={S.inp}/>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <Btn onClick={() => setChipModal(null)} variant="outline" color={T.textSub} sx={{ flex:1 }} size="lg">Cancel</Btn>
                  <Btn onClick={() => { const fid=document.getElementById('short-film').value, pred=parseFloat(document.getElementById('short-pred').value); activateShort(fid,pred) }} color={T.red} textColor="#fff" sx={{ flex:2 }} size="lg">Confirm Short</Btn>
                </div>
              </>
            )}

            {chipModal==='analyst' && (
              <>
                <div style={{ fontSize:'20px', fontWeight:700, color:T.blue, marginBottom:'6px' }}>🎯 The Analyst</div>
                <div style={{ fontSize:'13px', color:T.textSub, marginBottom:'20px', lineHeight:1.6 }}>Predict opening within 10% on a film you own. Correct = +60pts flat.</div>
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ ...S.label, marginBottom:'6px' }}>Film (must own)</div>
                  <select id="analyst-film" style={S.inp}>{myRoster.filter(r=>!results[r.film_id]&&!allChips.find(c=>c.analyst_film_id===r.film_id)).map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>:null})}</select>
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ ...S.label, marginBottom:'6px' }}>Your Prediction ($M)</div>
                  <input type="number" id="analyst-pred" placeholder="e.g. 92" style={S.inp}/>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <Btn onClick={() => setChipModal(null)} variant="outline" color={T.textSub} sx={{ flex:1 }} size="lg">Cancel</Btn>
                  <Btn onClick={() => { const fid=document.getElementById('analyst-film').value, pred=parseFloat(document.getElementById('analyst-pred').value); if(isNaN(pred)) return notify('Enter a prediction',T.red); activateAnalyst(fid,pred) }} color={T.blue} textColor="#fff" sx={{ flex:2 }} size="lg">Confirm</Btn>
                </div>
              </>
            )}

            {chipModal==='auteur' && (
              <>
                <div style={{ fontSize:'20px', fontWeight:700, color:T.orange, marginBottom:'6px' }}>🎭 The Auteur</div>
                <div style={{ fontSize:'13px', color:T.textSub, marginBottom:'20px', lineHeight:1.6 }}>Declare 2+ films sharing a star actor. Each earns +10% opening pts.</div>
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ ...S.label, marginBottom:'6px' }}>Star Actor</div>
                  <input type="text" value={auteurActor} onChange={e=>setAuteurActor(e.target.value)} placeholder="e.g. Tom Cruise" style={S.inp}/>
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <div style={{ ...S.label, marginBottom:'12px' }}>Select Films (min 2)</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {myRoster.map(r => {
                      const f=films.find(fl=>fl.id===r.film_id); if(!f) return null
                      const checked=auteurFilms.includes(f.id)
                      return (
                        <div key={r.film_id} onClick={() => setAuteurFilms(prev=>prev.includes(f.id)?prev.filter(x=>x!==f.id):[...prev,f.id])}
                          style={{ display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'12px', background:checked?`${T.orange}18`:T.surfaceUp, borderRadius:'11px', border:`1px solid ${checked?T.orange+'55':T.border}`, transition:'all .15s' }}>
                          <FilmPoster film={f} width={28} height={42} radius={5} />
                          <div style={{ width:'20px', height:'20px', borderRadius:'5px', background:checked?T.orange:'transparent', border:`2px solid ${checked?T.orange:T.textDim}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                            {checked && <span style={{ color:'#0D0A08', fontSize:'12px', fontWeight:900 }}>✓</span>}
                          </div>
                          <div>
                            <div style={{ fontSize:'13px', fontWeight:500 }}>{f.title}</div>
                            {f.starActor && <div style={{ fontSize:'11px', color:T.textSub }}>{f.starActor}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <Btn onClick={() => { setChipModal(null); setAuteurActor(''); setAuteurFilms([]) }} variant="outline" color={T.textSub} sx={{ flex:1 }} size="lg">Cancel</Btn>
                  <Btn onClick={() => { if(!auteurActor.trim()) return notify('Enter actor name',T.red); submitAuteur(auteurActor.trim(),auteurFilms) }} color={T.orange} textColor="#0D0A08" sx={{ flex:2 }} size="lg">Declare</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── LOGIN ──────────────────────────────────────────────────────────────────────
function Login() {
  const [email,  setEmail]  = useState('')
  const [sent,   setSent]   = useState(false)
  const [busy,   setBusy]   = useState(false)

  const go = async e => {
    e.preventDefault(); setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo:'https://boxd-league-v2.vercel.app' } })
    if (error) alert(error.message); else setSent(true)
    setBusy(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.mono, padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'320px' }}>
        <div style={{ fontSize:'56px', fontWeight:900, color:T.gold, letterSpacing:'-3px', marginBottom:'6px', lineHeight:1 }}>BOXD</div>
        <div style={{ fontSize:'11px', color:T.textDim, letterSpacing:'3px', marginBottom:'44px' }}>FANTASY BOX OFFICE</div>
        {sent
          ? <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'16px', color:T.text, marginBottom:'8px' }}>Check your email ✉️</div>
              <div style={{ fontSize:'13px', color:T.textSub }}>{email}</div>
            </div>
          : <form onSubmit={go}>
              <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required
                style={{ ...S.inp, marginBottom:'12px', fontSize:'14px', padding:'14px 16px' }}/>
              <button type="submit" disabled={busy}
                style={{ width:'100%', background:T.gold, color:'#0D0A08', border:'none', borderRadius:'10px', padding:'14px', fontSize:'13px', fontWeight:700, cursor:'pointer', letterSpacing:'1px', fontFamily:T.mono }}>
                {busy ? 'SENDING…' : 'SEND MAGIC LINK'}
              </button>
            </form>
        }
      </div>
    </div>
  )
}

// ── CREATE PROFILE ─────────────────────────────────────────────────────────────
function CreateProfile({ session, onCreated, notify }) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState(PLAYER_COLORS[0])
  const [busy,  setBusy]  = useState(false)

  const go = async e => {
    e.preventDefault(); if(!name.trim()) return; setBusy(true)
    const { error } = await supabase.from('profiles').insert({ id:session.user.id, name:name.trim(), color })
    if (error) { notify(error.message, T.red); setBusy(false); return }
    onCreated()
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.mono, padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'320px' }}>
        <div style={{ fontSize:'56px', fontWeight:900, color:T.gold, letterSpacing:'-3px', marginBottom:'6px', lineHeight:1 }}>BOXD</div>
        <div style={{ fontSize:'16px', color:T.text, fontWeight:600, marginBottom:'4px', marginTop:'24px' }}>Create your profile</div>
        <div style={{ fontSize:'13px', color:T.textSub, marginBottom:'28px' }}>{session.user.email}</div>
        <form onSubmit={go}>
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required
            style={{ ...S.inp, marginBottom:'20px', fontSize:'14px', padding:'14px 16px' }}/>
          <div style={{ ...S.label, marginBottom:'12px' }}>Pick your colour</div>
          <div style={{ display:'flex', gap:'12px', marginBottom:'28px' }}>
            {PLAYER_COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width:'34px', height:'34px', borderRadius:'50%', background:c, cursor:'pointer', border:`3px solid ${color===c?'#fff':'transparent'}`, transition:'border .15s', boxSizing:'border-box', flexShrink:0 }}/>
            ))}
          </div>
          <button type="submit" disabled={busy}
            style={{ width:'100%', background:T.gold, color:'#0D0A08', border:'none', borderRadius:'10px', padding:'14px', fontSize:'13px', fontWeight:700, cursor:'pointer', letterSpacing:'1px', fontFamily:T.mono }}>
            {busy ? 'JOINING…' : 'JOIN LEAGUE'}
          </button>
        </form>
      </div>
    </div>
  )
}
