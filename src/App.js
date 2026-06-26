import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const SUPABASE_URL = 'https://yxluqkfanhzktinayvex.supabase.co'
// The client in ./supabase already holds a valid anon key. Reuse it so
// direct Edge Function fetches (ingest, showtimes) authenticate even when
// the REACT_APP_ env var isn't set in Vercel — the empty-string fallback
// was causing "load failed" 401s on every Edge call.
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY
  || supabase?.supabaseKey
  || supabase?.rest?.headers?.apikey
  || ''

const T = {
  bg:'#0D0A08',surface:'#161210',surfaceUp:'#1E1916',
  border:'#2A2420',borderUp:'#382E28',text:'#F2EAE0',
  textSub:'#8A7A6E',textDim:'#46392E',gold:'#E8A020',
  goldSoft:'#E8A02018',green:'#3DD68C',red:'#F04F5A',
  blue:'#4A9EF5',purple:'#B06EF0',orange:'#F08030',
  mono:'"DM Mono","Fira Mono","Courier New",monospace',
}

const GENRE_COL = {
  Action:'#F4845F',Horror:'#B06EF0',Drama:'#74C0FC',Family:'#80ED99',
  'Sci-Fi':'#4DA8FF',Animation:'#FFB040',Comedy:'#F5C842',
  Thriller:'#FF5C8A',Concert:'#FF8C3D',Adventure:'#3DD68C',
}

const COMMISSIONER_EMAIL = 'mattharris2105@gmail.com'
const EARLY_BIRD_WEEKS   = 4
const MAX_ROSTER         = 6
const DRAFT_MIN          = 4
const DRAFT_PENALTY      = 5
const PHASE_BUDGETS      = {1:150,2:180,3:150}
const PHASE_NAMES        = {0:'Historical (Season opener)',1:'Summer (Jun–Aug)',2:'Autumn (Sep–Nov)',3:'Awards & Holiday (Dec–Jan)'}
const ALL_PHASES         = [1,2,3]
const HISTORICAL_PHASE   = 0
// Season anchor: Week 1 = 25 Jun 2026 (live game start)
const SEASON_ANCHOR      = new Date('2026-06-25')
function weekToDate(wk){return new Date(SEASON_ANCHOR.getTime()+(wk-1)*7*86400000)}
// IPO price scales smoothly with the estimated opening — wider spread than
// flat tiers, so every film gets a distinct, estimate-driven price.
// ~$3M at est $2M, ~$7 at $5, ~$15 at $15, ~$30 at $50, ~$59 at $175.
function calcIPOprice(est){
  if(est==null||isNaN(est))return null
  if(est<=0)return 3
  return Math.max(3,Math.min(75,Math.round(1.05*Math.pow(est,0.78))))
}
function dateLabel(wk){const d=weekToDate(wk);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
// TMDB read token lives in an env var, never committed to the repo (GitHub's
// secret scanner flags hardcoded keys). Set REACT_APP_TMDB_TOKEN in Vercel.
// The Edge Functions use their own TMDB_TOKEN secret server-side.
const TMDB_TOKEN         = process.env.REACT_APP_TMDB_TOKEN || ''
// Awin affiliate wrap — earns commission on cinema bookings. Set
// REACT_APP_AWIN_ID (your publisher ID) + per-merchant IDs in Vercel.
// If unset, links pass through untouched so booking always works.
const AWIN_ID            = process.env.REACT_APP_AWIN_ID || ''
const AWIN_MERCHANTS     = {odeon:'',vue:'',cineworld:''} // fill merchant IDs when you have them
function affiliateWrap(url,chainId){
  const mid=AWIN_MERCHANTS[chainId]
  if(!AWIN_ID||!mid)return url
  return `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${AWIN_ID}&ued=${encodeURIComponent(url)}`
}
const EMOJI_OPTIONS      = ['🔥','💀','😂','🎯','📈','📉','👑','💸','🍿','😬']
const PLAYER_COLORS      = ['#E8A020','#3DD68C','#F04F5A','#4A9EF5','#F08030','#B06EF0','#FF5C8A','#74C0FC']

const BOOKING_CHAINS = [
  {id:'odeon',label:'Odeon',url:'https://www.odeon.co.uk/films/',color:'#E8003D'},
  {id:'vue',label:'Vue',url:'https://www.myvue.com/cinema/',color:'#FF6B00'},
  {id:'cineworld',label:'Cineworld',url:'https://www.cineworld.co.uk/',color:'#1D3C6E'},
  {id:'curzon',label:'Curzon',url:'https://www.curzoncinemas.com/',color:'#C8A96E'},
  {id:'picturehouse',label:'Picturehouse',url:'https://www.picturehouses.com/',color:'#E63A2E'},
]

const MARKETING_EVENT_TYPES = [
  {id:'trailer',label:'Trailer Drop',icon:'🎬'},
  {id:'poster',label:'Poster Release',icon:'🖼️'},
  {id:'premiere',label:'Festival Premiere',icon:'🎭'},
  {id:'cast_post',label:'Cast Social Post',icon:'📱'},
  {id:'press',label:'Press Screening',icon:'🎥'},
  {id:'other',label:'Other',icon:'📌'},
]

const BOTTOM_TABS = [
  {id:'market',icon:'🎬',label:'Market'},
  {id:'roster',icon:'📁',label:'Roster'},
  {id:'community',icon:'👥',label:'Community'},
  {id:'league',icon:'🥇',label:'League'},
  {id:'feed',icon:'📡',label:'Feed'},
]

const CHAIN_META = {
  odeon:{color:'#E8003D',bookBase:'https://www.odeon.co.uk/films/'},
  vue:{color:'#FF6B00',bookBase:'https://www.myvue.com/cinema/'},
  cineworld:{color:'#1D3C6E',bookBase:'https://www.cineworld.co.uk/'},
  curzon:{color:'#C8A96E',bookBase:'https://www.curzoncinemas.com/'},
  picturehouse:{color:'#E63A2E',bookBase:'https://www.picturehouses.com/'},
  everyman:{color:'#2E7D32',bookBase:'https://www.everymancinema.com/'},
  empire:{color:'#7B1FA2',bookBase:'https://www.empirecinemas.co.uk/'},
  showcase:{color:'#01579B',bookBase:'https://www.showcasecinemas.co.uk/'},
  indie:{color:'#546E7A',bookBase:''},
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html,body{margin:0;padding:0;background:#0D0A08;overscroll-behavior-y:none;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#2A2420;border-radius:4px;}
  ::-webkit-scrollbar-thumb:hover{background:#382E28;}
  input:focus,select:focus,textarea:focus{outline:none;border-color:#E8A02066 !important;}

  /* Ambient background — changes per phase */
  .ambient-bg{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.5;transition:opacity 1.2s ease, background 1.2s ease;}
  .ambient-p1{background:radial-gradient(ellipse 80% 50% at 20% 10%, #4A9EF515 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 95%, #74C0FC10 0%, transparent 60%);}
  .ambient-p2{background:radial-gradient(ellipse 80% 50% at 20% 10%, #F0803018 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 95%, #F5C84215 0%, transparent 60%);}
  .ambient-p3{background:radial-gradient(ellipse 80% 50% at 20% 10%, #B06EF020 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 95%, #F04F5A12 0%, transparent 60%);}
  .ambient-p4{background:radial-gradient(ellipse 80% 50% at 20% 10%, #E8A02020 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 95%, #B06EF012 0%, transparent 60%);}
  .ambient-p5{background:radial-gradient(ellipse 80% 50% at 20% 10%, #E8A02025 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 95%, #F5C84215 0%, transparent 60%);}

  /* Animations */
  @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(200%);}}
  @keyframes posterFade{from{opacity:0;}to{opacity:1;}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 currentColor;opacity:1;}50%{box-shadow:0 0 0 6px transparent;opacity:0.85;}}
  @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
  @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes bounceIn{0%{opacity:0;transform:scale(0.3);}50%{opacity:1;transform:scale(1.08);}70%{transform:scale(0.96);}100%{transform:scale(1);}}
  @keyframes bloom{0%{transform:scale(1);}40%{transform:scale(1.15);filter:brightness(1.3);}100%{transform:scale(1);}}
  @keyframes confettiFall{0%{transform:translateY(-100vh) rotate(0deg);opacity:1;}100%{transform:translateY(100vh) rotate(720deg);opacity:0;}}
  @keyframes goldGlow{0%,100%{filter:drop-shadow(0 0 0 #E8A02000);}50%{filter:drop-shadow(0 0 12px #E8A02088);}}
  @keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.015);}}
  @keyframes slideInRight{from{opacity:0;transform:translateX(30px);}to{opacity:1;transform:translateX(0);}}
  @keyframes priceUp{0%{color:inherit;text-shadow:none;}30%{color:#3DD68C;text-shadow:0 0 14px #3DD68C88;}100%{color:inherit;text-shadow:none;}}
  @keyframes priceDown{0%{color:inherit;text-shadow:none;}30%{color:#F04F5A;text-shadow:0 0 14px #F04F5A88;}100%{color:inherit;text-shadow:none;}}

  .hoverable{transition:border-color .2s,transform .15s,background .2s,box-shadow .2s;}
  .hoverable:hover{border-color:#382E28 !important;box-shadow:0 8px 28px #00000066;transform:translateY(-2px);}
  .hoverable:active{transform:scale(0.985) translateY(0);opacity:0.95;}
  .pressable{transition:transform .1s ease, opacity .1s ease;}
  .pressable:active{transform:scale(0.94);opacity:0.85;}

  @media(hover:hover){
    .film-card-tilt{transition:transform .25s cubic-bezier(.2,.9,.3,1.2), box-shadow .25s ease;transform-style:preserve-3d;will-change:transform;}
    .film-card-tilt:hover{transform:translateY(-6px) scale(1.02);box-shadow:0 20px 40px #00000088, 0 0 0 1px #E8A02022;}
    .film-card-tilt:hover .poster-shine{opacity:1;}
    .film-card-tilt:hover .film-card-info{transform:translateY(-4px);}
  }
  .film-card-tilt{transform:translateZ(0);}
  .film-card-info{transition:transform .3s ease;}

  .poster-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg, transparent 30%, #E8A02020 48%, #E8A02040 50%, #E8A02020 52%, transparent 70%);transform:translateX(-100%);animation:shine 3s ease-in-out infinite;opacity:0.7;}
  @keyframes shine{0%{transform:translateX(-100%);}60%,100%{transform:translateX(100%);}}

  .glass{backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5);background:rgba(22,18,16,0.65);border:1px solid rgba(255,255,255,0.06);}

  .bloom{animation:bloom .6s ease-out;}
  .gold-glow{animation:goldGlow 2s ease-in-out infinite;}
  .breathe{animation:breathe 3.5s ease-in-out infinite;}
  .bounce-in{animation:bounceIn .4s cubic-bezier(.2,.9,.3,1.3);}

  .skeleton{background:linear-gradient(90deg, #1E1916 0%, #2A2420 50%, #1E1916 100%);background-size:200% 100%;animation:shimmer 1.6s ease-in-out infinite;border-radius:8px;}

  @keyframes tickerScroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}

  button:focus-visible{outline:2px solid #E8A02066;outline-offset:2px;}
  input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #E8A02066;outline-offset:1px;border-color:#E8A02088 !important;}
  @media(min-width:768px){
    .film-grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))!important;}
  }

  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}
    .film-card-tilt:hover{transform:none;}
  }
`

const S = {
  btn:{border:'none',borderRadius:'9px',fontFamily:'"DM Mono","Fira Mono","Courier New",monospace',cursor:'pointer',fontWeight:500,letterSpacing:'0.7px',textTransform:'uppercase',transition:'opacity .15s,transform .15s',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'5px'},
  inp:{background:'#1E1916',border:'1px solid #2A2420',color:'#F2EAE0',borderRadius:'9px',padding:'11px 14px',fontSize:'13px',fontFamily:'"DM Mono","Fira Mono","Courier New",monospace',width:'100%',outline:'none',transition:'border-color .15s'},
  card:{background:'#161210',border:'1px solid #2A2420',borderRadius:'14px',padding:'16px'},
  label:{fontSize:'10px',color:'#46392E',letterSpacing:'1.8px',textTransform:'uppercase',fontWeight:500,fontFamily:'"DM Mono","Fira Mono","Courier New",monospace'},
  pageTitle:{fontSize:'24px',fontWeight:700,color:'#F2EAE0',letterSpacing:'-0.5px',lineHeight:1.2,fontFamily:'"DM Mono","Fira Mono","Courier New",monospace'},
  sectionTitle:{fontSize:'13px',fontWeight:600,color:'#8A7A6E',letterSpacing:'0.3px',fontFamily:'"DM Mono","Fira Mono","Courier New",monospace'},
}

function Btn({children,onClick,color=T.gold,textColor='#0D0A08',variant='solid',size='md',disabled,full,sx={}}){
  const pad=size==='sm'?'8px 14px':size==='lg'?'14px 24px':'10px 18px'
  const fs=size==='sm'?'11px':size==='lg'?'13px':'12px'
  const handleClick=(e)=>{
    if(disabled||!onClick)return
    if(navigator.vibrate)navigator.vibrate(8)
    onClick(e)
  }
  return <button onClick={handleClick} disabled={disabled} className="pressable" style={{...S.btn,padding:pad,fontSize:fs,background:variant==='solid'?color:'transparent',color:variant==='solid'?textColor:color,border:variant==='outline'?`1px solid ${color}55`:'none',opacity:disabled?0.35:1,cursor:disabled?'not-allowed':'pointer',width:full?'100%':undefined,...sx}}>{children}</button>
}
function Badge({children,color=T.gold}){return <span style={{fontSize:'10px',fontWeight:500,color,background:`${color}20`,padding:'2px 8px',borderRadius:'20px',display:'inline-flex',alignItems:'center',gap:'3px',lineHeight:1.5}}>{children}</span>}
function Pill({children,color=T.textSub}){return <span style={{fontSize:'11px',color,background:`${color}18`,padding:'3px 9px',borderRadius:'20px',display:'inline-block',lineHeight:1.4,whiteSpace:'nowrap'}}>{children}</span>}
function Divider({my=12}){return <div style={{height:'1px',background:T.border,margin:`${my}px 0`}}/>}
function StatBox({label,value,color=T.text,sub}){return <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'12px 14px',flex:1,minWidth:0}}><div style={{...S.label,marginBottom:'5px'}}>{label}</div><div style={{fontSize:'22px',fontWeight:700,color,lineHeight:1,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:'11px',color:T.textSub,marginTop:'3px'}}>{sub}</div>}</div>}

function CountUp({value,duration=700,suffix='',prefix='',className='',style={}}){
  const[display,setDisplay]=useState(value)
  const prevRef=useRef(value)
  const rafRef=useRef(null)
  useEffect(()=>{
    const from=prevRef.current,to=value
    if(from===to)return
    const start=performance.now()
    const tick=(now)=>{
      const t=Math.min(1,(now-start)/duration)
      const eased=1-Math.pow(1-t,3)
      const cur=Math.round(from+(to-from)*eased)
      setDisplay(cur)
      if(t<1)rafRef.current=requestAnimationFrame(tick)
      else prevRef.current=to
    }
    rafRef.current=requestAnimationFrame(tick)
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current)}
  },[value,duration])
  return <span className={className} style={style}>{prefix}{display}{suffix}</span>
}

function ConfettiBurst({active,colors=['#E8A020','#3DD68C','#F5C842','#F08030']}){
  if(!active)return null
  const pieces=Array.from({length:30},(_,i)=>({
    id:i,
    left:Math.random()*100,
    delay:Math.random()*0.4,
    dur:1.4+Math.random()*1.2,
    color:colors[i%colors.length],
    size:6+Math.random()*6,
  }))
  return(
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999,overflow:'hidden'}}>
      {pieces.map(p=>(
        <div key={p.id} style={{
          position:'absolute',
          left:`${p.left}%`,
          top:'-20px',
          width:`${p.size}px`,
          height:`${p.size*1.5}px`,
          background:p.color,
          borderRadius:'2px',
          animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
        }}/>
      ))}
    </div>
  )
}

function Skeleton({width,height,radius=8,style={}}){
  const w=typeof width==='number'?`${width}px`:width
  const h=typeof height==='number'?`${height}px`:height
  return <div className="skeleton" style={{width:w,height:h,borderRadius:radius,...style}}/>
}

function PageSkeleton(){
  return(
    <div style={{animation:'fadeIn .3s ease'}}>
      <Skeleton width="40%" height={26} style={{marginBottom:14}}/>
      <Skeleton width="60%" height={14} style={{marginBottom:24}}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
        {[1,2,3,4,5,6].map(i=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,overflow:'hidden'}}>
            <Skeleton width="100%" height={200} radius={0}/>
            <div style={{padding:12}}>
              <Skeleton width="80%" height={14} style={{marginBottom:8}}/>
              <Skeleton width="60%" height={11} style={{marginBottom:12}}/>
              <Skeleton width="100%" height={36}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const haptic={
  tap:()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch{}},
  success:()=>{try{navigator.vibrate&&navigator.vibrate([15,30,15])}catch{}},
  warn:()=>{try{navigator.vibrate&&navigator.vibrate([30,50,30])}catch{}},
}

const posterCache = {}
async function fetchTMDBPoster(title,tmdbId){
  const key = tmdbId?`id:${tmdbId}`:title
  if(posterCache[key]!==undefined) return posterCache[key]
  posterCache[key]=null
  if(!TMDB_TOKEN) return null // no client token set — FilmPoster shows its gradient fallback
  if(tmdbId){
    try{
      const res=await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?language=en-US`,{headers:{Authorization:`Bearer ${TMDB_TOKEN}`}})
      if(res.ok){const data=await res.json();if(data.poster_path){posterCache[key]=`https://image.tmdb.org/t/p/w342${data.poster_path}`;return posterCache[key]}}
    }catch{}
  }
  const queries=[title,title.replace(/\s*\(.*?\)\s*/g,'').trim(),title.split(':')[0].trim(),title.replace(/[^a-zA-Z0-9\s]/g,'').trim()].filter((q,i,a)=>q&&a.indexOf(q)===i)
  for(const q of queries){
    try{
      const res=await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&language=en-US&page=1&include_adult=false`,{headers:{Authorization:`Bearer ${TMDB_TOKEN}`}})
      if(!res.ok) continue
      const data=await res.json()
      const hit=(data.results||[]).find(r=>r.poster_path)
      if(hit?.poster_path){posterCache[key]=`https://image.tmdb.org/t/p/w342${hit.poster_path}`;return posterCache[key]}
    }catch{}
  }
  return null
}

function FilmPoster({film,width,height,radius=8,imgStyle={},owned=false,scored=false,tilt=false}){
  const key=film?.tmdbId?`id:${film.tmdbId}`:film?.title
  // If no TMDB token is configured, there's nothing to fetch — resolve to the
  // fallback immediately so cards don't flash a loading shimmer on every render.
  const initial=!TMDB_TOKEN?null:(posterCache[key]!==undefined?posterCache[key]:undefined)
  const [url,setUrl]=useState(initial)
  const gc=GENRE_COL[film?.genre]||T.textSub
  const containerRef=useRef(null)
  useEffect(()=>{
    if(!TMDB_TOKEN){setUrl(null);return}
    if(!film?.title){setUrl(null);return}
    if(posterCache[key]!==undefined){setUrl(posterCache[key]);return}
    let cancelled=false
    fetchTMDBPoster(film.title,film.tmdbId).then(u=>{if(!cancelled)setUrl(u)})
    return()=>{cancelled=true}
  },[film?.title,film?.tmdbId])
  const onMouseMove=tilt?(e)=>{
    const el=containerRef.current;if(!el)return
    const r=el.getBoundingClientRect()
    const x=(e.clientX-r.left)/r.width-0.5
    const y=(e.clientY-r.top)/r.height-0.5
    el.style.transform=`perspective(600px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateZ(4px)`
  }:undefined
  const onMouseLeave=tilt?()=>{
    const el=containerRef.current;if(!el)return
    el.style.transform='perspective(600px) rotateY(0) rotateX(0) translateZ(0)'
  }:undefined
  const w=typeof width==='number'?`${width}px`:width
  const h=typeof height==='number'?`${height}px`:height
  return(
    <div ref={containerRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} style={{width:w,height:h,borderRadius:radius,flexShrink:0,overflow:'hidden',position:'relative',contain:'strict',transform:'translateZ(0)',isolation:'isolate',transition:tilt?'transform .2s ease':'none',willChange:tilt?'transform':'auto'}}>
      {(url===undefined||url===null)&&<div style={{position:'absolute',inset:0,background:`linear-gradient(145deg,${gc}28 0%,${T.surfaceUp} 100%)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5}}><div style={{fontSize:typeof width==='number'?Math.max(16,width*0.28):20,lineHeight:1}}>🎬</div><div style={{fontSize:'9px',color:gc,textAlign:'center',padding:'0 6px',lineHeight:1.2}}>{film?.genre}</div></div>}
      {url&&<img src={url} alt={film?.title} loading="lazy" decoding="async" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',display:'block',animation:'posterFade .3s ease',...imgStyle}} onError={()=>setUrl(null)}/>}
      {owned&&url&&<div className="poster-shine"/>}
      {scored&&url&&<div style={{position:'absolute',inset:0,background:`linear-gradient(to top, ${T.green}44, transparent 60%)`,pointerEvents:'none'}}/>}
    </div>
  )
}

function calcMarketValue(film,actualM,weeklyGrosses={}){
  if(actualM==null) return film.basePrice
  const r=film.estM?actualM/film.estM:1
  // Opening performance multiplier
  const perf=r>=2?2:r>=1.5?1.6:r>=1.3?1.35:r>=1.1?1.15:r>=0.95?1:r>=0.8?0.85:r>=0.6?0.65:r>=0.4?0.45:0.25
  // Critics multiplier
  const rt=film.rt!=null?(film.rt>=90?1.15:film.rt>=75?1.08:film.rt<50?0.9:1):1

  // ── LEGS: week-on-week hold vs an expected drop ──────────────────────────
  // Each week has a "standard" drop. Beating it lifts value, missing it cuts.
  // Bands (drop is negative; e.g. -0.55 = a 55% fall from prior week):
  //   Wk2: standard -55% · better → up to +30% · worse → down to -15%
  //   Wk3: standard -40% · better → up to +20% · worse → down to -10%
  //   Wk4: standard -35% · better → up to +15% · worse → down to  -5%
  //   Wk5/6: standard -40% · better → up to +10% · worse → flat (0%)
  const BANDS={
    2:{std:-0.55,up:0.30,down:-0.15},
    3:{std:-0.40,up:0.20,down:-0.10},
    4:{std:-0.35,up:0.15,down:-0.05},
    5:{std:-0.40,up:0.10,down:0},
    6:{std:-0.40,up:0.10,down:0},
  }
  const wg=weeklyGrosses||{}
  let legsMult=1
  for(let w=2;w<=6;w++){
    const cur=Number(wg[w]),prev=w===2?actualM:Number(wg[w-1])
    if(!cur||!prev||isNaN(cur)||isNaN(prev))continue
    const drop=(cur-prev)/prev          // e.g. -0.5 means it fell 50%
    const band=BANDS[w]
    // How much better/worse than the standard drop? Scale into the band.
    // If drop is exactly std → 0 adjustment. Held flat (drop=0) → full "up".
    // Dropped twice as hard as std → full "down".
    let adj
    if(drop>=band.std){
      // better than expected (smaller drop or a rise)
      const range=0-band.std            // distance from std to "held flat"
      const frac=range>0?Math.min(1,(drop-band.std)/range):0
      adj=band.up*frac
    }else{
      // worse than expected (bigger drop)
      const range=band.std-(-1)         // distance from std down to -100%
      const frac=range>0?Math.min(1,(band.std-drop)/range):0
      adj=band.down*frac
    }
    legsMult*=(1+adj)
  }

  const raw=film.basePrice*perf*rt*legsMult
  return Math.round(Math.max(film.basePrice*0.15,Math.min(film.basePrice*4,raw)))
}
function calcOpeningPts(film,actualM,isEB=false,isAnalyst=false){
  if(actualM==null) return 0
  const r=actualM/film.estM
  const perf=r>=2?2:r>=1.5?1.6:r>=1.3?1.35:r>=1.1?1.15:r>=0.95?1:r>=0.8?0.85:r>=0.6?0.65:0.45
  const rt=film.rt!=null?(film.rt>=90?1.25:film.rt>=75?1.1:film.rt<50?0.85:1):1
  let pts=Math.round(actualM*perf*rt)
  if(isEB&&r>=1.1) pts=Math.round(pts*1.1)
  if(isAnalyst) pts+=60
  return pts
}
function calcLegsBonus(actualM,week2Gross){return(actualM!=null&&week2Gross!=null&&(actualM-week2Gross)/actualM<0.3)?25:0}
function calcWeeklyPts(weekMap){return Object.entries(weekMap).reduce((s,[wk,g])=>s+Number(g)*(Number(wk)>=4?1.1:1),0)}

// PERF: memo wrapper for calcBuzzIndex — caches by film.id+allPicks.length+rosters.length
const _buzzCache=new Map()
function calcBuzzIndex(film,allPicks=[],news=[],rosters=[],totalPlayers=0,currentWeek=null,priceNow=null){
  if(film.hasResult)return null
  const cacheKey=`${film.id}|${allPicks.length}|${rosters.length}|${totalPlayers}|${currentWeek}`
  if(_buzzCache.has(cacheKey))return _buzzCache.get(cacheKey)
  const cutoff14=Date.now()-14*86400000
  const recentPicks=allPicks.filter(p=>p.film_id===film.id&&new Date(p.picked_at).getTime()>cutoff14).length
  const watchScore=Math.min(100,(recentPicks/Math.max(1,totalPlayers))*150)
  let ownerScore=0
  if(totalPlayers>0){
    const owners=rosters.filter(r=>r.film_id===film.id&&r.active).length
    ownerScore=Math.min(100,(owners/totalPlayers)*150)
  }
  let timeScore=50
  if(currentWeek!=null&&film.week!=null){
    const weeksOut=film.week-currentWeek
    timeScore=weeksOut<=0?100:weeksOut===1?85:weeksOut<=2?70:weeksOut<=4?55:weeksOut<=6?40:25
  }
  // Buzz = 40% watchlist heat, 30% ownership, 30% time pressure
  const composite=watchScore*0.40+ownerScore*0.30+timeScore*0.30
  const result=Math.round(composite)
  if(_buzzCache.size>500)_buzzCache.clear()
  _buzzCache.set(cacheKey,result)
  return result
}

function calcPriceDrivers(film,rosters,phase,totalPlayers,currentWeek,filmNews=[],allPicks=[]){
  let ownershipMult=1
  if(totalPlayers>0){
    const owners=rosters.filter(r=>r.film_id===film.id&&r.phase===phase&&r.active).length
    const pct=owners/totalPlayers
    // Ownership is a DEMAND signal only (never discounts). BUT in small leagues
    // a single owner is a huge % and would wildly inflate price — so the effect
    // scales with league size ("confidence"): near-zero for tiny leagues,
    // full strength at 12+ players. This stops 2-3 person leagues spiking.
    const confidence=Math.min(1,totalPlayers/12)
    const rawLift=pct>=0.7?0.30:pct>=0.55?0.22:pct>=0.40?0.15:pct>=0.25?0.08:0
    ownershipMult=1+rawLift*confidence
  }
  // Time-to-release multiplier:
  // 6+ weeks out: -15% (early discovery discount)
  // 5 weeks:      -10%
  // 4 weeks:       -5%
  // 3 weeks:         0% (fair value)
  // 2 weeks:        +3%
  // 1 week:         +7%
  // Release week:  +10%
  // Post-release:   -5% (results already in, no more anticipation premium)
  let timeMult=1
  if(currentWeek!=null&&film.week!=null){
    const weeksOut=film.week-currentWeek
    // Note: released films never use this multiplier — their price comes from
    // box office + legs (calcMarketValue). The final branch is the release week
    // peak (+10%); there is no post-release discount.
    timeMult=weeksOut>=6?0.85:weeksOut===5?0.90:weeksOut===4?0.95:weeksOut===3?1.00:weeksOut===2?1.03:weeksOut===1?1.07:1.10
  }
  const rtMult=film.rt!=null
    ?(film.rt>=90?1.15:film.rt>=80?1.08:film.rt>=70?1.03:film.rt>=55?1.00:film.rt>=40?0.93:0.85)
    :1.0
  let buzzMult=1
  if(allPicks.length&&totalPlayers>0){
    const cutoff=Date.now()-7*86400000
    const recentWatch=allPicks.filter(p=>p.film_id===film.id&&new Date(p.picked_at).getTime()>cutoff).length
    const intensity=recentWatch/Math.max(1,totalPlayers)
    buzzMult=intensity>=0.8?1.06:intensity>=0.5?1.03:intensity>=0.25?1.01:1.00
  }
  return{ownershipMult,timeMult,rtMult,buzzMult}
}

function calcDemandMult(film,rosters,phase,totalPlayers,currentWeek=null,allPicks=[]){
  if(film.hasResult)return 1
  const d=calcPriceDrivers(film,rosters,phase,totalPlayers,currentWeek,[],allPicks)
  const composite=d.ownershipMult*d.timeMult*d.rtMult*d.buzzMult
  return Math.round(composite*100)/100
}

function timeAgo(ts){
  const d=Date.now()-new Date(ts).getTime()
  const m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000)
  return d<60000?'just now':m<60?`${m}m`:h<24?`${h}h`:`${dy}d`
}
function pickVelocity(filmId,allPicks,days=7){
  const cutoff=Date.now()-days*86400000
  return allPicks.filter(p=>p.film_id===filmId&&new Date(p.picked_at).getTime()>cutoff).length
}

async function dbUpsert(table,col,val,data){
  const{data:ex}=await supabase.from(table).select(col).eq(col,val)
  if(ex?.length) return supabase.from(table).update(data).eq(col,val)
  return supabase.from(table).insert({[col]:val,...data})
}
async function dbUpsertWeekly(filmId,wk,g){
  const{data:ex}=await supabase.from('weekly_grosses').select('id').eq('film_id',filmId).eq('week_num',wk)
  if(ex?.length) return supabase.from('weekly_grosses').update({gross_m:g}).eq('film_id',filmId).eq('week_num',wk)
  return supabase.from('weekly_grosses').insert({film_id:filmId,week_num:wk,gross_m:g})
}
async function logActivity(uid,type,payload,leagueId){
  try{await supabase.from('activity_feed').insert({user_id:uid,type,payload,league_id:leagueId||null})}catch{}
}

async function sendNotification(type,payload){
  try{
    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${SUPABASE_ANON_KEY}`},
      body:JSON.stringify({type,payload})
    })
  }catch{}
}

function WindowTimer({openedAt,short}){
  const[,tick]=useState(0)
  useEffect(()=>{const t=setInterval(()=>tick(n=>n+1),1000);return()=>clearInterval(t)},[])
  if(!openedAt) return null
  const ms=Math.max(0,72*3600000-(Date.now()-new Date(openedAt).getTime()))
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000)
  return <span>{short?`${h}h ${m}m`:`${h}h ${m}m ${s}s`}</span>
}
function DraftTimer({deadline,shortfall,draftMin}){
  const[,tick]=useState(0)
  useEffect(()=>{const t=setInterval(()=>tick(n=>n+1),1000);return()=>clearInterval(t)},[])
  if(!deadline) return null
  const ms=Math.max(0,new Date(deadline).getTime()-Date.now())
  const done=ms===0
  const days=Math.floor(ms/86400000),hours=Math.floor((ms%86400000)/3600000)
  const mins=Math.floor((ms%3600000)/60000),secs=Math.floor((ms%60000)/1000)
  const urgent=ms<48*3600000
  const color=done?'#666':urgent?T.red:shortfall>0?T.orange:T.green
  const display=done?'Expired':days>0?`${days}d ${hours}h ${mins}m`:`${hours}h ${mins}m ${secs}s`
  return(
    <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',gap:'1px'}}>
      <span style={{fontFamily:T.mono,fontWeight:900,color,letterSpacing:'-0.5px',lineHeight:1}}>{display}</span>
      {shortfall>0&&!done&&<span style={{fontSize:'10px',color,opacity:0.85}}>pick {shortfall} more</span>}
    </div>
  )
}

function PickButton({filmId,userId,allPicks,onToggle,size='sm'}){
  const isPicked=allPicks.some(p=>p.film_id===filmId&&p.user_id===userId)
  const count=allPicks.filter(p=>p.film_id===filmId).length
  const[popping,setPopping]=useState(false)
  const handle=async(e)=>{e.stopPropagation();setPopping(true);setTimeout(()=>setPopping(false),350);await onToggle(filmId,isPicked)}
  return(
    <button onClick={handle} style={{display:'flex',alignItems:'center',gap:'4px',background:isPicked?`${T.gold}22`:T.surfaceUp,border:`1px solid ${isPicked?T.gold+'66':T.border}`,borderRadius:'20px',padding:size==='sm'?'5px 10px':'7px 14px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px',color:isPicked?T.gold:T.textSub,transition:'all .15s',fontWeight:isPicked?600:400}}>
      <span style={{fontSize:'14px',lineHeight:1}}>{isPicked?'👁️':'👁'}</span>
      {count>0&&<span>{count}</span>}
    </button>
  )
}

function VelocitySparkline({filmId,allPicks,marketingEvents=[],width=200,height=50}){
  const now=Date.now(),days=30
  const buckets=Array.from({length:days},(_,i)=>{
    const dayStart=now-(days-1-i)*86400000
    return allPicks.filter(p=>{if(p.film_id!==filmId)return false;const t=new Date(p.picked_at).getTime();return t>=dayStart-86400000&&t<dayStart}).length
  })
  const max=Math.max(1,...buckets)
  const pts=buckets.map((c,i)=>`${(i/(days-1))*width},${height-(c/max)*(height-6)}`).join(' ')
  const evs=(marketingEvents||[]).filter(e=>e.film_id===filmId)
  return(
    <svg width={width} height={height} style={{overflow:'visible',display:'block'}}>
      <polyline points={pts} fill="none" stroke={T.gold} strokeWidth="2" strokeLinejoin="round" opacity="0.85"/>
      {evs.map((ev,i)=>{
        const daysAgo=(now-new Date(ev.event_date).getTime())/86400000
        if(daysAgo<0||daysAgo>days) return null
        const x=((days-daysAgo)/(days-1))*width
        const evType=MARKETING_EVENT_TYPES.find(t=>t.id===ev.event_type)
        return <g key={i}><line x1={x} y1={0} x2={x} y2={height} stroke={T.blue} strokeWidth="1" strokeDasharray="3,2" opacity="0.7"/><text x={x+2} y={10} fill={T.blue} fontSize="9" fontFamily={T.mono}>{evType?.icon}</text></g>
      })}
    </svg>
  )
}

function PriceSparkline({film,rosters,filmValues,width=60,height=20}){
  const filmR=rosters.filter(r=>r.film_id===film.id&&r.bought_price)
  const ipo=film.basePrice,cur=filmValues[film.id]||ipo
  if(!filmR.length){
    const col=cur>ipo?T.green:cur<ipo?T.red:T.textDim
    return <svg width={width} height={height} style={{overflow:'visible'}}><line x1={0} y1={height/2} x2={width} y2={height/2} stroke={col} strokeWidth="1.5" opacity="0.6"/></svg>
  }
  const byWeek={}
  filmR.forEach(r=>{const wk=r.bought_week||1;if(!byWeek[wk]||r.bought_price>byWeek[wk])byWeek[wk]=r.bought_price})
  const wks=Object.keys(byWeek).map(Number).sort((a,b)=>a-b)
  const series=[{p:ipo},...wks.map(w=>({p:byWeek[w]})),{p:cur}]
  const prices=series.map(s=>s.p),mn=Math.min(...prices),mx=Math.max(...prices),range=mx-mn||1
  const pts=series.map((s,i)=>{
    const x=(i/(series.length-1))*width
    const y=height-4-((s.p-mn)/range)*(height-8)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const col=cur>ipo?T.green:cur<ipo?T.red:T.textDim
  return <svg width={width} height={height} style={{overflow:'visible'}}><polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round" opacity="0.9"/></svg>
}

// ── EMBED WIDGET — compact anticipation badge for distributor/cinema sites ──
// Usage: <iframe src="https://boxd-league-v2.vercel.app/?embed=FILM_ID" .../>
function EmbedWidget({filmId}){
  const[data,setData]=useState(null)
  useEffect(()=>{(async()=>{
    const{data:f}=await supabase.from('films').select('*').eq('id',filmId).maybeSingle()
    if(!f){setData({notfound:true});return}
    const[{data:pk},{data:fc}]=await Promise.all([
      supabase.from('picks').select('id').eq('film_id',filmId),
      supabase.from('forecasts').select('predicted_m').eq('film_id',filmId),
    ])
    const fcN=(fc||[]).map(x=>Number(x.predicted_m)).filter(n=>!isNaN(n)).sort((a,b)=>a-b)
    const median=fcN.length?fcN[Math.floor(fcN.length/2)]:null
    setData({title:f.title,watchers:(pk||[]).length,forecast:median,rt:f.rt})
  })()},[filmId])
  const box=(c)=>(<div style={{fontFamily:'-apple-system,sans-serif',background:'#0D0A08',color:'#F2EAE0',borderRadius:'12px',padding:'16px',maxWidth:'280px',border:'1px solid #2A2420'}}>{c}</div>)
  if(!data)return box(<div style={{color:'#8A7A6E',fontSize:'13px'}}>Loading…</div>)
  if(data.notfound)return box(<div style={{color:'#8A7A6E',fontSize:'13px'}}>Film not found</div>)
  return box(<>
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
      <span style={{fontWeight:900,color:'#E8A020',fontSize:'16px',letterSpacing:'-0.5px'}}>BOXD</span>
      <span style={{fontSize:'9px',color:'#46392E',letterSpacing:'1px'}}>AUDIENCE BUZZ</span>
    </div>
    <div style={{fontSize:'15px',fontWeight:700,marginBottom:'10px'}}>{data.title}</div>
    <div style={{display:'flex',gap:'14px'}}>
      <div><div style={{fontSize:'20px',fontWeight:800,color:'#E8A020'}}>{data.watchers}</div><div style={{fontSize:'9px',color:'#8A7A6E'}}>WATCHING</div></div>
      {data.forecast!=null&&<div><div style={{fontSize:'20px',fontWeight:800,color:'#4A9EF5'}}>${data.forecast}M</div><div style={{fontSize:'9px',color:'#8A7A6E'}}>FORECAST</div></div>}
      {data.rt!=null&&<div><div style={{fontSize:'20px',fontWeight:800,color:data.rt>=60?'#3DD68C':'#F04F5A'}}>{data.rt}%</div><div style={{fontSize:'9px',color:'#8A7A6E'}}>CRITICS</div></div>}
    </div>
    <a href="https://boxd-league-v2.vercel.app" target="_blank" rel="noopener noreferrer" style={{display:'block',marginTop:'12px',fontSize:'10px',color:'#46392E',textDecoration:'none'}}>Powered by BOXD ↗</a>
  </>)
}

// ── DISTRIBUTOR PORTAL — gated read-only view via ?distributor=CODE ───────
function DistributorPortal({code}){
  const[state,setState]=useState('loading')
  const[access,setAccess]=useState(null)
  const[films,setFilms]=useState([])
  const[picks,setPicks]=useState([])
  const[results,setResults]=useState({})
  const[bookings,setBookings]=useState([])
  const[forecasts,setForecasts]=useState([])
  const[selFilm,setSelFilm]=useState(null)
  useEffect(()=>{(async()=>{
    const{data:acc}=await supabase.from('distributor_access').select('*').eq('access_code',code).eq('active',true).maybeSingle()
    if(!acc){setState('denied');return}
    setAccess(acc)
    const{data:fs}=await supabase.from('films').select('*').eq('dist',acc.distributor)
    const filmIds=(fs||[]).map(f=>f.id)
    const[{data:pk},{data:rs},{data:bk},{data:fc}]=await Promise.all([
      supabase.from('picks').select('*').in('film_id',filmIds.length?filmIds:['_']),
      supabase.from('results').select('*').in('film_id',filmIds.length?filmIds:['_']),
      supabase.from('booking_clicks').select('*').in('film_id',filmIds.length?filmIds:['_']),
      supabase.from('forecasts').select('*').in('film_id',filmIds.length?filmIds:['_']),
    ])
    setFilms((fs||[]).map(f=>({...f,basePrice:f.base_price,estM:f.est_m,starActor:f.star_actor})))
    setPicks(pk||[]);setBookings(bk||[]);setForecasts(fc||[])
    const rmap={};(rs||[]).forEach(r=>rmap[r.film_id]=r.actual_m);setResults(rmap)
    setState('ok')
  })()},[code])

  if(state==='loading')return <PortalShell><div style={{textAlign:'center',padding:'60px',color:T.textSub}}>Loading…</div></PortalShell>
  if(state==='denied')return <PortalShell><div style={{textAlign:'center',padding:'60px'}}><div style={{fontSize:'40px',marginBottom:'12px'}}>🔒</div><div style={{fontSize:'16px',color:T.text,fontWeight:700}}>Invalid or expired access code</div><div style={{fontSize:'12px',color:T.textSub,marginTop:'8px'}}>Contact the league commissioner for a valid link.</div></div></PortalShell>

  const totalWatchers=picks.length
  const totalBookings=bookings.length
  const released=films.filter(f=>results[f.id]!=null)
  const f=selFilm?films.find(x=>x.id===selFilm):null

  if(f){
    const fp=picks.filter(p=>p.film_id===f.id)
    const fc=forecasts.filter(x=>x.film_id===f.id).map(x=>Number(x.predicted_m)).filter(n=>!isNaN(n)).sort((a,b)=>a-b)
    const median=fc.length?fc[Math.floor(fc.length/2)]:null
    const clicks=bookings.filter(b=>b.film_id===f.id).length
    const actual=results[f.id]
    return(
      <PortalShell access={access}>
        <button onClick={()=>setSelFilm(null)} style={{background:'none',border:'none',color:T.blue,fontSize:'13px',cursor:'pointer',padding:'0 0 14px',fontWeight:600}}>‹ All films</button>
        <div style={{fontSize:'22px',fontWeight:800,color:T.text,marginBottom:'4px'}}>{f.title}</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'18px'}}>{f.genre} · releases week {f.week}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'10px',marginBottom:'20px'}}>
          <PortalStat label="Watchlist adds" value={fp.length}/>
          <PortalStat label="Booking clicks" value={clicks}/>
          <PortalStat label="Crowd forecast" value={median!=null?`$${median}M`:'—'}/>
          {f.estM!=null&&<PortalStat label="Tracking est" value={`$${f.estM}M`}/>}
          {actual!=null&&<PortalStat label="Actual opening" value={`$${actual}M`} accent/>}
        </div>
        {median!=null&&actual!=null&&(
          <div style={{background:T.surface,borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.blue}}>Crowd forecast accuracy</div>
            <div style={{fontSize:'13px',color:T.text}}>The audience predicted <strong style={{color:T.gold}}>${median}M</strong> vs actual <strong style={{color:T.green}}>${actual}M</strong> — within <strong>{Math.round(Math.abs(median-actual)/actual*100)}%</strong>.</div>
          </div>
        )}
        <div style={{fontSize:'10px',color:T.textDim,marginTop:'20px'}}>BOXD intent data · {access.distributor} · confidential</div>
      </PortalShell>
    )
  }

  return(
    <PortalShell access={access}>
      <div style={{fontSize:'22px',fontWeight:800,color:T.text,marginBottom:'4px'}}>{access.distributor}</div>
      <div style={{fontSize:'12px',color:T.textSub,marginBottom:'18px'}}>Audience intent across your {films.length}-film slate</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'10px',marginBottom:'24px'}}>
        <PortalStat label="Films tracked" value={films.length}/>
        <PortalStat label="Total watchers" value={totalWatchers}/>
        <PortalStat label="Booking clicks" value={totalBookings}/>
        <PortalStat label="Released" value={released.length}/>
      </div>
      <div style={{...S.label,marginBottom:'10px',color:T.blue}}>Slate — tap for detail</div>
      {films.sort((a,b)=>a.week-b.week).map(film=>{
        const w=picks.filter(p=>p.film_id===film.id).length
        return(
          <div key={film.id} onClick={()=>setSelFilm(film.id)} style={{display:'flex',gap:'10px',alignItems:'center',background:T.surface,borderRadius:'10px',padding:'10px 12px',marginBottom:'6px',cursor:'pointer',border:`1px solid ${T.border}`}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'13px',fontWeight:600,color:T.text}}>{film.title}</div>
              <div style={{fontSize:'10px',color:T.textSub}}>Week {film.week}{results[film.id]!=null?` · opened $${results[film.id]}M`:''}</div>
            </div>
            <span style={{fontSize:'11px',color:T.gold,fontFamily:T.mono}}>👁 {w}</span>
            <span style={{color:T.textDim}}>›</span>
          </div>
        )
      })}
      <div style={{fontSize:'10px',color:T.textDim,marginTop:'20px'}}>Powered by BOXD · audience intent analytics · confidential</div>
    </PortalShell>
  )
}
function PortalShell({children,access}){
  return(
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.mono,padding:'24px 16px'}}>
      <div style={{maxWidth:'600px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'24px',paddingBottom:'16px',borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:'24px',fontWeight:900,color:T.gold,letterSpacing:'-1px'}}>BOXD</div>
          <div style={{fontSize:'10px',color:T.textDim,letterSpacing:'2px',borderLeft:`1px solid ${T.border}`,paddingLeft:'10px'}}>DISTRIBUTOR INTELLIGENCE</div>
        </div>
        {children}
      </div>
    </div>
  )
}
function PortalStat({label,value,accent}){
  return(
    <div style={{background:accent?`${T.green}12`:T.surface,borderRadius:'10px',padding:'12px',textAlign:'center',border:`1px solid ${accent?T.green+'33':T.border}`}}>
      <div style={{fontSize:'20px',fontWeight:800,color:accent?T.green:T.gold,fontFamily:T.mono}}>{value}</div>
      <div style={{fontSize:'9px',color:T.textSub,marginTop:'2px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
    </div>
  )
}

function InviteLanding({code,onLogin}){
  const[lgData,setLgData]=useState(null)
  const[loading,setLoading]=useState(true)
  useEffect(()=>{
    supabase.from('leagues').select('*').eq('invite_code',code).maybeSingle().then(({data})=>{setLgData(data);setLoading(false)})
  },[code])
  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:T.mono,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:'440px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontSize:'52px',fontWeight:900,color:T.gold,letterSpacing:'-2px',lineHeight:1,marginBottom:'6px'}}>BOXD</div>
          <div style={{fontSize:'11px',color:T.textDim,letterSpacing:'3px'}}>FANTASY BOX OFFICE</div>
        </div>
        {loading?<div style={{textAlign:'center',color:T.textSub}}>Loading…</div>:(
          lgData?(
            <div>
              <div style={{background:`linear-gradient(135deg,${T.gold}14,${T.surface})`,border:`1px solid ${T.gold}44`,borderRadius:'20px',padding:'28px 24px',marginBottom:'20px',textAlign:'center'}}>
                <div style={{fontSize:'32px',marginBottom:'12px'}}>🎬</div>
                <div style={{fontSize:'13px',color:T.gold,fontWeight:700,letterSpacing:'2px',marginBottom:'8px',textTransform:'uppercase'}}>You're invited to join</div>
                <div style={{fontSize:'26px',fontWeight:800,color:T.text,marginBottom:'6px'}}>{lgData.name}</div>
                <div style={{fontSize:'12px',color:T.textSub,marginBottom:'20px'}}>Pick films · Score pts · Beat your league</div>
                <div style={{display:'flex',gap:'16px',justifyContent:'center',marginBottom:'20px'}}>
                  {[['5','Phases'],['6','Films/Phase'],['4','Chips']].map(([n,l])=>(
                    <div key={l} style={{textAlign:'center'}}>
                      <div style={{fontSize:'22px',fontWeight:900,color:T.gold,fontFamily:T.mono}}>{n}</div>
                      <div style={{fontSize:'10px',color:T.textSub,marginTop:'2px'}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:T.textSub,marginBottom:'16px'}}>
                  Invite code: <span style={{color:T.gold,fontWeight:700,letterSpacing:'2px'}}>{code}</span>
                </div>
                <button onClick={onLogin} style={{width:'100%',background:T.gold,color:'#0D0A08',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:T.mono,letterSpacing:'0.5px'}}>Sign in to join →</button>
              </div>
              <div style={{fontSize:'12px',color:T.textDim,textAlign:'center'}}>Already have an account? Sign in and you'll be taken straight to the league.</div>
            </div>
          ):(
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'40px',marginBottom:'16px'}}>🎬</div>
              <div style={{fontSize:'16px',fontWeight:700,marginBottom:'8px'}}>Invalid invite code</div>
              <div style={{fontSize:'13px',color:T.textSub,marginBottom:'20px'}}>Code <span style={{color:T.gold}}>{code}</span> not found. Check the link and try again.</div>
              <button onClick={onLogin} style={{background:'none',border:`1px solid ${T.border}`,color:T.textSub,borderRadius:'10px',padding:'10px 20px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px'}}>Back to sign in</button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function AccessDenied({onBack}){
  return(
    <div style={{textAlign:'center',padding:'60px 24px',animation:'fadeUp .2s ease'}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}>🔒</div>
      <div style={{fontSize:'18px',fontWeight:800,color:T.text,marginBottom:'8px'}}>Commissioner only</div>
      <div style={{fontSize:'13px',color:T.textSub,marginBottom:'24px',maxWidth:'320px',marginLeft:'auto',marginRight:'auto',lineHeight:1.6}}>This area is for the league commissioner — managing films, results, and league settings. If you think you should have access, ask your commissioner.</div>
      <Btn onClick={onBack} color={T.gold}>Back to Market</Btn>
    </div>
  )
}

function Login(){
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[mode,setMode]=useState('password') // 'password' | 'magic'
  const[sent,setSent]=useState(false)
  const[busy,setBusy]=useState(false)
  const[err,setErr]=useState('')
  const REDIRECT=typeof window!=='undefined'?window.location.origin:'https://boxd-league-v2.vercel.app'

  const passwordAuth=async e=>{
    e.preventDefault();setBusy(true);setErr('')
    // Try sign-in first; if the account doesn't exist yet, sign them up.
    let{error}=await supabase.auth.signInWithPassword({email:email.trim(),password})
    if(error&&/invalid login credentials/i.test(error.message)){
      const su=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:REDIRECT}})
      if(su.error)error=su.error
      else if(!su.data.session){setErr('Account created — check your email to confirm, then sign in.');setBusy(false);return}
      else error=null
    }
    if(error)setErr(error.message)
    setBusy(false)
  }
  const magicAuth=async e=>{
    e.preventDefault();setBusy(true);setErr('')
    const{error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:REDIRECT}})
    if(error)setErr(error.message);else setSent(true)
    setBusy(false)
  }

  return(
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono,padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'340px'}}>
        <div style={{fontSize:'56px',fontWeight:900,color:T.gold,letterSpacing:'-3px',marginBottom:'6px',lineHeight:1}}>BOXD</div>
        <div style={{fontSize:'11px',color:T.textDim,letterSpacing:'3px',marginBottom:'40px'}}>FANTASY BOX OFFICE</div>
        {sent?(
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'16px',color:T.text,marginBottom:'8px'}}>Check your email ✉️</div>
            <div style={{fontSize:'13px',color:T.textSub,marginBottom:'20px'}}>{email}</div>
            <button onClick={()=>setSent(false)} style={{background:'none',border:`1px solid ${T.border}`,color:T.textSub,borderRadius:'10px',padding:'10px 20px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px'}}>Back</button>
          </div>
        ):(
          <>
            <form onSubmit={mode==='password'?passwordAuth:magicAuth}>
              <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
                style={{...S.inp,marginBottom:'12px',fontSize:'14px',padding:'14px 16px'}}/>
              {mode==='password'&&(
                <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" minLength={6}
                  style={{...S.inp,marginBottom:'12px',fontSize:'14px',padding:'14px 16px'}}/>
              )}
              {err&&<div style={{fontSize:'12px',color:T.red,marginBottom:'12px',lineHeight:1.5}}>{err}</div>}
              <button type="submit" disabled={busy}
                style={{width:'100%',background:T.gold,color:'#0D0A08',border:'none',borderRadius:'10px',padding:'14px',fontSize:'13px',fontWeight:700,cursor:'pointer',letterSpacing:'1px',fontFamily:T.mono}}>
                {busy?'…':mode==='password'?'SIGN IN':'SEND MAGIC LINK'}
              </button>
            </form>
            <div style={{textAlign:'center',marginTop:'16px'}}>
              <button onClick={()=>{setMode(mode==='password'?'magic':'password');setErr('')}}
                style={{background:'none',border:'none',color:T.textSub,fontSize:'12px',cursor:'pointer',fontFamily:T.mono,textDecoration:'underline'}}>
                {mode==='password'?'Prefer a magic link instead?':'Use a password instead'}
              </button>
            </div>
            <div style={{fontSize:'10px',color:T.textDim,textAlign:'center',marginTop:'20px',lineHeight:1.6}}>
              {mode==='password'?"New here? Just enter an email + password — we'll create your account.":"We'll email you a one-tap sign-in link."}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CreateProfile({session,onCreated,notify}){
  const[name,setName]=useState('')
  const[color,setColor]=useState(PLAYER_COLORS[0])
  const[busy,setBusy]=useState(false)
  const go=async e=>{e.preventDefault();if(!name.trim())return;setBusy(true);const{error}=await supabase.from('profiles').insert({id:session.user.id,name:name.trim(),color});if(error){notify(error.message,T.red);setBusy(false);return}onCreated()}
  return(
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono,padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'320px'}}>
        <div style={{fontSize:'56px',fontWeight:900,color:T.gold,letterSpacing:'-3px',marginBottom:'6px',lineHeight:1}}>BOXD</div>
        <div style={{fontSize:'16px',color:T.text,fontWeight:600,marginBottom:'4px',marginTop:'24px'}}>Create your profile</div>
        <div style={{fontSize:'13px',color:T.textSub,marginBottom:'28px'}}>{session.user.email}</div>
        <form onSubmit={go}>
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required style={{...S.inp,marginBottom:'20px',fontSize:'14px',padding:'14px 16px'}}/>
          <div style={{...S.label,marginBottom:'12px'}}>Pick your colour</div>
          <div style={{display:'flex',gap:'12px',marginBottom:'28px'}}>
            {PLAYER_COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:'34px',height:'34px',borderRadius:'50%',background:c,cursor:'pointer',border:`3px solid ${color===c?'#fff':'transparent'}`,transition:'border .15s',boxSizing:'border-box',flexShrink:0}}/>)}
          </div>
          <button type="submit" disabled={busy} style={{width:'100%',background:T.gold,color:'#0D0A08',border:'none',borderRadius:'10px',padding:'14px',fontSize:'13px',fontWeight:700,cursor:'pointer',letterSpacing:'1px',fontFamily:T.mono}}>{busy?'JOINING…':'JOIN LEAGUE'}</button>
        </form>
      </div>
    </div>
  )
}

function PlayerProfilePage({player,badges=[],reviews=[],onOpenFilm,films,rosters,results,weeklyG,allChips,oscarPreds,allPicks,calcPoints,calcPhasePoints,budgetLeft,cur,isEarlyBird,analystActive,curPhase_ref,onBack}){
  const[activePhase,setActivePhase]=useState(null)
  const totalPts=calcPoints(player.id)
  const chip=allChips.find(c=>c.player_id===player.id)
  const oscar=oscarPreds.find(o=>o.player_id===player.id)
  const pc=player.color||T.gold
  const allHoldings=rosters.filter(r=>r.player_id===player.id&&films.find(f=>f.id===r.film_id))
  const activeNow=allHoldings.filter(r=>r.active)
  const totalSpend=allHoldings.reduce((s,h)=>s+(h.bought_price||0),0)
  const scoredHoldings=allHoldings.map(h=>{const film=films.find(f=>f.id===h.film_id);if(!film||results[film.id]==null)return null;const pts=calcOpeningPts(film,results[film.id],isEarlyBird(h),analystActive(player.id,film.id));return{h,film,pts}}).filter(Boolean)
  const bestPick=scoredHoldings.length?scoredHoldings.reduce((b,x)=>x.pts>b.pts?x:b):null
  const worstPick=scoredHoldings.length>1?scoredHoldings.reduce((b,x)=>x.pts<b.pts?x:b):null

  const PhaseView=({ph})=>{
    const phHoldings=allHoldings.filter(r=>r.phase===ph)
    const phPts=calcPhasePoints(player.id,ph)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
          <div style={{flex:1}}><div style={{fontSize:'20px',fontWeight:800,color:pc}}>{PHASE_NAMES[ph]}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:'40px',fontWeight:900,color:T.gold,letterSpacing:'-1px'}}>{phPts}</div><div style={S.label}>phase pts</div></div>
        </div>
        {phHoldings.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No films this phase</div>:phHoldings.map(h=>{
          const film=films.find(f=>f.id===h.film_id);if(!film)return null
          const actual=results[film.id],gc=GENRE_COL[film.genre]||T.textDim
          const eb=isEarlyBird(h),aa=analystActive(player.id,film.id)
          let op=calcOpeningPts(film,actual,eb,aa)
          const wp=Math.round(calcWeeklyPts(weeklyG[film.id]||{})),lb=calcLegsBonus(actual,weeklyG[film.id]?.[2])
          const filmTotal=op+wp+lb
          const pnl_=h.active?(actual!=null?actual-h.bought_price:0):(h.sold_price||0)-h.bought_price
          return(
            <div key={h.id} style={{...S.card,marginBottom:'10px'}}>
              <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
                <FilmPoster film={film} width={52} height={78} radius={8}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'14px',fontWeight:700,lineHeight:1.3,marginBottom:'4px'}}>{film.title}</div>
                  <div style={{fontSize:'11px',color:T.textSub}}>{film.dist} · W{film.week}</div>
                  <div style={{display:'flex',gap:'14px',marginTop:'10px',flexWrap:'wrap'}}>
                    <div><div style={S.label}>Paid</div><div style={{fontSize:'14px',fontWeight:600,marginTop:'2px'}}>${h.bought_price}M</div></div>
                    {!h.active&&<div><div style={S.label}>Sold</div><div style={{fontSize:'14px',fontWeight:600,color:pnl_>=0?T.green:T.red,marginTop:'2px'}}>${h.sold_price||0}M</div></div>}
                    {actual!=null&&<div><div style={S.label}>Actual</div><div style={{fontSize:'14px',fontWeight:600,color:T.green,marginTop:'2px'}}>${actual}M</div></div>}
                    <div><div style={S.label}>P&L</div><div style={{fontSize:'14px',fontWeight:700,color:pnl_>=0?T.green:T.red,marginTop:'2px'}}>{pnl_>=0?'+':''}{pnl_}M</div></div>
                  </div>
                  {actual!=null&&<div style={{marginTop:'10px',background:T.surfaceUp,borderRadius:'9px',padding:'10px 12px'}}>
                    <div style={{display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'flex-end'}}>
                      <div><div style={S.label}>Opening</div><div style={{fontSize:'13px',fontWeight:600,color:T.gold,marginTop:'2px'}}>+{op}</div></div>
                      {wp>0&&<div><div style={S.label}>Weekly</div><div style={{fontSize:'13px',fontWeight:600,color:T.blue,marginTop:'2px'}}>+{wp}</div></div>}
                      {lb>0&&<div><div style={S.label}>Legs 🦵</div><div style={{fontSize:'13px',fontWeight:600,color:T.green,marginTop:'2px'}}>+25</div></div>}
                      <div style={{marginLeft:'auto'}}><div style={S.label}>Total</div><div style={{fontSize:'22px',fontWeight:900,color:T.gold,marginTop:'2px'}}>{filmTotal}pts</div></div>
                    </div>
                  </div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const Overview=()=>{
    const phaseScores=ALL_PHASES.map(p=>({ph:p,pts:calcPhasePoints(player.id,p)}))
    const maxPts=Math.max(1,...phaseScores.map(s=>s.pts))
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={{background:T.surfaceUp,borderRadius:'16px',padding:'24px',marginBottom:'16px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'4px',background:pc}}/>
          <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
            <div style={{width:'68px',height:'68px',borderRadius:'50%',background:pc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'30px',fontWeight:900,color:'#000',flexShrink:0,overflow:'hidden',border:`2px solid ${pc}`}}>
              {player.avatar_url?<img src={player.avatar_url} alt={player.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/>:player.name?.[0]||'?'}
            </div>
            <div style={{flex:1}}><div style={{fontSize:'26px',fontWeight:900,color:pc,letterSpacing:'-0.5px'}}>{player.name}</div><div style={{fontSize:'13px',color:T.textSub,marginTop:'6px'}}>{activeNow.length} films active · {budgetLeft(player.id)}M left</div>{player.bio&&<div style={{fontSize:'12px',color:T.textSub,marginTop:'4px',fontStyle:'italic'}}>"{player.bio}"</div>}</div>
            <div style={{textAlign:'right'}}><div style={{fontSize:'48px',fontWeight:900,color:T.gold,lineHeight:1,letterSpacing:'-2px'}}>{totalPts}</div><div style={S.label}>grand pts</div></div>
          </div>
        </div>

        {/* ── IDENTITY — bio, fav film, letterboxd, recently watched, watchlist ── */}
        {(player.bio||player.favourite_film_id||player.letterboxd_url)&&(
          <div style={{...S.card,marginBottom:'12px'}}>
            {player.bio&&<div style={{fontSize:'13px',color:T.text,fontStyle:'italic',lineHeight:1.6,marginBottom:'10px'}}>"{player.bio}"</div>}
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
              {player.favourite_film_id&&(()=>{const ff=films.find(f=>f.id===player.favourite_film_id);if(!ff)return null;return(
                <div onClick={()=>onOpenFilm&&onOpenFilm(ff)} style={{display:'flex',gap:'8px',alignItems:'center',background:T.surfaceUp,borderRadius:'10px',padding:'6px 10px',cursor:'pointer'}}>
                  <FilmPoster film={ff} width={24} height={36} radius={4}/>
                  <div><div style={{fontSize:'9px',color:T.textDim,letterSpacing:'1px'}}>MOST EXCITED FOR</div><div style={{fontSize:'11px',fontWeight:700,color:T.gold}}>{ff.title}</div></div>
                </div>
              )})()}
              {player.letterboxd_url&&<a href={player.letterboxd_url} target="_blank" rel="noopener noreferrer" style={{fontSize:'11px',color:T.green,textDecoration:'none',fontWeight:700,background:T.surfaceUp,borderRadius:'10px',padding:'10px 12px'}}>📗 Letterboxd ↗</a>}
            </div>
          </div>
        )}
        {(()=>{
          const myReviews=reviews.filter(r=>r.user_id===player.id).sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)).slice(0,4)
          const myWatch=(allPicks||[]).filter(p=>p.user_id===player.id).map(p=>films.find(f=>f.id===p.film_id)).filter(Boolean).slice(0,6)
          if(myReviews.length===0&&myWatch.length===0)return null
          return(
            <div style={{...S.card,marginBottom:'12px'}}>
              {myReviews.length>0&&<>
                <div style={{...S.label,marginBottom:'8px'}}>Recently Watched</div>
                <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'6px',marginBottom:myWatch.length?'12px':0}}>
                  {myReviews.map(r=>{const f=films.find(fl=>fl.id===r.film_id);if(!f)return null;return(
                    <div key={r.id} onClick={()=>onOpenFilm&&onOpenFilm(f)} style={{cursor:'pointer',flexShrink:0,textAlign:'center'}}>
                      <FilmPoster film={f} width={52} height={78} radius={6}/>
                      <div style={{fontSize:'9px',color:T.gold,fontFamily:T.mono,marginTop:'3px'}}>{'★'.repeat(r.rating)}</div>
                    </div>
                  )})}
                </div>
              </>}
              {myWatch.length>0&&<>
                <div style={{...S.label,marginBottom:'8px'}}>Watchlist</div>
                <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'4px'}}>
                  {myWatch.map(f=>(
                    <div key={f.id} onClick={()=>onOpenFilm&&onOpenFilm(f)} style={{cursor:'pointer',flexShrink:0}}>
                      <FilmPoster film={f} width={52} height={78} radius={6}/>
                    </div>
                  ))}
                </div>
              </>}
            </div>
          )
        })()}
        {badges.length>0&&(
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
            {badges.map(b=>(
              <span key={b.name} title={b.desc} style={{background:T.surfaceUp,border:`1px solid ${T.gold}33`,borderRadius:'20px',padding:'5px 11px',fontSize:'11px',fontWeight:600,color:T.gold,display:'inline-flex',gap:'5px',alignItems:'center',cursor:'help'}}>
                {b.icon} {b.name}
              </span>
            ))}
          </div>
        )}
        <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
          <StatBox label="Films ever" value={allHoldings.length}/>
          <StatBox label="Total spend" value={`${cur}${totalSpend}M`} color={T.textSub}/>
          <StatBox label="Scored" value={scoredHoldings.length}/>
        </div>
        {(bestPick||worstPick)&&<div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
          {bestPick&&<StatBox label="🏆 Best" value={`+${bestPick.pts}pts`} color={T.gold} sub={bestPick.film.title.split(':')[0]}/>}
          {worstPick&&worstPick.film.id!==bestPick?.film.id&&<StatBox label="💀 Worst" value={`${worstPick.pts}pts`} color={T.red} sub={worstPick.film.title.split(':')[0]}/>}
          {scoredHoldings.length>0&&<StatBox label="Avg pts" value={Math.round(scoredHoldings.reduce((s,x)=>s+x.pts,0)/scoredHoldings.length)}/>}
        </div>}
        <div style={S.label}>Phase Breakdown — tap to drill in</div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px',margin:'12px 0 20px'}}>
          {ALL_PHASES.map(ph=>{
            const phPts=calcPhasePoints(player.id,ph),phAll=allHoldings.filter(r=>r.phase===ph),phSco=phAll.filter(r=>results[r.film_id]!=null),isCur=ph===curPhase_ref
            return(
              <div key={ph} onClick={()=>setActivePhase(ph)} style={{background:isCur?`${pc}12`:T.surface,border:`1px solid ${isCur?`${pc}55`:T.border}`,borderRadius:'12px',padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:'14px'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:isCur?`${pc}22`:T.surfaceUp,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:800,color:isCur?pc:T.textSub,flexShrink:0}}>P{ph}</div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:600,color:isCur?pc:T.text}}>{PHASE_NAMES[ph]}</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{phAll.length} films · {phSco.length} scored{isCur?' · current':''}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'26px',fontWeight:900,color:phPts>0?T.gold:T.textDim,letterSpacing:'-0.5px'}}>{phPts}</div><div style={S.label}>pts</div></div>
                <div style={{color:T.textDim,fontSize:'18px'}}>›</div>
              </div>
            )
          })}
        </div>
        {phaseScores.some(s=>s.pts>0)&&<div style={{marginTop:'20px'}}>
          <div style={S.label}>Performance History</div>
          <div style={{background:T.surfaceUp,borderRadius:'12px',padding:'16px',marginTop:'10px'}}>
            <div style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'80px'}}>
              {phaseScores.map(({ph:p,pts})=>{
                const barH=pts>0?Math.max(8,Math.round((pts/maxPts)*72)):4,isCurrentPh=p===curPhase_ref
                return(
                  <div key={p} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                    <div style={{fontSize:'10px',color:pts>0?T.gold:T.textDim,fontWeight:700}}>{pts>0?pts:'—'}</div>
                    <div style={{width:'100%',height:`${barH}px`,background:isCurrentPh?pc:`${pc}55`,borderRadius:'4px 4px 0 0',minHeight:'4px'}}/>
                    <div style={{fontSize:'9px',color:isCurrentPh?pc:T.textDim}}>P{p}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>}
      </div>
    )
  }
  return(
    <div style={{animation:'fadeUp .2s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
        <button onClick={activePhase!==null?()=>setActivePhase(null):onBack} style={{background:T.surfaceUp,border:`1px solid ${T.border}`,color:T.textSub,borderRadius:'8px',padding:'8px 16px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px'}}>← {activePhase!==null?'Overview':'Back'}</button>
        <div style={{fontSize:'13px',color:T.textSub}}>{activePhase!==null?`Phase ${activePhase} · ${PHASE_NAMES[activePhase]}`:`Profile · ${player.name}`}</div>
      </div>
      {activePhase!==null?<PhaseView ph={activePhase}/>:<Overview/>}
    </div>
  )
}

// ── SCORE BREAKDOWN MODAL ──────────────────────────────────────────────────────
function ScoreBreakdownModal({film,holding,results,weeklyGrosses,allChips,isEarlyBird,onClose}){
  const actual=results[film.id],weeks=weeklyGrosses[film.id]||{},pid=holding.player_id
  const chip=allChips.find(c=>c.player_id===pid)
  const analystWin=chip?.analyst_film_id===film.id&&chip?.analyst_result==='win'
  const eb=isEarlyBird(holding)
  const gc=GENRE_COL[film.genre]||T.textSub
  const baseOpen=actual!=null?calcOpeningPts(film,actual,false,false):0
  const ebBonus=(eb&&actual!=null&&actual/film.estM>=1.1)?Math.round(baseOpen*0.1):0
  const analystBon=analystWin?60:0
  const openPts=baseOpen+ebBonus+analystBon
  const wkPts=Math.round(calcWeeklyPts(weeks))
  const lb=calcLegsBonus(actual,weeks[2])
  const total=openPts+wkPts+lb
  const Row=({label,value,color,sub})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'12px 0',borderBottom:`1px solid ${T.border}`}}>
      <div><div style={{fontSize:'13px',color:T.text,lineHeight:1.4}}>{label}</div>{sub&&<div style={{fontSize:'11px',color:T.textSub,marginTop:'3px'}}>{sub}</div>}</div>
      <div style={{fontSize:'16px',fontWeight:700,color:color||T.text,flexShrink:0,marginLeft:'16px'}}>{value}</div>
    </div>
  )
  return(
    <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:800}} onClick={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:'520px',maxHeight:'90vh',overflowY:'auto',paddingBottom:'calc(24px + env(safe-area-inset-bottom))',animation:'slideUp .25s ease'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'20px 20px 0'}}>
          <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 20px'}}/>
          <div style={{height:'3px',background:gc,borderRadius:'2px',marginBottom:'16px'}}/>
          <div style={{display:'flex',gap:'16px',marginBottom:'20px',alignItems:'flex-start'}}>
            <FilmPoster film={film} width={72} height={108} radius={10}/>
            <div style={{flex:1}}>
              <div style={{fontSize:'18px',fontWeight:700,lineHeight:1.3,color:T.text}}>{film.title}</div>
              <div style={{fontSize:'12px',color:T.textSub,marginTop:'4px'}}>{film.dist} · {dateLabel(film.week)} · Phase {film.phase}</div>
              {actual!=null&&<div style={{display:'flex',gap:'14px',marginTop:'12px',flexWrap:'wrap'}}>
                {[['ACTUAL',`$${actual}M`,T.green],['EST',film.estM?`$${film.estM}M`:'—',T.text],['RATIO',film.estM?`${(actual/film.estM).toFixed(2)}×`:'—',actual/film.estM>=1?T.green:T.red],...(film.rt!=null?[['RT',`${film.rt}%`,film.rt>=90?T.green:film.rt>=75?T.gold:T.red]]:[])].map(([l,v,c])=>(
                  <div key={l}><div style={S.label}>{l}</div><div style={{fontSize:'15px',fontWeight:700,color:c,marginTop:'3px'}}>{v}</div></div>
                ))}
              </div>}
            </div>
          </div>
        </div>
        <div style={{padding:'0 20px 20px'}}>
          {actual==null?<div style={{textAlign:'center',color:T.textSub,padding:'32px',fontSize:'13px'}}>No results yet — check back after opening weekend.</div>:<>
            <div style={S.label}>Points Breakdown</div>
            <div style={{marginTop:'8px'}}>
              <Row label="Base opening pts" value={`+${baseOpen}`} sub={`$${actual}M actual · ${film.estM?(actual/film.estM).toFixed(2)+'×':''} performance`}/>
              {eb&&ebBonus>0&&<Row label="🐦 Early Bird +10%" value={`+${ebBonus}`} color={T.green} sub="Bought 4+ weeks early and film beat estimate"/>}
              {analystWin&&<Row label="🎯 Analyst bonus" value="+60" color={T.blue} sub="Predicted opening within 10%"/>}
              {wkPts>0&&<Row label="📅 Weekly grosses" value={`+${wkPts}`} color={T.blue} sub="W1–3: 1pt/$1M · W4+: 1.1pts/$1M"/>}
              {lb>0&&<Row label="🦵 Legs (W2 drop <30%)" value="+25" color={T.green} sub="Strong hold — word of mouth is working"/>}
            </div>
            <div style={{marginTop:'20px',background:T.surfaceUp,borderRadius:'14px',padding:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={S.label}>Total Points</div>
              <div style={{fontSize:'44px',fontWeight:900,color:T.gold,letterSpacing:'-2px',fontFamily:T.mono}}>{total}</div>
            </div>
          </>}
          <Btn onClick={onClose} variant="outline" color={T.textSub} full sx={{marginTop:'16px'}} size="lg">Close</Btn>
        </div>
      </div>
    </div>
  )
}

function ReviewThread({thread,players,onAdd}){
  const[open,setOpen]=useState(false)
  const[txt,setTxt]=useState('')
  if(!open)return(
    <button onClick={()=>setOpen(true)} style={{background:'none',border:'none',color:T.textDim,fontSize:'10px',cursor:'pointer',padding:'4px 0 0',fontFamily:T.mono}}>
      💬 {thread.length>0?`${thread.length} comment${thread.length!==1?'s':''}`:'Reply'}
    </button>
  )
  return(
    <div style={{marginTop:'8px',paddingLeft:'10px',borderLeft:`2px solid ${T.border}`}}>
      {thread.map(c=>{
        const p=players.find(pl=>pl.id===c.user_id)
        return(
          <div key={c.id} style={{marginBottom:'6px'}}>
            <span style={{fontSize:'10px',fontWeight:700,color:p?.color||T.textSub}}>{p?.name||'Player'}</span>
            <span style={{fontSize:'11px',color:T.text,marginLeft:'6px'}}>{c.body}</span>
          </div>
        )
      })}
      {onAdd&&(
        <div style={{display:'flex',gap:'6px',marginTop:'6px'}}>
          <input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&txt.trim()){onAdd(txt);setTxt('')}}} placeholder="Reply…" style={{...S.inp,fontSize:'11px',padding:'6px 10px',flex:1}}/>
          <Btn onClick={()=>{if(txt.trim()){onAdd(txt);setTxt('')}}} color={T.gold} size="sm" disabled={!txt.trim()}>↩</Btn>
        </div>
      )}
      <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',color:T.textDim,fontSize:'10px',cursor:'pointer',padding:'4px 0 0'}}>Hide</button>
    </div>
  )
}

function ReviewEditor({existing,onSave,onDelete}){
  const[rating,setRating]=useState(existing?.rating||0)
  const[body,setBody]=useState(existing?.body||'')
  const[open,setOpen]=useState(false)
  if(!open&&!existing)return <Btn onClick={()=>setOpen(true)} variant="outline" color={T.gold} size="sm" sx={{marginBottom:'10px'}}>⭐ Write a review</Btn>
  if(!open&&existing)return(
    <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'10px',background:`${T.gold}0C`,border:`1px solid ${T.gold}33`,borderRadius:'10px',padding:'8px 12px'}}>
      <span style={{fontSize:'12px',color:T.gold,fontFamily:T.mono}}>{'★'.repeat(existing.rating)}{'☆'.repeat(5-existing.rating)}</span>
      <span style={{flex:1,fontSize:'11px',color:T.textSub,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{existing.body||'Your review'}</span>
      <Btn onClick={()=>setOpen(true)} variant="outline" color={T.textSub} size="sm">Edit</Btn>
    </div>
  )
  return(
    <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'12px',marginBottom:'10px'}}>
      <div style={{display:'flex',gap:'4px',marginBottom:'8px'}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>setRating(n)} aria-label={`Rate ${n} star${n!==1?'s':''}`} style={{background:'none',border:'none',cursor:'pointer',fontSize:'22px',padding:'2px',color:n<=rating?T.gold:T.textDim,lineHeight:1}}>★</button>
        ))}
      </div>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Your take (optional)" maxLength={280} style={{...S.inp,minHeight:'60px',resize:'vertical',marginBottom:'8px',fontSize:'12px'}}/>
      <div style={{display:'flex',gap:'8px'}}>
        {onDelete&&<Btn onClick={()=>{onDelete();setOpen(false)}} variant="outline" color={T.red} size="sm">Delete</Btn>}
        <Btn onClick={()=>setOpen(false)} variant="outline" color={T.textSub} size="sm" sx={{marginLeft:'auto'}}>Cancel</Btn>
        <Btn onClick={()=>{if(rating===0)return;onSave(rating,body.trim());setOpen(false)}} color={T.gold} size="sm" disabled={rating===0}>{existing?'Update':'Post'}</Btn>
      </div>
    </div>
  )
}

// ── COMMENT NODE — recursive threaded comment with likes + reply ──────────
function CommentNode({comment,comments,players,profile,commentLikes,onLike,onReply,onDelete,depth,isAdmin}){
  const[replyOpen,setReplyOpen]=useState(false)
  const[replyText,setReplyText]=useState('')
  const[replyGif,setReplyGif]=useState('')
  const[gifOpen,setGifOpen]=useState(false)
  const p=players.find(pl=>pl.id===comment.user_id)
  const replies=comments.filter(c=>c.parent_id===comment.id)
  const likes=commentLikes.filter(l=>l.comment_id===comment.id)
  const iLiked=likes.some(l=>l.user_id===profile?.id)
  const renderBody=(txt)=>(txt||'').split(/(@\w+)/g).map((part,i)=>{
    if(part.startsWith('@')){const m=players.find(pl=>`@${pl.name}`===part);return<span key={i} style={{color:m?.color||T.gold,fontWeight:600}}>{part}</span>}
    return part
  })
  return(
    <div style={{display:'flex',gap:'10px',marginBottom:'14px',marginLeft:depth>0?'16px':0,paddingLeft:depth>0?'8px':0,borderLeft:depth>0?`2px solid ${T.border}`:'none'}}>
      <div style={{width:'30px',height:'30px',borderRadius:'50%',background:p?.color||T.gold,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#0D0A08'}}>{p?.name?.[0]||'?'}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',gap:'8px',alignItems:'baseline',marginBottom:'3px'}}>
          <span style={{fontSize:'12px',fontWeight:700,color:p?.color||T.gold}}>{p?.name||'Player'}</span>
          <span style={{fontSize:'10px',color:T.textDim}}>{timeAgo(comment.created_at)}</span>
        </div>
        {comment.comment&&<div style={{fontSize:'13px',color:T.text,lineHeight:1.5,marginBottom:comment.gif_url?'6px':0}}>{renderBody(comment.comment)}</div>}
        {comment.gif_url&&<img src={comment.gif_url} alt="" loading="lazy" style={{maxWidth:'180px',maxHeight:'140px',borderRadius:'8px',marginBottom:'4px'}}/>}
        <div style={{display:'flex',gap:'14px',alignItems:'center',marginTop:'4px'}}>
          <button onClick={()=>onLike(comment.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'11px',color:iLiked?T.gold:T.textDim,padding:0,fontWeight:iLiked?700:400}}>♥ {likes.length>0?likes.length:''}</button>
          {depth<3&&<button onClick={()=>setReplyOpen(!replyOpen)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'11px',color:T.textDim,padding:0}}>↩ Reply</button>}
          {(comment.user_id===profile?.id||isAdmin)&&<button onClick={()=>onDelete(comment.id)} title={isAdmin&&comment.user_id!==profile?.id?'Delete (moderator)':'Delete'} style={{background:'none',border:'none',cursor:'pointer',fontSize:'11px',color:isAdmin&&comment.user_id!==profile?.id?T.red:T.textDim,padding:0}}>✕</button>}
        </div>
        {replyOpen&&(
          <div style={{marginTop:'8px'}}>
            {replyGif&&<div style={{position:'relative',display:'inline-block',marginBottom:'6px'}}><img src={replyGif} alt="" style={{maxHeight:'60px',borderRadius:'6px'}}/><button onClick={()=>setReplyGif('')} style={{position:'absolute',top:'-5px',right:'-5px',background:T.red,color:'#fff',border:'none',borderRadius:'50%',width:'18px',height:'18px',cursor:'pointer',fontSize:'10px'}}>×</button></div>}
            {gifOpen&&<GifPicker onPick={u=>{setReplyGif(u);setGifOpen(false)}} onClose={()=>setGifOpen(false)}/>}
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={()=>setGifOpen(true)} style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.gold,fontSize:'10px',fontWeight:700,padding:'8px',cursor:'pointer'}}>GIF</button>
              <input value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onReply(comment.id,replyText,replyGif);setReplyText('');setReplyGif('');setReplyOpen(false)}}} placeholder="Reply…" style={{...S.inp,flex:1,fontSize:'12px',padding:'8px 10px'}}/>
              <Btn onClick={()=>{onReply(comment.id,replyText,replyGif);setReplyText('');setReplyGif('');setReplyOpen(false)}} color={T.blue} textColor="#fff" size="sm">↩</Btn>
            </div>
          </div>
        )}
        {replies.map(r=>(
          <div key={r.id} style={{marginTop:'12px'}}>
            <CommentNode comment={r} comments={comments} players={players} profile={profile} commentLikes={commentLikes} onLike={onLike} onReply={onReply} onDelete={onDelete} depth={depth+1} isAdmin={isAdmin}/>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── GIF PICKER — Tenor search (free public key) ───────────────────────────
function GifPicker({onPick,onClose}){
  const[q,setQ]=useState('')
  const[gifs,setGifs]=useState([])
  const[loading,setLoading]=useState(false)
  const search=async(term)=>{
    setLoading(true)
    try{
      // Tenor's public demo key — fine for low volume; swap for your own later
      // GIF search key lives in an env var, never committed to the repo.
      // Set REACT_APP_TENOR_KEY in Vercel; if absent, the picker simply
      // shows nothing rather than exposing a key in source.
      const key=process.env.REACT_APP_TENOR_KEY||''
      if(!key){setGifs([]);setLoading(false);return}
      const url=term.trim()
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(term)}&key=${key}&client_key=boxd&limit=12&media_filter=tinygif`
        : `https://tenor.googleapis.com/v2/featured?key=${key}&client_key=boxd&limit=12&media_filter=tinygif`
      const res=await fetch(url)
      const data=await res.json()
      setGifs((data.results||[]).map(g=>({preview:g.media_formats?.tinygif?.url,full:g.media_formats?.tinygif?.url})).filter(g=>g.preview))
    }catch{setGifs([])}
    setLoading(false)
  }
  useEffect(()=>{search('')},[])
  return(
    <div style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'12px',padding:'10px',marginBottom:'10px'}}>
      <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
        <input autoFocus value={q} onChange={e=>{setQ(e.target.value)}} onKeyDown={e=>e.key==='Enter'&&search(q)} placeholder="Search GIFs…" style={{...S.inp,flex:1,fontSize:'12px',padding:'8px 10px'}}/>
        <Btn onClick={()=>search(q)} color={T.gold} size="sm">Go</Btn>
        <button onClick={onClose} style={{background:'none',border:`1px solid ${T.border}`,borderRadius:'8px',color:T.textSub,cursor:'pointer',padding:'0 10px'}}>×</button>
      </div>
      {loading?<div style={{fontSize:'11px',color:T.textSub,padding:'10px',textAlign:'center'}}>Loading…</div>:
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',maxHeight:'200px',overflowY:'auto'}}>
          {gifs.map((g,i)=>(
            <img key={i} src={g.preview} alt="" onClick={()=>onPick(g.full)} style={{width:'100%',height:'70px',objectFit:'cover',borderRadius:'6px',cursor:'pointer'}}/>
          ))}
          {gifs.length===0&&<div style={{gridColumn:'1/-1',fontSize:'11px',color:T.textDim,textAlign:'center',padding:'10px'}}>No GIFs found</div>}
        </div>
      }
      <div style={{fontSize:'9px',color:T.textDim,textAlign:'right',marginTop:'4px'}}>via Tenor</div>
    </div>
  )
}


function FilmDetailModal({film,profile,players,results,allPicks=[],marketingEvents=[],news=[],rosters=[],filmValues={},weeklyG={},reviews=[],reviewComments=[],onAddReviewComment,bookingClicks=[],onSaveReview,onDeleteReview,currentWeek=null,phase=1,onTogglePick,onBookingClick,onShowtimes,onClose,league,isAdmin=false,onBuy,onSell,onLiveVal}){
  const[comments,setComments]=useState([])
  const[commentLikes,setCommentLikes]=useState([])
  const[gifUrl,setGifUrl]=useState('')
  const[gifPickerOpen,setGifPickerOpen]=useState(false)
  const[text,setText]=useState('')
  const[tab,setTab]=useState('info')
  const actual=results[film.id],gc=GENRE_COL[film.genre]||T.textSub
  const pickCount=allPicks.filter(p=>p.film_id===film.id).length
  const vel7=pickVelocity(film.id,allPicks,7),vel1=pickVelocity(film.id,allPicks,1)
  const eventsForFilm=(marketingEvents||[]).filter(e=>e.film_id===film.id).sort((a,b)=>new Date(a.event_date)-new Date(b.event_date))
  useEffect(()=>{
    loadComments();loadCommentLikes()
    const ch=supabase.channel(`film-detail-${film.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'film_comments',filter:`film_id=eq.${film.id}`},loadComments)
      .on('postgres_changes',{event:'*',schema:'public',table:'comment_likes'},loadCommentLikes)
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[])
  const loadComments=async()=>{const{data}=await supabase.from('film_comments').select('*').eq('film_id',film.id).order('created_at',{ascending:true});if(data)setComments(data)}
  const loadCommentLikes=async()=>{const{data}=await supabase.from('comment_likes').select('*');if(data)setCommentLikes(data)}
  const postWithGif=async()=>{
    if(profile?.is_banned)return notify('You are unable to post in this league',T.red)
    if(!text.trim()&&!gifUrl)return
    await supabase.from('film_comments').insert({user_id:profile.id,film_id:film.id,comment:text.trim(),gif_url:gifUrl||null,league_id:league?.id})
    setText('');setGifUrl('');loadComments()
  }
  const postReply=async(parentId,body,gif)=>{
    if(!body.trim()&&!gif)return
    await supabase.from('film_comments').insert({user_id:profile.id,film_id:film.id,comment:body.trim(),parent_id:parentId,gif_url:gif||null,league_id:league?.id})
    loadComments()
  }
  const toggleCommentLike=async(commentId)=>{
    const mine=commentLikes.find(l=>l.comment_id===commentId&&l.user_id===profile.id)
    if(mine)await supabase.from('comment_likes').delete().eq('id',mine.id)
    else await supabase.from('comment_likes').insert({comment_id:commentId,user_id:profile.id})
    loadCommentLikes()
  }
  const TabBtn=({id,label})=><button onClick={()=>setTab(id)} style={{...S.btn,background:'none',border:'none',fontSize:'13px',fontWeight:tab===id?700:400,color:tab===id?T.gold:T.textSub,padding:'10px 16px',borderBottom:`2px solid ${tab===id?T.gold:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0}}>{label}</button>
  return(
    <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:800,padding:'12px'}} onClick={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px',width:'100%',maxWidth:'700px',height:'min(92vh,860px)',display:'flex',flexDirection:'column',animation:'fadeUp .2s ease'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'24px 24px 0',flexShrink:0,background:`linear-gradient(150deg,${gc}18 0%,transparent 55%)`,borderRadius:'20px 20px 0 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
            <div style={{height:'3px',background:gc,borderRadius:'2px',flex:1,marginRight:'16px'}}/>
            <button onClick={onClose} style={{background:'none',border:`1px solid ${T.border}`,color:T.textSub,borderRadius:'8px',padding:'6px 14px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px',flexShrink:0}}>✕</button>
          </div>
          <div style={{display:'flex',gap:'18px',alignItems:'flex-start',marginBottom:'16px'}}>
            <FilmPoster film={film} width={88} height={132} radius={10}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'20px',fontWeight:800,lineHeight:1.25,letterSpacing:'-0.5px',marginBottom:'4px'}}>{film.title}</div>
              <div style={{fontSize:'13px',color:T.textSub}}>{film.dist} · {film.genre} · W{film.week} · Ph{film.phase}</div>
              {film.starActor&&<div style={{fontSize:'13px',color:T.textSub,marginTop:'2px'}}>⭐ {film.starActor}</div>}
              <div style={{display:'flex',gap:'12px',marginTop:'10px',flexWrap:'wrap'}}>
                {film.estM!=null&&<div><div style={S.label}>Est</div><div style={{fontSize:'15px',fontWeight:700,marginTop:'2px'}}>${film.estM}M</div></div>}
                <div><div style={S.label}>IPO</div><div style={{fontSize:'15px',fontWeight:700,marginTop:'2px',color:film.basePrice!=null?T.gold:T.textDim}}>{film.basePrice!=null?`$${film.basePrice}M`:'🔒 TBC'}</div></div>
                {actual!=null&&<div><div style={S.label}>Actual</div><div style={{fontSize:'15px',fontWeight:700,color:T.green,marginTop:'2px'}}>${actual}M</div></div>}
                {film.rt!=null&&<div><div style={S.label}>RT</div><div style={{fontSize:'15px',fontWeight:700,color:film.rt>=75?T.green:T.red,marginTop:'2px'}}>{film.rt}%</div></div>}
                <div><div style={S.label}>Opens</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'2px',color:T.textSub}}>{dateLabel(film.week)}</div></div>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'10px',alignItems:'center',flexWrap:'wrap'}}>
                {onTogglePick&&<PickButton filmId={film.id} userId={profile.id} allPicks={allPicks} onToggle={onTogglePick} size="sm"/>}
                {(()=>{
                  const owned=rosters.some(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active)
                  const liveVal=onLiveVal?onLiveVal(film):null
                  if(actual!=null)return null // released — no buy/sell
                  if(owned&&onSell)return <button onClick={()=>{onSell(film);onClose&&onClose()}} style={{background:T.red,color:'#fff',border:'none',borderRadius:'9px',padding:'10px 22px',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:T.mono,letterSpacing:'0.5px'}}>SELL{liveVal!=null?` $${liveVal}M`:''}</button>
                  if(!owned&&onBuy&&liveVal!=null)return <button onClick={()=>{onBuy(film);onClose&&onClose()}} style={{background:T.gold,color:'#0D0A08',border:'none',borderRadius:'9px',padding:'10px 22px',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:T.mono,letterSpacing:'0.5px'}}>BUY ${liveVal}M</button>
                  return null
                })()}
                {vel7>0&&<Badge color={vel7>=5?T.red:vel7>=2?T.orange:T.textSub}>+{vel7} this week</Badge>}
                {vel1>0&&<Badge color={T.green}>🔥 +{vel1} today</Badge>}
              </div>
            </div>
          </div>
          <div style={{display:'flex',borderBottom:`1px solid ${T.border}`}}>
            <TabBtn id="info" label="Info"/><TabBtn id="intent" label={`Intent · ${pickCount}`}/><TabBtn id="comments" label={`Comments · ${comments.length}`}/>
          </div>
        </div>
        {tab==='info'&&(
          <div style={{flex:1,overflowY:'auto',padding:'16px 24px 24px'}}>
            {results[film.id]==null&&(()=>{
              // If this film has no IPO price yet (future slate), show locked notice instead
              if(film.basePrice==null){
                return(
                  <div style={{...S.card,marginBottom:'18px',padding:'20px',background:T.surfaceUp,border:`1px solid ${T.border}`,textAlign:'center'}}>
                    <div style={{fontSize:'28px',marginBottom:'8px'}}>🔒</div>
                    <div style={{fontSize:'13px',fontWeight:700,color:T.textSub,marginBottom:'4px'}}>Pricing not yet revealed</div>
                    <div style={{fontSize:'12px',color:T.textDim,lineHeight:1.6}}>This film's IPO price will be revealed when {PHASE_NAMES[film.phase]} (Phase {film.phase}) opens. You can watchlist it now to be notified.</div>
                  </div>
                )
              }
              const drivers=calcPriceDrivers(film,rosters,phase,players.length,currentWeek,[],allPicks)
              const basePrice=filmValues[film.id]??film.basePrice
              const composite=drivers.ownershipMult*drivers.timeMult*drivers.rtMult*drivers.buzzMult
              const finalPrice=Math.round(basePrice*composite)
              const buzz=calcBuzzIndex({...film,hasResult:false},allPicks,news,rosters,players.length,currentWeek,finalPrice)
              const rows=[
                {label:'Ownership',mult:drivers.ownershipMult,desc:`${rosters.filter(r=>r.film_id===film.id&&r.phase===phase&&r.active).length}/${players.length} players hold`},
                {label:'Time to Release',mult:drivers.timeMult,desc:currentWeek!=null?`${Math.max(0,film.week-currentWeek)} week${film.week-currentWeek===1?'':'s'} out`:'—'},
                {label:'Rotten Tomatoes',mult:drivers.rtMult,desc:film.rt!=null?`${film.rt}% critic score`:'No score yet'},
                {label:'Watchlist Heat',mult:drivers.buzzMult,desc:(()=>{
                  const cutoff=Date.now()-7*86400000
                  const recent=allPicks.filter(p=>p.film_id===film.id&&new Date(p.picked_at).getTime()>cutoff).length
                  return recent?`${recent} added this week`:'Quiet'
                })()},
              ]
              return(
                <div style={{...S.card,marginBottom:'18px',padding:'14px 16px',background:T.surfaceUp,border:`1px solid ${T.border}`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                    <div style={{...S.label,color:T.gold}}>Price Breakdown</div>
                    {buzz!=null&&<div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'10px',color:buzz>=70?T.red:buzz>=50?T.orange:T.textSub}}>
                      <span style={{letterSpacing:'1.5px'}}>BUZZ</span><span style={{fontFamily:T.mono,fontWeight:800,fontSize:'13px'}}>{buzz}</span>
                    </div>}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.border}`,fontSize:'12px'}}>
                    <span style={{color:T.textSub}}>Base price (IPO)</span>
                    <span style={{color:T.text,fontFamily:T.mono,fontWeight:600}}>${film.basePrice}M</span>
                  </div>
                  {rows.map(({label,mult,desc})=>{
                    const pct=Math.round((mult-1)*100)
                    const col=pct>5?T.green:pct<-5?T.red:T.textSub
                    return(
                      <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${T.border}`,fontSize:'12px'}}>
                        <div>
                          <div style={{color:T.text,fontWeight:500}}>{label}</div>
                          <div style={{fontSize:'10px',color:T.textDim,marginTop:'1px'}}>{desc}</div>
                        </div>
                        <div style={{fontFamily:T.mono,fontWeight:700,color:col,fontSize:'13px'}}>{pct>0?'+':''}{pct}%</div>
                      </div>
                    )
                  })}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0 4px',marginTop:'4px'}}>
                    <span style={{...S.label,color:T.gold}}>Live price</span>
                    <span style={{color:T.gold,fontFamily:T.mono,fontWeight:900,fontSize:'18px'}}>${finalPrice}M</span>
                  </div>
                </div>
              )
            })()}
            {/* Embedded trailer */}
            {film.trailer&&film.trailer.includes('youtube.com/embed/')&&(
              <div style={{marginBottom:'20px'}}>
                <div style={{...S.label,marginBottom:'8px'}}>Trailer</div>
                <div style={{position:'relative',paddingBottom:'56.25%',borderRadius:'12px',overflow:'hidden',background:T.surfaceUp}}>
                  <iframe
                    src={`${film.trailer}?rel=0&modestbranding=1`}
                    title={`${film.title} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none',borderRadius:'12px'}}
                  />
                </div>
              </div>
            )}
            {/* ── WEEKLY PERFORMANCE — gross by week + price impact ───── */}
            {actual!=null&&(()=>{
              const weeks=weeklyG[film.id]||{}
              const ipo=film.basePrice
              const valueNow=calcMarketValue(film,actual,weeklyG[film.id]||{})
              const rows=[{wk:1,gross:actual,note:'Opening weekend'}]
              Object.keys(weeks).map(Number).sort((a,b)=>a-b).forEach(w=>{
                const prev=w===2?actual:weeks[w-1]
                const drop=prev?Math.round((1-weeks[w]/prev)*100):null
                rows.push({wk:w,gross:weeks[w],note:drop!=null?`${drop>=0?'−':'+'}${Math.abs(drop)}% vs prior week`:''})
              })
              const cume=rows.reduce((s,r)=>s+r.gross,0)
              return(
                <div style={{...S.card,marginBottom:'20px',background:T.surfaceUp,border:`1px solid ${T.border}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'10px'}}>
                    <div style={{...S.label,color:T.green}}>Weekly Performance</div>
                    <div style={{fontSize:'11px',color:T.textSub,fontFamily:T.mono}}>Cume ${cume.toFixed(1)}M</div>
                  </div>
                  {rows.map(r=>(
                    <div key={r.wk} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:`1px solid ${T.border}`,fontSize:'12px'}}>
                      <span style={{color:T.textSub,width:'36px',fontFamily:T.mono}}>W{r.wk}</span>
                      <span style={{flex:1,fontSize:'10px',color:T.textDim}}>{r.note}</span>
                      <span style={{color:T.text,fontFamily:T.mono,fontWeight:700}}>${r.gross}M</span>
                    </div>
                  ))}
                  <div style={{paddingTop:'8px',marginTop:'4px',borderTop:`1px solid ${T.border}`}}>
                    <div style={{...S.label,color:T.gold,marginBottom:'8px'}}>Settled Price Breakdown</div>
                    {(()=>{
                      const ratio=film.estM?actual/film.estM:1
                      const perf=ratio>=2?2:ratio>=1.5?1.6:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1:ratio>=0.8?0.85:ratio>=0.6?0.65:ratio>=0.4?0.45:0.25
                      const rtMult=film.rt!=null?(film.rt>=90?1.15:film.rt>=75?1.08:film.rt<50?0.9:1):1
                      // Re-derive the weekly legs adjustments exactly as calcMarketValue does
                      const BANDS={2:{std:-0.55,up:0.30,down:-0.15},3:{std:-0.40,up:0.20,down:-0.10},4:{std:-0.35,up:0.15,down:-0.05},5:{std:-0.40,up:0.10,down:0},6:{std:-0.40,up:0.10,down:0}}
                      const wg=weeklyG[film.id]||{}
                      const legRows=[]
                      for(let w=2;w<=6;w++){
                        const c=Number(wg[w]),prev=w===2?actual:Number(wg[w-1])
                        if(!c||!prev||isNaN(c)||isNaN(prev))continue
                        const drop=(c-prev)/prev,band=BANDS[w]
                        let adj
                        if(drop>=band.std){const range=0-band.std;const frac=range>0?Math.min(1,(drop-band.std)/range):0;adj=band.up*frac}
                        else{const range=band.std-(-1);const frac=range>0?Math.min(1,(band.std-drop)/range):0;adj=band.down*frac}
                        legRows.push({label:`Week ${w} legs`,val:`${adj>=0?'+':''}${Math.round(adj*100)}%`,sub:`dropped ${Math.round(drop*100)}% (std ${Math.round(band.std*100)}%)`,col:adj>0?T.green:adj<0?T.red:T.textSub})
                      }
                      const driverRows=[
                        {label:'Base price (IPO)',val:ipo!=null?`$${ipo}M`:'—',sub:'What it floated at',col:T.text},
                        {label:'Box office vs estimate',val:`${perf>=1?'+':''}${Math.round((perf-1)*100)}%`,sub:`$${actual}M actual vs $${film.estM||'?'}M est · ${ratio.toFixed(2)}×`,col:perf>=1?T.green:T.red},
                        ...(film.rt!=null?[{label:'Critics (RT)',val:`${rtMult>=1?'+':''}${Math.round((rtMult-1)*100)}%`,sub:`${film.rt}% score`,col:rtMult>1?T.green:rtMult<1?T.red:T.textSub}]:[]),
                        ...legRows,
                      ]
                      return driverRows.map(d=>(
                        <div key={d.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:'12px'}}>
                          <div><div style={{color:T.text}}>{d.label}</div><div style={{fontSize:'10px',color:T.textDim,marginTop:'1px'}}>{d.sub}</div></div>
                          <div style={{fontFamily:T.mono,fontWeight:700,color:d.col}}>{d.val}</div>
                        </div>
                      ))
                    })()}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0 2px'}}>
                      <span style={{...S.label,color:T.gold}}>Final value</span>
                      <span style={{fontSize:'13px',fontFamily:T.mono}}>
                        {ipo!=null&&<span style={{color:T.textDim}}>${ipo}M → </span>}
                        <span style={{color:valueNow>=(ipo||0)?T.green:T.red,fontWeight:800,fontSize:'17px'}}>${valueNow}M</span>
                        {ipo!=null&&ipo>0&&<span style={{color:valueNow>=ipo?T.green:T.red,fontSize:'11px',marginLeft:'6px'}}>({valueNow>=ipo?'+':''}{Math.round((valueNow/ipo-1)*100)}%)</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}
            {/* ── LEAGUE REVIEWS ─────────────────────────────────────── */}
            {(()=>{
              const filmReviews=reviews.filter(r=>r.film_id===film.id)
              const avg=filmReviews.length?filmReviews.reduce((s,r)=>s+r.rating,0)/filmReviews.length:null
              const myReview=profile?filmReviews.find(r=>r.user_id===profile.id):null
              const released=currentWeek!=null&&film.week<=currentWeek
              return(
                <div style={{marginBottom:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'10px'}}>
                    <div style={S.label}>League Reviews</div>
                    {avg!=null&&<div style={{fontSize:'13px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>★{avg.toFixed(1)} <span style={{fontSize:'10px',color:T.textSub,fontWeight:400}}>· {filmReviews.length}</span></div>}
                  </div>
                  {released&&profile&&onSaveReview&&<ReviewEditor existing={myReview} onSave={(rating,body)=>onSaveReview(film.id,rating,body)} onDelete={myReview&&onDeleteReview?()=>onDeleteReview(myReview.id):null}/>}
                  {!released&&<div style={{fontSize:'11px',color:T.textDim,marginBottom:'10px'}}>Reviews open once the film releases.</div>}
                  {filmReviews.filter(r=>r.user_id!==profile?.id).map(r=>{
                    const p=players.find(pl=>pl.id===r.user_id)
                    const verified=bookingClicks.some(b=>b.user_id===r.user_id&&b.film_id===film.id)
                    const thread=reviewComments.filter(c=>c.review_id===r.id)
                    return(
                      <div key={r.id} style={{background:T.surfaceUp,borderRadius:'10px',padding:'10px 12px',marginBottom:'8px'}}>
                        <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:r.body?'6px':0}}>
                          <div style={{width:'26px',height:'26px',borderRadius:'50%',background:p?.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,flexShrink:0}}>{p?.name?.[0]||'?'}</div>
                          <span style={{fontSize:'12px',fontWeight:700,color:p?.color||T.text}}>{p?.name||'Player'}</span>
                          <span style={{fontSize:'12px',color:T.gold,fontFamily:T.mono}}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                          {verified&&<span title="Booked through BOXD" style={{fontSize:'10px',color:T.green,fontWeight:700}}>🎟 Verified</span>}
                        </div>
                        {r.body&&<div style={{fontSize:'12px',color:T.text,lineHeight:1.6}}>{r.body}</div>}
                        <ReviewThread thread={thread} players={players} onAdd={onAddReviewComment?body=>onAddReviewComment(r.id,body):null}/>
                      </div>
                    )
                  })}
                  {filmReviews.length===0&&released&&<div style={{fontSize:'11px',color:T.textDim}}>No reviews yet — be the first.</div>}
                </div>
              )
            })()}
            {onShowtimes&&<button onClick={()=>onShowtimes(film)} style={{...S.btn,background:`${T.green}18`,border:`1px solid ${T.green}44`,color:T.green,padding:'10px 18px',fontSize:'13px',width:'100%',marginBottom:'12px',textTransform:'none',letterSpacing:0,borderRadius:'10px'}}>🎟 Find Showtimes Near Me</button>}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
              {BOOKING_CHAINS.map(chain=>(
                <a key={chain.id} href={affiliateWrap(`${chain.url}${encodeURIComponent(film.title.toLowerCase().replace(/\s+/g,'-'))}`,chain.id)} target="_blank" rel="noopener noreferrer" onClick={()=>onBookingClick&&onBookingClick(film.id,chain.id)} style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'9px',padding:'8px 14px',textDecoration:'none',fontSize:'12px',color:T.text,fontFamily:T.mono,display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{width:'8px',height:'8px',borderRadius:'50%',background:chain.color,flexShrink:0}}/>{chain.label}
                </a>
              ))}
            </div>
            {eventsForFilm.length>0&&<>
              <div style={{...S.label,marginBottom:'10px'}}>Marketing Timeline</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {eventsForFilm.map(ev=>{const evType=MARKETING_EVENT_TYPES.find(t=>t.id===ev.event_type);return(
                  <div key={ev.id} style={{display:'flex',gap:'12px',alignItems:'center',padding:'10px 12px',background:T.surfaceUp,borderRadius:'9px'}}>
                    <span style={{fontSize:'18px'}}>{evType?.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:500}}>{ev.label}</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{evType?.label} · {new Date(ev.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div></div>
                  </div>
                )})}
              </div>
            </>}
          </div>
        )}
        {tab==='intent'&&(
          <div style={{flex:1,overflowY:'auto',padding:'16px 24px 24px'}}>
            <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
              <StatBox label="Total picks" value={pickCount} color={T.gold}/>
              <StatBox label="This week" value={vel7} color={vel7>=5?T.red:vel7>=2?T.orange:T.text}/>
              <StatBox label="Today" value={vel1} color={vel1>0?T.green:T.text}/>
            </div>
            {pickCount>0&&<div style={{background:T.surfaceUp,borderRadius:'12px',padding:'16px',marginBottom:'16px',overflowX:'auto'}}><VelocitySparkline filmId={film.id} allPicks={allPicks} marketingEvents={marketingEvents} width={560} height={60}/></div>}
            {pickCount===0&&<div style={{fontSize:'13px',color:T.textSub,padding:'32px 0',textAlign:'center'}}>No picks yet — be the first!</div>}
          </div>
        )}
        {tab==='comments'&&(
          <>
            <div style={{flex:1,overflowY:'auto',padding:'12px 24px'}}>
              {comments.filter(c=>!c.parent_id).length===0&&<div style={{fontSize:'14px',color:T.textSub,padding:'20px 0'}}>No comments yet — start the conversation!</div>}
              {comments.filter(c=>!c.parent_id).map(c=>(
                <CommentNode key={c.id} comment={c} comments={comments} players={players} profile={profile}
                  commentLikes={commentLikes} onLike={toggleCommentLike} onReply={postReply}
                  onDelete={cid=>supabase.from('film_comments').delete().eq('id',cid).then(loadComments)} depth={0} isAdmin={isAdmin}/>
              ))}
            </div>
            <div style={{padding:'14px 24px 24px',borderTop:`1px solid ${T.border}`,flexShrink:0}}>
              {gifUrl&&(
                <div style={{position:'relative',display:'inline-block',marginBottom:'8px'}}>
                  <img src={gifUrl} alt="" style={{maxHeight:'80px',borderRadius:'8px'}}/>
                  <button onClick={()=>setGifUrl('')} style={{position:'absolute',top:'-6px',right:'-6px',background:T.red,color:'#fff',border:'none',borderRadius:'50%',width:'20px',height:'20px',cursor:'pointer',fontSize:'11px'}}>×</button>
                </div>
              )}
              {gifPickerOpen&&<GifPicker onPick={u=>{setGifUrl(u);setGifPickerOpen(false)}} onClose={()=>setGifPickerOpen(false)}/>}
              <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                <button onClick={()=>setGifPickerOpen(true)} title="Add a GIF" style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'10px',color:T.gold,fontSize:'11px',fontWeight:700,padding:'12px 12px',cursor:'pointer',flexShrink:0}}>GIF</button>
                <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&postWithGif()} placeholder="Add a comment… @ to mention" style={{...S.inp,flex:1,fontSize:'15px',padding:'13px 16px'}}/>
                <Btn onClick={postWithGif} color={T.blue} textColor="#fff" size="lg">Post</Btn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TradeModal({profile,players,rosters,films,filmVal,curPhase,onClose,notify,onDone,league}){
  const[target,setTarget]=useState('')
  const[myFilm,setMyFilm]=useState('')
  const[theirFilm,setTheirFilm]=useState('')
  const ph=curPhase()
  const myR=rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id))
  const theirR=rosters.filter(r=>r.player_id===target&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id))
  const mf=films.find(f=>f.id===myFilm),tf=films.find(f=>f.id===theirFilm)
  const propose=async()=>{
    if(!target||!myFilm||!theirFilm) return notify('Fill all fields',T.red)
    const{data,error}=await supabase.from('trades').insert({proposer_id:profile.id,receiver_id:target,proposer_film_id:myFilm,receiver_film_id:theirFilm,status:'pending',phase:ph,league_id:league?.id}).select().single()
    if(error) return notify(error.message,T.red)
    await logActivity(profile.id,'trade_proposed',{player_name:profile.name,my_film:mf?.title,their_film:tf?.title},league?.id)
    notify('Trade proposal sent!',T.blue);onDone()
  }
  return(
    <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:700}} onClick={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px 20px 0 0',padding:'24px',width:'100%',maxWidth:'480px',maxHeight:'85vh',overflowY:'auto',paddingBottom:'calc(24px + env(safe-area-inset-bottom))',animation:'slideUp .25s ease'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 20px'}}/>
        <div style={{fontSize:'20px',fontWeight:700,color:T.blue,marginBottom:'6px'}}>🔄 Propose Trade</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'20px'}}>Phase {ph} films only · swaps are instant on acceptance</div>
        <div style={{marginBottom:'14px'}}><div style={{...S.label,marginBottom:'6px'}}>Trade with</div>
          <select value={target} onChange={e=>{setTarget(e.target.value);setTheirFilm('')}} style={S.inp}>
            <option value="">Select player…</option>
            {players.filter(p=>p.id!==profile.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
          <div><div style={{...S.label,marginBottom:'6px'}}>You give</div>
            <select value={myFilm} onChange={e=>setMyFilm(e.target.value)} style={{...S.inp,fontSize:'12px'}}>
              <option value="">Your film…</option>
              {myR.map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title}</option>:null})}
            </select>
          </div>
          <div><div style={{...S.label,marginBottom:'6px'}}>You get</div>
            <select value={theirFilm} onChange={e=>setTheirFilm(e.target.value)} disabled={!target} style={{...S.inp,fontSize:'12px',opacity:target?1:0.4}}>
              <option value="">Their film…</option>
              {theirR.map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title}</option>:null})}
            </select>
          </div>
        </div>
        {mf&&tf&&<div style={{background:T.surfaceUp,borderRadius:'12px',padding:'14px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'16px'}}><FilmPoster film={mf} width={44} height={66} radius={6}/><div style={{flex:1,textAlign:'center',color:T.textSub,fontSize:'22px'}}>⇄</div><FilmPoster film={tf} width={44} height={66} radius={6}/></div>}
        <div style={{display:'flex',gap:'10px'}}>
          <Btn onClick={onClose} variant="outline" color={T.textSub} sx={{flex:1}} size="lg">Cancel</Btn>
          <Btn onClick={propose} color={T.blue} textColor="#fff" sx={{flex:2}} size="lg">Send Proposal</Btn>
        </div>
      </div>
    </div>
  )
}


function ShowtimesModal({film,onClose,onBookingClick,supabaseUrl,anonKey}){
  const[state,setState]=useState('idle')
  const[error,setError]=useState('')
  const[cinemas,setCinemas]=useState([])
  const[date,setDate]=useState(new Date().toISOString().split('T')[0])
  const[radius,setRadius]=useState('10')
  const[coords,setCoords]=useState(null)
  const[postcode,setPostcode]=useState('')
  const[method,setMethod]=useState('gps')
  const EDGE_URL=`${supabaseUrl}/functions/v1/showtimes`
  const fetchShowtimes=async(lat,lon)=>{
    setState('loading');setError('')
    try{
      const params=new URLSearchParams({lat:lat.toString(),lon:lon.toString(),title:film.title,date,radius})
      const res=await fetch(`${EDGE_URL}?${params}`,{headers:{'Content-Type':'application/json','apikey':anonKey||'','Authorization':`Bearer ${anonKey||''}`}})
      const text=await res.text();let data;try{data=JSON.parse(text)}catch{throw new Error(`Bad response: ${text.substring(0,100)}`)}
      if(!res.ok) throw new Error(data?.error||`HTTP ${res.status}`)
      setCinemas(data.cinemas||[]);setState('done')
    }catch(e){setError(e.message);setState('error')}
  }
  const locateGPS=()=>{
    setState('locating')
    if(!navigator.geolocation){setError('Geolocation not supported');setState('error');return}
    navigator.geolocation.getCurrentPosition(pos=>{const{latitude:lat,longitude:lon}=pos.coords;setCoords({lat,lon});fetchShowtimes(lat,lon)},()=>{setError('Location denied — try postcode instead');setState('error')},{timeout:8000})
  }
  const locatePostcode=async()=>{
    if(!postcode.trim()) return;setState('locating')
    try{const res=await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);const data=await res.json();if(data.status!==200) throw new Error('Invalid postcode');const{latitude:lat,longitude:lon}=data.result;setCoords({lat,lon});fetchShowtimes(lat,lon)}
    catch{setError('Postcode not found');setState('error')}
  }
  const dates=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d.toISOString().split('T')[0]})
  const formatDate=d=>{const today=new Date().toISOString().split('T')[0],tom=new Date(Date.now()+86400000).toISOString().split('T')[0];if(d===today)return'Today';if(d===tom)return'Tomorrow';return new Date(d).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
  return(
    <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:900}} onClick={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:'600px',maxHeight:'90vh',display:'flex',flexDirection:'column',animation:'slideUp .25s ease',paddingBottom:'env(safe-area-inset-bottom)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'20px 20px 0',flexShrink:0}}>
          <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 16px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'16px'}}>
            <FilmPoster film={film} width={44} height={66} radius={7}/>
            <div style={{flex:1}}><div style={{fontSize:'16px',fontWeight:700}}>{film.title}</div><div style={{fontSize:'12px',color:T.textSub,marginTop:'3px'}}>🎟 Showtimes near you · UK</div></div>
            <button onClick={onClose} style={{background:'none',border:`1px solid ${T.border}`,color:T.textSub,borderRadius:'8px',padding:'6px 12px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px'}}>✕</button>
          </div>
          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px',marginBottom:'14px'}}>
            {dates.map(d=><button key={d} onClick={()=>{setDate(d);if(coords)setTimeout(()=>fetchShowtimes(coords.lat,coords.lon),0)}} style={{...S.btn,background:d===date?T.gold:T.surfaceUp,color:d===date?'#0D0A08':T.textSub,border:`1px solid ${d===date?T.gold:T.border}`,padding:'7px 14px',fontSize:'12px',flexShrink:0,textTransform:'none',letterSpacing:0}}>{formatDate(d)}</button>)}
          </div>
          <div style={{display:'flex',gap:'6px',marginBottom:'14px',alignItems:'center'}}>
            <span style={{fontSize:'12px',color:T.textSub,flexShrink:0}}>Within</span>
            {['5','10','20','30'].map(r=><button key={r} onClick={()=>{setRadius(r);if(coords)setTimeout(()=>fetchShowtimes(coords.lat,coords.lon),0)}} style={{...S.btn,background:r===radius?T.gold:T.surfaceUp,color:r===radius?'#0D0A08':T.textSub,border:`1px solid ${r===radius?T.gold:T.border}`,padding:'5px 12px',fontSize:'11px',textTransform:'none',letterSpacing:0}}>{r}mi</button>)}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'0 20px 20px'}}>
          {(state==='idle'||state==='error')&&<div>
            <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
              <button onClick={()=>setMethod('gps')} style={{...S.btn,background:method==='gps'?`${T.blue}22`:T.surfaceUp,color:method==='gps'?T.blue:T.textSub,border:`1px solid ${method==='gps'?T.blue+'66':T.border}`,padding:'8px 16px',fontSize:'12px',flex:1,textTransform:'none',letterSpacing:0}}>📍 Use my location</button>
              <button onClick={()=>setMethod('postcode')} style={{...S.btn,background:method==='postcode'?`${T.blue}22`:T.surfaceUp,color:method==='postcode'?T.blue:T.textSub,border:`1px solid ${method==='postcode'?T.blue+'66':T.border}`,padding:'8px 16px',fontSize:'12px',flex:1,textTransform:'none',letterSpacing:0}}>📮 Enter postcode</button>
            </div>
            {method==='gps'?<Btn onClick={locateGPS} color={T.blue} textColor="#fff" full size="lg">Find Cinemas Near Me</Btn>:<div style={{display:'flex',gap:'8px'}}><input value={postcode} onChange={e=>setPostcode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&locatePostcode()} placeholder="e.g. SW1A 1AA" style={{...S.inp,flex:1,textTransform:'uppercase'}}/><Btn onClick={locatePostcode} color={T.blue} textColor="#fff" size="lg">Search</Btn></div>}
            {state==='error'&&<div style={{marginTop:'10px'}}>
              <div style={{fontSize:'13px',color:T.red,padding:'10px 14px',background:`${T.red}12`,borderRadius:'9px',marginBottom:'10px'}}>⚠️ {error}</div>
              <div style={{...S.label,marginBottom:'8px'}}>Book direct instead</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {BOOKING_CHAINS.map(chain=>(
                  <a key={chain.id} href={affiliateWrap(chain.url,chain.id)} target="_blank" rel="noopener noreferrer"
                    onClick={()=>onBookingClick&&onBookingClick(film.id,chain.id)}
                    style={{background:T.surfaceUp,border:`1px solid ${chain.color}66`,borderRadius:'9px',padding:'9px 14px',fontSize:'12px',color:T.text,textDecoration:'none',fontWeight:600}}>
                    {chain.label} ↗
                  </a>
                ))}
              </div>
            </div>}
          </div>}
          {state==='locating'&&<div style={{textAlign:'center',padding:'40px 0',color:T.textSub}}><div style={{fontSize:'32px',marginBottom:'12px'}}>📍</div><div>Finding your location…</div></div>}
          {state==='loading'&&<div style={{textAlign:'center',padding:'40px 0',color:T.textSub}}><div style={{fontSize:'32px',marginBottom:'12px'}}>🎬</div><div style={{marginBottom:'8px'}}>Searching for showtimes…</div><div style={{width:'40px',height:'3px',background:T.gold,borderRadius:'2px',margin:'0 auto',animation:'pulse 1.2s ease-in-out infinite'}}/></div>}
          {state==='done'&&<>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <div style={{fontSize:'13px',color:T.textSub}}>{cinemas.length} cinema{cinemas.length!==1?'s':''} · {formatDate(date)}</div>
              <button onClick={()=>coords&&fetchShowtimes(coords.lat,coords.lon)} style={{background:'none',border:`1px solid ${T.border}`,color:T.textSub,borderRadius:'7px',padding:'5px 12px',cursor:'pointer',fontFamily:T.mono,fontSize:'11px'}}>↻ Refresh</button>
            </div>
            {cinemas.length===0?<div style={{...S.card,textAlign:'center',padding:'40px 24px'}}><div style={{fontSize:'32px',marginBottom:'12px'}}>🍿</div><div style={{fontSize:'14px',fontWeight:600,marginBottom:'6px'}}>No showtimes found</div><div style={{fontSize:'13px',color:T.textSub}}>Try a wider radius or different date</div></div>:cinemas.map(cinema=>{
              const chain=CHAIN_META[cinema.chain]||CHAIN_META.indie
              return(
                <div key={cinema.id} style={{...S.card,marginBottom:'10px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <div style={{width:'10px',height:'10px',borderRadius:'50%',background:chain.color,flexShrink:0}}/>
                    <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:600}}>{cinema.name}</div></div>
                    {cinema.url&&<a href={cinema.url} target="_blank" rel="noopener noreferrer" onClick={()=>onBookingClick&&onBookingClick(film.id,cinema.chain)} style={{fontSize:'11px',color:chain.color,textDecoration:'none',border:`1px solid ${chain.color}55`,borderRadius:'7px',padding:'4px 10px',flexShrink:0}}>Website →</a>}
                  </div>
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    {(cinema.times||[]).map((t,i)=>{const bookUrl=t.bookUrl||cinema.url||chain.bookBase;return<a key={i} href={bookUrl||'#'} target={bookUrl?'_blank':'_self'} rel="noopener noreferrer" onClick={()=>bookUrl&&onBookingClick&&onBookingClick(film.id,cinema.chain)} style={{background:bookUrl?`${chain.color}18`:T.surfaceUp,border:`1px solid ${bookUrl?chain.color+'44':T.border}`,borderRadius:'9px',padding:'8px 14px',textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',minWidth:'64px'}}><span style={{fontSize:'15px',fontWeight:700,color:bookUrl?chain.color:T.text,fontFamily:T.mono}}>{t.time}</span>{t.price&&<span style={{fontSize:'10px',color:T.textSub}}>{t.price}</span>}</a>})}
                  </div>
                </div>
              )
            })}
          </>}
        </div>
      </div>
    </div>
  )
}


class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={err:null}}
  static getDerivedStateFromError(err){return{err}}
  componentDidCatch(err,info){try{console.error('BOXD error:',err,info)}catch{}}
  render(){
    if(this.state.err){
      return React.createElement('div',{style:{minHeight:'100vh',background:'#0D0A08',color:'#F2EAE0',fontFamily:'monospace',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',textAlign:'center'}},
        React.createElement('div',{style:{maxWidth:'380px'}},
          React.createElement('div',{style:{fontSize:'42px',fontWeight:900,color:'#E8A020',marginBottom:'12px'}},'BOXD'),
          React.createElement('div',{style:{fontSize:'16px',marginBottom:'8px'}},'Something went wrong'),
          React.createElement('div',{style:{fontSize:'13px',color:'#8A7A6E',marginBottom:'24px',lineHeight:1.6}},'The app hit an unexpected error. Reloading usually fixes it — your data is safe.'),
          React.createElement('button',{onClick:()=>window.location.reload(),style:{background:'#E8A020',color:'#0D0A08',border:'none',borderRadius:'10px',padding:'14px 28px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'monospace'}},'Reload BOXD')
        )
      )
    }
    return this.props.children
  }
}

function AppInner(){
  const[session,setSession]=useState(null)
  const[loading,setLoading]=useState(true)
  const[dataLoading,setDataLoading]=useState(false)
  const[loadError,setLoadError]=useState(null)
  const[syncLog,setSyncLog]=useState(null)
  const[syncBusy,setSyncBusy]=useState(false)
  const[reviews,setReviews]=useState([])
  const[allComments,setAllComments]=useState([])
  const loadAllComments=async(lid)=>{
    const id=lid||league?.id;if(!id)return
    // Load comments for this league OR with no league stamp (older rows),
    // so the Buzz feed doesn't silently drop them.
    const{data}=await supabase.from('film_comments').select('*').or(`league_id.eq.${id},league_id.is.null`).order('created_at',{ascending:false}).limit(80)
    if(data)setAllComments(data)
  }
  const[screenings,setScreenings]=useState([])
  const[attendees,setAttendees]=useState([])
  const loadScreenings=async(lid)=>{
    const id=lid||league?.id;if(!id)return
    const{data:s}=await supabase.from('screenings').select('*').eq('league_id',id).order('screening_at',{ascending:true})
    if(s)setScreenings(s)
    const{data:a}=await supabase.from('screening_attendees').select('*')
    if(a)setAttendees(a)
  }
  const hostScreening=async({filmId,cinema,city,at,note,bookingUrl})=>{
    if(profile?.is_banned)return notify('You are unable to post in this league',T.red)
    if(!profile)return notify('Create a profile first',T.red)
    const{data,error}=await supabase.from('screenings').insert({league_id:league?.id,host_id:profile.id,film_id:filmId,cinema,city,screening_at:at||null,note:note||null,booking_url:bookingUrl||null}).select().maybeSingle()
    if(error)return notify(`Couldn't post: ${error.message}`,T.red)
    if(data)await supabase.from('screening_attendees').insert({screening_id:data.id,user_id:profile.id})
    const f=films.find(fl=>fl.id===filmId)
    await logActivity(profile.id,'screening',{film_title:f?.title,cinema,player_name:profile.name},league?.id)
    notify('🎟 Screening posted',T.green);loadScreenings()
  }
  const toggleAttend=async(screeningId)=>{
    const mine=attendees.find(a=>a.screening_id===screeningId&&a.user_id===profile.id)
    if(mine)await supabase.from('screening_attendees').delete().eq('id',mine.id)
    else await supabase.from('screening_attendees').insert({screening_id:screeningId,user_id:profile.id})
    loadScreenings()
  }
  const cancelScreening=async(id)=>{
    if(!await confirmModal('Cancel this screening?',{danger:true}))return
    await supabase.from('screenings').delete().eq('id',id)
    loadScreenings();notify('Screening cancelled',T.textSub)
  }
  const[reviewComments,setReviewComments]=useState([])
  const loadReviewComments=async()=>{const{data}=await supabase.from('review_comments').select('*').order('created_at',{ascending:true});if(data)setReviewComments(data)}
  const addReviewComment=async(reviewId,body)=>{
    if(!profile||!body.trim())return
    await supabase.from('review_comments').insert({review_id:reviewId,user_id:profile.id,body:body.trim()})
    loadReviewComments()
  }
  const[searchOpen,setSearchOpen]=useState(false)
  const saveReview=async(filmId,rating,body)=>{
    if(!profile)return notify('Create a profile first',T.red)
    if(profile.is_banned)return notify('You are unable to post in this league',T.red)
    const existing=reviews.find(r=>r.user_id===profile.id&&r.film_id===filmId)
    if(existing)await supabase.from('film_reviews').update({rating,body:body||null,updated_at:new Date().toISOString()}).eq('id',existing.id)
    else await supabase.from('film_reviews').insert({league_id:league?.id,user_id:profile.id,film_id:filmId,rating,body:body||null})
    const{data}=await supabase.from('film_reviews').select('*').eq('league_id',league?.id).order('updated_at',{ascending:false})
    if(data)setReviews(data)
    notify(existing?'✏️ Review updated':'⭐ Review posted',T.gold)
  }
  const deleteReview=async(reviewId)=>{
    await supabase.from('film_reviews').delete().eq('id',reviewId)
    setReviews(reviews.filter(r=>r.id!==reviewId))
    notify('Review removed',T.textSub)
  }
  // ── PWA INSTALL ───────────────────────────────────────────────────────────
  const isStandalone=window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'')
  const[installEvt,setInstallEvt]=useState(null)
  const[installHidden,setInstallHidden]=useState(()=>{try{return localStorage.getItem('boxd_install_hidden')==='1'}catch{return true}})
  useEffect(()=>{
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{})
    const onPrompt=e=>{e.preventDefault();setInstallEvt(e)}
    window.addEventListener('beforeinstallprompt',onPrompt)
    return()=>window.removeEventListener('beforeinstallprompt',onPrompt)
  },[])
  const[profile,setProfile]=useState(null)
  const[page,setPage]=useState('market')
  const[commishTab,setCommishTab]=useState('phase')
  const[communityTab,setCommunityTab]=useState('buzz')
  const[distSel,setDistSel]=useState(null)
  const[distFilmId,setDistFilmId]=useState('')
  const[warEntries,setWarEntries]=useState({})
  const[warFilterPhase,setWarFilterPhase]=useState('all')
  const[warFilterStatus,setWarFilterStatus]=useState('pending')
  const[warSearch,setWarSearch]=useState('')
  const[players,setPlayers]=useState([])
  const[rosters,setRosters]=useState([])
  const[results,setResults]=useState({})
  const[filmValues,setFilmValues]=useState({})
  const[weeklyG,setWeeklyG]=useState({})
  const[chips,setChips]=useState(null)
  const[allChips,setAllChips]=useState([])
  const[films,setFilms]=useState([])
  const[forecasts,setForecasts]=useState({})
  const[allForecasts,setAllForecasts]=useState([])
  const[oscarPreds,setOscarPreds]=useState([])
  const[myOscar,setMyOscar]=useState(null)
  const[auteurDecl,setAuteurDecl]=useState([])
  const[wwWinners,setWwWinners]=useState({})
  const[phaseBudgets,setPhaseBudgets]=useState([])
  const[trades,setTrades]=useState([])
  const[cfg,setCfg]=useState({current_week:1,current_phase:1,currency:'$',tx_fee:5,phase_window_active:false,phase_window_opened_at:null})
  const[feedItems,setFeedItems]=useState([])
  const[notif,setNotif]=useState(null)
  const[trailerFilm,setTrailerFilm]=useState(null)
  const[chipModal,setChipModal]=useState(null)
  const[scoreModal,setScoreModal]=useState(null)
  const[filmDetail,setFilmDetail]=useState(null)
  const[profilePlayer,setProfilePlayer]=useState(null)
  const[prevPage,setPrevPage]=useState('league')
  const[tradeModal,setTradeModal]=useState(false)
  const[addFilm,setAddFilm]=useState(false)
  const[newFilm,setNewFilm]=useState({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:'',affiliateUrl:'',tmdbId:''})
  const[auteurActor,setAuteurActor]=useState('')
  const[auteurFilms,setAuteurFilms]=useState([])
  const[moreOpen,setMoreOpen]=useState(false)
  const[sidebarOpen,setSidebarOpen]=useState(true)
  const[allPicks,setAllPicks]=useState([])
  const[marketingEvents,setMarketingEvents]=useState([])
  const[bookingClicks,setBookingClicks]=useState([])
  const[showtimesFilm,setShowtimesFilm]=useState(null)
  const[sealedBids,setSealedBids]=useState([])
  const[league,setLeague]=useState(null)
  const[myLeagues,setMyLeagues]=useState([])
  const[publicLeagues,setPublicLeagues]=useState([])
  const[leaguePage,setLeaguePage]=useState('lobby')
  const[inviteCode,setInviteCode]=useState('')
  const[newLeagueName,setNewLeagueName]=useState('')
  const[ingestLog,setIngestLog]=useState(null)
  const[phaseTransitioning,setPhaseTransitioning]=useState(false)
  const[phaseCeremony,setPhaseCeremony]=useState(null)
  const[shareCardFilm,setShareCardFilm]=useState(null)
  const[confettiActive,setConfettiActive]=useState(false)
  const[standingsSnapshot,setStandingsSnapshot]=useState({})
  const[wrappedOpen,setWrappedOpen]=useState(false)
  const[profileEditOpen,setProfileEditOpen]=useState(false)
  const[feedReactions,setFeedReactions]=useState({})
  const[news,setNews]=useState([])
  const[fridayForecasts,setFridayForecasts]=useState([])
  const[newSignalOpen,setNewSignalOpen]=useState(false)
  // Post-launch: Movie of the Week
  const[movieOfWeek,setMovieOfWeek]=useState(null)
  const[motwModalOpen,setMotwModalOpen]=useState(false)
  // Post-launch: Quick polls
  const[polls,setPolls]=useState([])
  const[pollVotes,setPollVotes]=useState([])
  const[newPollOpen,setNewPollOpen]=useState(false)
  const[resultsDismissedWk,setResultsDismissedWk]=useState(null)
  const[onboardOpen,setOnboardOpen]=useState(false)
  const[confirmState,setConfirmState]=useState(null) // {message,resolve,danger}
  const confirmModal=(message,opts={})=>new Promise(resolve=>{
    setConfirmState({message,resolve,danger:opts.danger,confirmLabel:opts.confirmLabel||'Confirm',cancelLabel:opts.cancelLabel||'Cancel'})
  })
  const[onboardStep,setOnboardStep]=useState(0)
  const[tourStep,setTourStep]=useState(-1) // -1 = not touring
  const TOUR_PAGES=['market','roster','league','intent','community','forecaster','market']
  useEffect(()=>{
    if(tourStep>=0&&tourStep<TOUR_PAGES.length)setPage(TOUR_PAGES[tourStep])
  },[tourStep])
  useEffect(()=>{
    // Show the guided intro once, to players who haven't bought anything yet
    if(!profile||!league)return
    if(localStorage.getItem('boxd_onboard_done'))return
    const hasBought=rosters.some(r=>r.player_id===profile.id)
    if(!hasBought){
      const t=setTimeout(()=>setOnboardOpen(true),800)
      return()=>clearTimeout(t)
    }
  },[profile,league])
  const[notifPerm,setNotifPerm]=useState(typeof Notification!=='undefined'?Notification.permission:'unsupported')
  const requestNotifs=async()=>{
    if(typeof Notification==='undefined')return notify('Notifications not supported on this device',T.textSub)
    const perm=await Notification.requestPermission()
    setNotifPerm(perm)
    if(perm==='granted'){
      notify('🔔 Notifications on — we\'ll ping you on results day',T.green)
      try{
        const reg=await navigator.serviceWorker.ready
        reg.showNotification('BOXD',{body:'You\'re all set. Results-day alerts are on.',icon:'/icon-192.png',badge:'/icon-192.png'})
      }catch{}
    }else if(perm==='denied'){
      notify('Notifications blocked — enable them in your browser settings',T.textSub)
    }
  }
  // Fire a local notification once when fresh results land (if permission granted)
  const notifiedResultsRef=useRef(null)
  useEffect(()=>{
    if(notifPerm!=='granted'||!profile)return
    const wk=cfg.current_week-1
    const scored=films.filter(f=>f.week===wk&&results[f.id]!=null)
    if(scored.length===0)return
    const seenKey=`boxd_notif_w${wk}`
    if(notifiedResultsRef.current===wk||localStorage.getItem(seenKey))return
    notifiedResultsRef.current=wk
    localStorage.setItem(seenKey,'1')
    const mine=scored.filter(f=>rosters.find(r=>r.player_id===profile.id&&r.film_id===f.id))
    navigator.serviceWorker?.ready?.then(reg=>{
      reg.showNotification('🎬 Results are in!',{
        body:mine.length>0?`${mine.length} of your films just scored — see how you did.`:`${scored.length} films just scored this week.`,
        icon:'/icon-192.png',badge:'/icon-192.png',tag:`results-w${wk}`,
      })
    }).catch(()=>{})
  },[cfg.current_week,results,notifPerm,profile])
  // Bulk slate builder state
  const[bulkFilmsCsv,setBulkFilmsCsv]=useState('')
  const[bulkFilmsPreview,setBulkFilmsPreview]=useState(null)
  const[bulkGrossesCsv,setBulkGrossesCsv]=useState('')
  const[bulkGrossesPreview,setBulkGrossesPreview]=useState(null)
  const[bulkBusy,setBulkBusy]=useState(false)
  const triggerConfetti=()=>{
    setConfettiActive(true)
    setTimeout(()=>setConfettiActive(false),3000)
    haptic.success()
  }
  const nowRef=useRef(Date.now())
  const isMobile=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

  useEffect(()=>{
    const el=document.createElement('style');el.textContent=GLOBAL_CSS;document.head.appendChild(el)
    const setMeta=(name,content,prop='name')=>{let m=document.querySelector(`meta[${prop}="${name}"]`);if(!m){m=document.createElement('meta');m.setAttribute(prop,name);document.head.appendChild(m)}m.setAttribute('content',content)}
    setMeta('theme-color','#0D0A08')
    setMeta('apple-mobile-web-app-capable','yes')
    setMeta('apple-mobile-web-app-status-bar-style','black-translucent')
    setMeta('apple-mobile-web-app-title','BOXD')
    setMeta('viewport','width=device-width,initial-scale=1,viewport-fit=cover')
    document.title='BOXD · Fantasy Box Office'
    if(!document.querySelector('link[rel="manifest"]')){
      const lnk=document.createElement('link');lnk.rel='manifest';lnk.href='/manifest.json';document.head.appendChild(lnk)
    }
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{})
    }
    return()=>document.head.removeChild(el)
  },[])
  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false)});supabase.auth.onAuthStateChange((_,s)=>setSession(s))},[])
  useEffect(()=>{if(session){loadProfile();loadLeagues();loadPicks();loadMarketingEvents();loadBookingClicks()}},[session])
  useEffect(()=>{const t=setInterval(()=>{nowRef.current=Date.now()},1000);return()=>clearInterval(t)},[])
  // Sync the dismissed-banner state from localStorage whenever current_week changes
  useEffect(()=>{
    if(typeof localStorage==='undefined')return
    const wk=cfg?.current_week
    if(wk==null)return
    const key=`boxd_results_seen_w${wk-1}`
    setResultsDismissedWk(localStorage.getItem(key)==='1'?wk-1:null)
  },[cfg?.current_week])
  useEffect(()=>{
    if(!session) return
    const ch=supabase.channel('rt')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'activity_feed'},()=>loadFeed(league?.id))
      .on('postgres_changes',{event:'*',schema:'public',table:'trades'},()=>loadTrades(league?.id))
      .on('postgres_changes',{event:'*',schema:'public',table:'film_picks'},()=>loadPicks())
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[session])

  const notify=(msg,color=T.gold)=>{setNotif({msg,color});setTimeout(()=>setNotif(null),3000)}
  const updateLeagueConfig=async(patch)=>{
    // Update and RETURN the row so we can confirm it actually changed.
    // (.select() after .update() returns [] when zero rows matched — that's
    //  the silent failure that made the week "say" it moved but not move.)
    let{data,error}=await supabase.from('league_config').update(patch).eq('league_id',league?.id).select()
    if(error){notify(`Config error: ${error.message}`,T.red);return false}
    if(!data||data.length===0){
      // Nothing matched on league_id — the row's league_id is probably null/wrong.
      // Find the actual config row and update it by its primary key instead,
      // stamping the correct league_id on the way through.
      const{data:rows}=await supabase.from('league_config').select('*')
      const target=(rows||[]).find(r=>r.league_id===league?.id)||(rows||[])[0]
      if(!target){
        const{error:insErr}=await supabase.from('league_config').insert({league_id:league?.id,current_week:1,current_phase:1,...patch})
        if(insErr){notify(`Config error: ${insErr.message}`,T.red);return false}
      }else{
        const{data:fixed,error:e2}=await supabase.from('league_config').update({...patch,league_id:league?.id}).eq('id',target.id).select()
        if(e2){notify(`Config error: ${e2.message}`,T.red);return false}
        if(!fixed||fixed.length===0){notify('Update blocked — likely a database permission (RLS) issue on league_config',T.red);return false}
      }
    }
    await loadData(league?.id)
    return true
  }
  const goToProfile=(player)=>{setPrevPage(page);setProfilePlayer(player);setPage('profile')}
  const isCommissioner=session?.user?.email===COMMISSIONER_EMAIL||league?.commissioner_id===session?.user?.id
  const isAdmin=session?.user?.email===COMMISSIONER_EMAIL // central moderator (you)

  const loadProfile=async()=>{const{data}=await supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle();if(data){setProfile(data);if(data.active_league_id)loadLeagueById(data.active_league_id)}}
  const loadLeagues=async()=>{const{data}=await supabase.from('league_members').select('league_id,role,leagues(*)').eq('user_id',session.user.id);if(data)setMyLeagues(data.map(m=>({...m.leagues,myRole:m.role})))}
  const loadLeagueById=async(leagueId)=>{const{data}=await supabase.from('leagues').select('*').eq('id',leagueId).maybeSingle();if(data){setLeague(data);loadData(leagueId);loadFeed(leagueId);loadTrades(leagueId)}}
  const enterLeague=async(lg)=>{setLeague(lg);await supabase.from('profiles').update({active_league_id:lg.id}).eq('id',session.user.id);loadData(lg.id);loadFeed(lg.id);loadTrades(lg.id)}
  const createLeague=async()=>{
    if(!newLeagueName.trim()) return notify('Enter a league name',T.red)
    const code='BOXD-'+Math.random().toString(36).substring(2,6).toUpperCase()
    const{data,error}=await supabase.from('leagues').insert({name:newLeagueName.trim(),commissioner_id:session.user.id,invite_code:code}).select().single()
    if(error) return notify(error.message,T.red)
    await supabase.from('league_members').insert({league_id:data.id,user_id:session.user.id,role:'commissioner'})
    await supabase.from('league_config').insert({league_id:data.id,current_week:1,current_phase:1,currency:'$',tx_fee:5,phase_window_active:false,draft_window_open:false,sealed_bid_window_open:false})
    notify(`✅ League created! Code: ${code}`,T.green);setNewLeagueName('');loadLeagues();enterLeague(data)
  }
  const joinLeague=async()=>{
    const code=inviteCode.trim().toUpperCase()
    if(!code) return notify('Enter an invite code',T.red)
    const{data:lg,error}=await supabase.from('leagues').select('*').eq('invite_code',code).maybeSingle()
    if(error||!lg) return notify('Invalid invite code',T.red)
    const{error:e2}=await supabase.from('league_members').insert({league_id:lg.id,user_id:session.user.id,role:'player'})
    if(e2&&!e2.message?.includes('duplicate')) return notify(e2.message,T.red)
    notify(`Joined ${lg.name}!`,T.green);setInviteCode('');loadLeagues();enterLeague(lg)
  }
  const loadPublicLeagues=async()=>{
    const{data}=await supabase.from('leagues').select('*').eq('is_public',true).order('member_count',{ascending:false}).limit(30)
    if(data)setPublicLeagues(data.filter(lg=>!myLeagues.some(m=>m.id===lg.id)))
  }
  const joinPublicLeague=async(lg)=>{
    const{error}=await supabase.from('league_members').insert({league_id:lg.id,user_id:session.user.id,role:'player'})
    if(error&&!error.message?.includes('duplicate'))return notify(error.message,T.red)
    await supabase.from('leagues').update({member_count:(lg.member_count||0)+1}).eq('id',lg.id)
    notify(`Joined ${lg.name}!`,T.green);loadLeagues();enterLeague(lg)
  }
  const leaveLeague=async()=>{
    if(!league)return;
    if(!await confirmModal(`Leave ${league.name}?`,{danger:true})) return
    await supabase.from('league_members').delete().eq('league_id',league.id).eq('user_id',session.user.id)
    await supabase.from('profiles').update({active_league_id:null}).eq('id',session.user.id)
    setLeague(null);loadLeagues()
  }
  const loadFeed=async(leagueId)=>{
    const lid=leagueId||league?.id;if(!lid)return
    const{data}=await supabase.from('activity_feed').select('*').eq('league_id',lid).order('created_at',{ascending:false}).limit(80)
    if(data){
      setFeedItems(data)
      const{data:fReacts}=await supabase.from('reactions').select('*').eq('target_type','feed').in('target_id',data.map(f=>f.id))
      if(fReacts){const byId={};fReacts.forEach(r=>{if(!byId[r.target_id])byId[r.target_id]={};if(!byId[r.target_id][r.emoji])byId[r.target_id][r.emoji]=[];byId[r.target_id][r.emoji].push(r.user_id)});setFeedReactions(byId)}
    }
  }
  const loadTrades=async(leagueId)=>{const lid=leagueId||league?.id;if(!lid)return;const{data}=await supabase.from('trades').select('*').eq('league_id',lid).order('created_at',{ascending:false});if(data)setTrades(data)}
  const loadPicks=async()=>{const{data}=await supabase.from('film_picks').select('*');if(data)setAllPicks(data)}
  const loadMarketingEvents=async()=>{const{data}=await supabase.from('marketing_events').select('*').order('event_date');if(data)setMarketingEvents(data)}
  const loadBookingClicks=async()=>{const{data}=await supabase.from('booking_clicks').select('*');if(data)setBookingClicks(data)}
  const loadNews=async(leagueId)=>{
    const lid=leagueId||league?.id;if(!lid)return
    const{data}=await supabase.from('news_signals').select('*').or(`league_id.eq.${lid},league_id.is.null`).order('signal_date',{ascending:false}).limit(50)
    if(data)setNews(data)
  }
  const loadFridayForecasts=async(leagueId)=>{
    const lid=leagueId||league?.id;if(!lid)return
    const{data}=await supabase.from('friday_forecasts').select('*').eq('league_id',lid).order('week_num',{ascending:false})
    if(data)setFridayForecasts(data)
  }
  const loadMovieOfWeek=async(leagueId)=>{
    const lid=leagueId||league?.id;if(!lid)return
    const{data}=await supabase.from('movie_of_week').select('*').eq('league_id',lid).order('week_num',{ascending:false}).limit(1).maybeSingle()
    if(data)setMovieOfWeek(data)
  }
  const loadPolls=async(leagueId)=>{
    const lid=leagueId||league?.id;if(!lid)return
    const{data}=await supabase.from('polls').select('*').eq('league_id',lid).order('created_at',{ascending:false}).limit(10)
    if(data)setPolls(data)
    const{data:votes}=await supabase.from('poll_votes').select('*').eq('league_id',lid)
    if(votes)setPollVotes(votes)
  }

  const togglePick=async(filmId,isPicked)=>{
    if(!profile) return notify('Sign in to pick films',T.red)
    if(isPicked)await supabase.from('film_picks').delete().eq('user_id',profile.id).eq('film_id',filmId)
    else await supabase.from('film_picks').insert({user_id:profile.id,film_id:filmId})
    loadPicks()
  }
  const trackBookingClick=async(filmId,chain)=>{await supabase.from('booking_clicks').insert({user_id:profile?.id,film_id:filmId,chain});loadBookingClicks()}

  const loadData=async(leagueId)=>{
    const lid=leagueId||league?.id;if(!lid)return
    setDataLoading(true);setLoadError(null)
    try{
    const memberIds=(await supabase.from('league_members').select('user_id').eq('league_id',lid)).data?.map(m=>m.user_id)||[]
    // CRITICAL: load films FIRST so UI can render, then everything else in parallel
    const[{data:fl,error:flErr},{data:cf}]=await Promise.all([
      supabase.from('films').select('*').eq('active',true).order('phase').order('week'),
      supabase.from('league_config').select('*').eq('league_id',lid).maybeSingle(),
    ])
    if(flErr)throw flErr
    if(fl)setFilms(fl.map(f=>({
      id:f.id,title:f.title,dist:f.dist,genre:f.genre,
      franchise:f.franchise,starActor:f.star_actor,
      phase:f.phase,week:f.week,basePrice:f.base_price,
      estM:f.est_m,rt:f.rt,sleeper:f.sleeper,
      trailer:f.trailer||'',affiliateUrl:f.affiliate_url||'',
      tmdbId:f.tmdb_id||null,
    })))
    setCfg(cf||{current_week:1,current_phase:1,currency:'$',tx_fee:5,phase_window_active:false,phase_window_opened_at:null,draft_window_open:false,draft_deadline:null,sealed_bid_window_open:false,sealed_bid_deadline:null})
    setStandingsSnapshot(cf?.standings_snapshot||{})
    // PERF: drop loading state once films are ready, then fetch remainder non-blocking
    setDataLoading(false)
    // Background loads
    Promise.all([
      supabase.from('profiles').select('*').in('id',memberIds.length?memberIds:['none']),
      supabase.from('rosters').select('*').eq('league_id',lid),
      supabase.from('results').select('*'),
      supabase.from('film_values').select('*'),
      supabase.from('weekly_grosses').select('*'),
      supabase.from('chips').select('*').eq('league_id',lid),
      supabase.from('forecasts').select('*').eq('league_id',lid),
      supabase.from('oscar_predictions').select('*').eq('league_id',lid),
      supabase.from('auteur_declarations').select('*').eq('league_id',lid),
      supabase.from('weekend_winners').select('*').eq('league_id',lid),
      supabase.from('phase_budgets').select('*').eq('league_id',lid),
    ]).then(([{data:ps},{data:rs},{data:res},{data:fv},{data:wg},{data:ch},{data:fc},{data:op},{data:ad},{data:ww},{data:pb}])=>{
      if(ps)setPlayers(ps)
      if(rs)setRosters(rs)
      if(res){const m={};res.forEach(r=>m[r.film_id]=r.actual_m);setResults(m)}
      if(fv){const m={};fv.forEach(v=>m[v.film_id]=v.current_value);setFilmValues(m)}
      if(wg){const m={};wg.forEach(w=>{if(!m[w.film_id])m[w.film_id]={};m[w.film_id][w.week_num]=w.gross_m});setWeeklyG(m)}
      if(ch){setAllChips(ch);setChips(ch.find(c=>c.player_id===session?.user?.id)||null)}
      if(fc){setAllForecasts(fc);const m={};fc.filter(f=>f.player_id===session?.user?.id).forEach(f=>m[f.film_id]=f.predicted_m);setForecasts(m)}
      if(op){setOscarPreds(op);setMyOscar(op.find(o=>o.player_id===session?.user?.id)||null)}
      if(ad)setAuteurDecl(ad)
      if(ww){const m={};ww.forEach(w=>m[w.week]=w.film_id);setWwWinners(m)}
      if(pb)setPhaseBudgets(pb)
    })
    // Even later — news, forecasts, polls
    setTimeout(()=>{
      loadTrades(lid)
      loadNews(lid)
      loadFridayForecasts(lid)
      loadMovieOfWeek(lid)
      supabase.from('film_reviews').select('*').eq('league_id',lid).order('updated_at',{ascending:false}).then(({data})=>{if(data)setReviews(data)})
      loadReviewComments()
      loadScreenings(lid)
      loadAllComments(lid)
      supabase.from('sync_log').select('*').order('run_at',{ascending:false}).limit(1).maybeSingle().then(({data})=>{if(data)setSyncLog(data)}).catch?.(()=>{})
      loadPolls(lid)
    },100)
    }catch(e){
      console.error('loadData failed:',e)
      setLoadError(e?.message||'Could not reach the database')
      setDataLoading(false)
    }
  }

  const curPhase=()=>cfg.current_phase||1
  const isWindow=()=>cfg.phase_window_active||false
  const phaseBanked=(pid,ph)=>ph<=1?0:phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph-1)?.budget_banked||0
  const phaseAlloc=(pid,ph)=>{const s=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph);return s?s.budget_allocated:(PHASE_BUDGETS[ph]||100)+phaseBanked(pid,ph)}
  // Money tied up in films currently held this phase
  const phaseSpent=(pid,ph)=>rosters.filter(r=>r.player_id===pid&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).reduce((s,r)=>s+r.bought_price,0)
  // Net realised from sells this phase: when you sell, you got back its bought
  // price out of "spent" (it's no longer active), but you only actually receive
  // the proceeds — so the difference (bought − proceeds) is a real loss that
  // must come out of your budget. Gains above purchase add to it.
  const phaseRealised=(pid,ph)=>rosters.filter(r=>r.player_id===pid&&r.phase===ph&&!r.active&&r.sold_price!=null).reduce((s,r)=>s+((r.sold_price||0)-(r.bought_price||0)),0)
  const budgetLeft=(pid)=>Math.max(0,phaseAlloc(pid,curPhase())-phaseSpent(pid,curPhase())+phaseRealised(pid,curPhase()))
  const bankBudget=async(pid,ph)=>{
    const alloc=phaseAlloc(pid,ph),spent=phaseSpent(pid,ph),banked=Math.max(0,alloc-spent)
    const ex=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph)
    if(ex)await supabase.from('phase_budgets').update({budget_allocated:alloc,budget_spent:spent,budget_banked:banked}).eq('id',ex.id)
    else await supabase.from('phase_budgets').insert({player_id:pid,phase:ph,budget_allocated:alloc,budget_spent:spent,budget_banked:banked,league_id:league?.id})
  }

  const advancePhase=async()=>{
    if(!await confirmModal(`Advance to Phase ${curPhase()+1}? This will bank budgets for all players.`)) return
    setPhaseTransitioning(true)
    try{
      const completedPhase=curPhase()
      const phaseScores=[...players].map(p=>({p,pts:calcPhasePoints(p.id,completedPhase)})).sort((a,b)=>b.pts-a.pts)
      const phaseWinner=phaseScores[0]
      const mvpHolding=rosters.filter(r=>r.phase===completedPhase&&results[r.film_id]!=null).map(r=>({r,film:films.find(f=>f.id===r.film_id),pts:calcOpeningPts(films.find(f=>f.id===r.film_id)||{},results[r.film_id]||0)})).sort((a,b)=>b.pts-a.pts)[0]
      const chipWin=allChips.find(c=>c.short_result==='win'||c.analyst_result==='win')
      const chipWinner=chipWin?players.find(p=>p.id===chipWin.player_id):null
      for(const p of players) await bankBudget(p.id,completedPhase)
      const nextPhase=completedPhase+1
      const ok=await updateLeagueConfig({
        current_phase:nextPhase,
        phase_window_active:false,
        phase_window_opened_at:null,
        draft_window_open:false,
        draft_deadline:null,
      })
      if(!ok)throw new Error('Could not write league config — check Data Health')
      await logActivity(session.user.id,'phase_advance',{from_phase:completedPhase,to_phase:nextPhase,league:league?.name},league?.id)
      await sendNotification('phase_advance',{league_id:league?.id,from_phase:completedPhase,to_phase:nextPhase,players:players.map(p=>({id:p.id}))})
      setPhaseCeremony({phase:completedPhase,scores:phaseScores,winner:phaseWinner,mvp:mvpHolding,chipWinner,chipWin})
      if(phaseWinner?.pts>0)triggerConfetti()
      loadData(league?.id)
    }catch(e){notify(`Phase transition failed: ${e.message}`,T.red)}
    setPhaseTransitioning(false)
  }

  const filmVal=(film)=>{
    // Future-phase films with no base_price stay locked (🔒 TBC)
    // Current-phase films without an estimate get a floor price so they're buyable
    let bp=film.basePrice
    if(bp==null&&film.phase===curPhase())bp=5
    if(bp==null)return null
    // RESULTED FILMS: compute value LIVE from opening + weekly grosses.
    // This ensures legs (strong weekly holds) actually move the price,
    // rather than reading a stale number from the film_values table.
    if(results[film.id]!=null){
      return calcMarketValue({...film,basePrice:bp},results[film.id],weeklyG[film.id]||{})
    }
    // UNRELEASED FILMS: base price × live demand drivers
    return Math.round(bp*calcDemandMult(film,rosters,curPhase(),players.length,cfg.current_week,allPicks))
  }
  const isEarlyBird=(h)=>{
    const f=films.find(fl=>fl.id===h.film_id)
    if(!f)return false
    // Must have bought 4+ weeks before release
    const qualifies=f.week-(h.acquired_week||h.bought_week||0)>=EARLY_BIRD_WEEKS
    if(!qualifies)return false
    // Only 1 Early Bird tag allowed per phase — earliest acquired holding wins
    const phaseHoldings=rosters.filter(r=>r.player_id===h.player_id&&r.phase===h.phase&&films.find(fl=>fl.id===r.film_id))
    const qualifying=phaseHoldings.filter(r=>{
      const rf=films.find(fl=>fl.id===r.film_id)
      return rf&&rf.week-(r.acquired_week||r.bought_week||0)>=EARLY_BIRD_WEEKS
    })
    if(qualifying.length===0)return false
    // The earliest-acquired qualifying film gets the tag
    const earliest=qualifying.reduce((a,b)=>(a.acquired_week||a.bought_week||99)<(b.acquired_week||b.bought_week||99)?a:b)
    return earliest.id===h.id
  }
  const analystOn=(pid,fid)=>{const c=allChips.find(c=>c.player_id===pid);return c?.analyst_film_id===fid&&c?.analyst_result==='win'}
  const forecasterPhaseScore=(pid,ph)=>{
    const phFilms=films.filter(f=>f.phase===ph&&results[f.id]!=null);if(!phFilms.length)return null
    const pfc=allForecasts.filter(f=>f.player_id===pid&&phFilms.find(pf=>pf.id===f.film_id));if(!pfc.length)return null
    return pfc.reduce((s,fc)=>s+Math.abs(fc.predicted_m-results[fc.film_id])/results[fc.film_id],0)/pfc.length
  }
  const calcPhasePoints=(pid,ph)=>{
    let t=0
    rosters.filter(r=>r.player_id===pid&&r.phase===ph&&films.find(f=>f.id===r.film_id)).forEach(h=>{
      const film=films.find(f=>f.id===h.film_id);if(!film)return
      const actual=results[film.id];if(actual==null)return
      let op=calcOpeningPts(film,actual,isEarlyBird(h),analystOn(pid,film.id))
      t+=op+Math.round(calcWeeklyPts(weeklyG[film.id]||{}))+calcLegsBonus(actual,weeklyG[film.id]?.[2])
    })
    return t
  }
  const calcPoints=(pid)=>ALL_PHASES.reduce((s,ph)=>s+calcPhasePoints(pid,ph),0)
  // ── OPENING ESTIMATOR — suggests an Est from comparable resulted films ───
  // Uses your own slate's actual performance as the benchmark, layered:
  //   1. same distributor + genre (tightest comp)
  //   2. same genre across all distributors
  //   3. same distributor across all genres
  //   4. global median opening
  // RT/buzz nudge the number up or down within a sensible band.
  const estimateOpening=(film)=>{
    const resulted=films.filter(f=>results[f.id]!=null&&f.id!==film.id)
    if(resulted.length===0)return null
    const median=arr=>{const s=[...arr].sort((a,b)=>a-b);return s.length?s[Math.floor(s.length/2)]:null}
    const openOf=f=>results[f.id]
    let base=null,basis=''
    const sameDG=resulted.filter(f=>f.dist===film.dist&&f.genre===film.genre)
    const sameG=resulted.filter(f=>f.genre===film.genre)
    const sameD=resulted.filter(f=>f.dist===film.dist)
    if(sameDG.length>=2){base=median(sameDG.map(openOf));basis=`${film.dist} ${film.genre} films`}
    else if(sameG.length>=2){base=median(sameG.map(openOf));basis=`${film.genre} films`}
    else if(sameD.length>=2){base=median(sameD.map(openOf));basis=`${film.dist} films`}
    else{base=median(resulted.map(openOf));basis='all resulted films'}
    if(base==null)return null
    // Nudge by RT if we have it (good reviews → slightly higher opening expectation)
    let mult=1
    if(film.rt!=null)mult*=film.rt>=80?1.15:film.rt>=60?1.0:film.rt>=40?0.9:0.8
    const est=Math.max(1,Math.round(base*mult))
    return{est,basis,n:(sameDG.length>=2?sameDG:sameG.length>=2?sameG:sameD.length>=2?sameD:resulted).length}
  }
  // ── ACHIEVEMENTS — derived live from existing data, no storage needed ────
  const calcBadges=(pid)=>{
    const out=[]
    const mine=rosters.filter(r=>r.player_id===pid)
    const scored=mine.map(h=>{const f=films.find(fl=>fl.id===h.film_id);return f&&results[f.id]!=null?{h,f,actual:results[f.id]}:null}).filter(Boolean)
    const chip=allChips.find(c=>c.player_id===pid)
    if(chip?.analyst_result==='win')out.push({icon:'🎯',name:'Oracle',desc:'Analyst prediction landed within 10%'})
    if(scored.some(({h,f,actual})=>isEarlyBird(h)&&f.estM&&actual/f.estM>=1.1))out.push({icon:'🐦',name:'Early Riser',desc:'Scored an Early Bird bonus'})
    if(scored.some(({h,actual})=>h.bought_price>0&&actual/h.bought_price>=3))out.push({icon:'💰',name:'Moneyball',desc:'A pick opened at 3× what you paid'})
    if(scored.some(({f,actual})=>calcOpeningPts(f,actual,false,false)>=100))out.push({icon:'🏆',name:'Century',desc:'100 opening points on a single film'})
    if(scored.some(({f,actual})=>calcLegsBonus(actual,weeklyG[f.id]?.[2])>0))out.push({icon:'🦵',name:'Legs',desc:'Earned a word-of-mouth legs bonus'})
    if(ALL_PHASES.some(p=>mine.filter(r=>r.phase===p).length>=MAX_ROSTER))out.push({icon:'📈',name:'Full House',desc:`Held a full roster of ${MAX_ROSTER} in one phase`})
    if(allForecasts.filter(f=>f.player_id===pid).length>=5)out.push({icon:'🔮',name:'Forecaster',desc:'Logged 5+ opening predictions'})
    // Hot streak — 3+ consecutive resulted picks (by release order) that beat estimate
    const chrono=scored.filter(({f})=>f.estM).sort((a,b)=>a.f.week-b.f.week)
    let run=0,best=0
    chrono.forEach(({f,actual})=>{if(actual/f.estM>=1.0){run++;best=Math.max(best,run)}else run=0})
    if(best>=3)out.push({icon:'🔥',name:`${best}-Streak`,desc:`${best} straight picks beat their estimate`})
    return out
  }
  // ── SEASON SUPERLATIVES — auto-awarded titles across the league ──────────
  const calcSuperlatives=()=>{
    if(players.length<2)return []
    const stat=(pid)=>{
      const mine=rosters.filter(r=>r.player_id===pid)
      const scored=mine.map(h=>{const f=films.find(fl=>fl.id===h.film_id);return f&&results[f.id]!=null?{h,f,actual:results[f.id]}:null}).filter(Boolean)
      const bestRoi=Math.max(0,...scored.map(({h,actual})=>h.bought_price>0?actual/h.bought_price:0))
      const fcs=allForecasts.filter(f=>f.player_id===pid&&results[f.film_id]!=null&&results[f.film_id]>0)
      const fcErr=fcs.length?fcs.reduce((s,f)=>s+Math.abs(Number(f.predicted_m)-results[f.film_id])/results[f.film_id],0)/fcs.length:null
      const ebCount=scored.filter(({h,f,actual})=>isEarlyBird(h)&&f.estM&&actual/f.estM>=1.1).length
      const picks=allPicks.filter(p=>p.user_id===pid).length
      return{pid,bestRoi,fcErr,fcN:fcs.length,ebCount,picks}
    }
    const s=players.map(p=>stat(p.id))
    const name=pid=>players.find(p=>p.id===pid)?.name||'—'
    const out=[]
    const roi=s.filter(x=>x.bestRoi>0).sort((a,b)=>b.bestRoi-a.bestRoi)[0]
    if(roi)out.push({icon:'💎',title:'Best Investment',who:name(roi.pid),detail:`${roi.bestRoi.toFixed(1)}× return on a single pick`})
    const acc=s.filter(x=>x.fcErr!=null&&x.fcN>=2).sort((a,b)=>a.fcErr-b.fcErr)[0]
    if(acc)out.push({icon:'🎯',title:'Sharpest Forecaster',who:name(acc.pid),detail:`${Math.round((1-acc.fcErr)*100)}% accuracy over ${acc.fcN} calls`})
    const eb=s.filter(x=>x.ebCount>0).sort((a,b)=>b.ebCount-a.ebCount)[0]
    if(eb)out.push({icon:'🐦',title:'Early Bird',who:name(eb.pid),detail:`${eb.ebCount} early picks that paid off`})
    const scout=s.sort((a,b)=>b.picks-a.picks)[0]
    if(scout&&scout.picks>0)out.push({icon:'👁',title:'Most Active Scout',who:name(scout.pid),detail:`${scout.picks} films watchlisted`})
    return out
  }

  const buyFilm=async(film)=>{
    if(!profile)return notify('Create a profile first',T.red)
    const ph=curPhase()
    if(film.phase!==ph){haptic.warn();return notify(`Film is Phase ${film.phase} — you are in Phase ${ph}`,T.red)}
    if(film.basePrice==null&&film.phase!==curPhase()){haptic.warn();return notify('Film pricing not yet revealed — wait for the slate to open',T.red)}
    if(rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active)){haptic.warn();return notify('Already in your roster',T.red)}
    if(rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length>=MAX_ROSTER){haptic.warn();return notify(`Phase roster full (${MAX_ROSTER} max)`,T.red)}
    const price=filmVal(film),left=budgetLeft(profile.id)
    if(price==null){haptic.warn();return notify('Film pricing not yet revealed',T.red)}
    if(price>left){haptic.warn();return notify(`Not enough budget — need $${price}M, have $${left}M`,T.red)}
    const{error}=await supabase.from('rosters').insert({player_id:profile.id,film_id:film.id,bought_price:price,bought_week:cfg.current_week,acquired_week:cfg.current_week,phase:ph,active:true,league_id:league?.id})
    if(error){haptic.warn();return notify(error.message,T.red)}
    await supabase.from('transactions').insert({player_id:profile.id,film_id:film.id,type:'buy',price,week:cfg.current_week,league_id:league?.id})
    await logActivity(profile.id,'buy',{film_id:film.id,film_title:film.title,price,player_name:profile.name},league?.id)
    haptic.success()
    notify(`✨ Acquired ${film.title} · $${price}M`,T.green);loadData(league?.id)
  }
  const sellFilm=async(film)=>{
    const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active);if(!h)return
    const val=filmVal(film)??film.basePrice??0
    const win=isWindow(),fee=win?0:cfg.tx_fee,proceeds=Math.max(0,val-fee)
    await supabase.from('rosters').update({active:false,sold_price:proceeds,sold_week:cfg.current_week}).eq('id',h.id)
    await supabase.from('transactions').insert([{player_id:profile.id,film_id:film.id,type:'sell',price:proceeds,week:cfg.current_week},...(fee>0?[{player_id:profile.id,film_id:film.id,type:'fee',price:fee,week:cfg.current_week}]:[])])
    await logActivity(profile.id,'sell',{film_id:film.id,film_title:film.title,proceeds,player_name:profile.name},league?.id)
    haptic.tap()
    notify(`Dropped ${film.title} · $${proceeds}M${win?' (free)':''}`,T.gold);loadData(league?.id)
  }

  const acceptTrade=async(trade)=>{
    const myH=rosters.find(r=>r.player_id===trade.receiver_id&&r.film_id===trade.receiver_film_id&&r.active)
    const theirH=rosters.find(r=>r.player_id===trade.proposer_id&&r.film_id===trade.proposer_film_id&&r.active)
    if(!myH||!theirH)return notify('One of the films is no longer available',T.red)
    await supabase.from('rosters').update({active:false,sold_price:0,sold_week:cfg.current_week}).eq('id',myH.id)
    await supabase.from('rosters').update({active:false,sold_price:0,sold_week:cfg.current_week}).eq('id',theirH.id)
    await supabase.from('rosters').insert({player_id:trade.receiver_id,film_id:trade.proposer_film_id,bought_price:theirH.bought_price,bought_week:cfg.current_week,acquired_week:theirH.acquired_week,phase:trade.phase,active:true,league_id:league?.id})
    await supabase.from('rosters').insert({player_id:trade.proposer_id,film_id:trade.receiver_film_id,bought_price:myH.bought_price,bought_week:cfg.current_week,acquired_week:myH.acquired_week,phase:trade.phase,active:true,league_id:league?.id})
    await supabase.from('trades').update({status:'accepted',resolved_at:new Date().toISOString()}).eq('id',trade.id)
    await logActivity(profile.id,'trade_accepted',{film_given:films.find(f=>f.id===trade.receiver_film_id)?.title,film_received:films.find(f=>f.id===trade.proposer_film_id)?.title},league?.id)
    notify('Trade complete — rosters swapped!',T.green);loadData(league?.id)
  }
  const rejectTrade=async(trade)=>{await supabase.from('trades').update({status:'rejected',resolved_at:new Date().toISOString()}).eq('id',trade.id);notify('Trade rejected',T.red);loadTrades()}
  const cancelTrade=async(trade)=>{await supabase.from('trades').update({status:'cancelled',resolved_at:new Date().toISOString()}).eq('id',trade.id);notify('Trade cancelled',T.gold);loadTrades()}

  const activateRecut=async()=>{
    if(chips?.recut_used)return notify('Recut already used',T.red)
    if(!await confirmModal('Activate THE RECUT? Your roster clears — zero fees.',{danger:true,confirmLabel:'Activate RECUT'}))return
    for(const h of rosters.filter(r=>r.player_id===profile.id&&r.active))
      await supabase.from('rosters').update({active:false,sold_price:filmVal(films.find(f=>f.id===h.film_id)||{})??(films.find(f=>f.id===h.film_id)?.basePrice??0),sold_week:cfg.current_week}).eq('id',h.id)
    if(chips)await supabase.from('chips').update({recut_used:true}).eq('player_id',profile.id).eq('league_id',league?.id)
    else await supabase.from('chips').insert({player_id:profile.id,recut_used:true,league_id:league?.id})
    await logActivity(profile.id,'chip_recut',{player_name:profile.name},league?.id)
    notify('🎬 RECUT activated',T.purple);triggerConfetti();setChipModal(null);loadData(league?.id)
  }
  const resolveChips=async(filmId,actualM)=>{
    const film=films.find(f=>f.id===filmId);if(!film)return
    for(const c of allChips){
      if(c.analyst_film_id===filmId&&!c.analyst_result){const within=c.analyst_prediction&&Math.abs(actualM-c.analyst_prediction)/c.analyst_prediction<=0.1;await supabase.from('chips').update({analyst_result:within?'win':'lose'}).eq('player_id',c.player_id)}
    }
  }
  const activateAnalyst=async(filmId,pred)=>{
    if(chips?.analyst_film_id)return notify('Analyst already used',T.red)
    if(allChips.find(c=>c.analyst_film_id===filmId))return notify('Film already Analysed',T.red)
    if(!rosters.find(r=>r.player_id===profile.id&&r.film_id===filmId&&r.active))return notify('You must own this film',T.red)
    if(chips)await supabase.from('chips').update({analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred}).eq('player_id',profile.id).eq('league_id',league?.id)
    else await supabase.from('chips').insert({player_id:profile.id,analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred,league_id:league?.id})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_analyst',{film_title:ft,prediction:pred,player_name:profile.name},league?.id)
    notify(`🎯 ANALYST on ${ft}`,T.blue);triggerConfetti();setChipModal(null);loadData(league?.id)
  }
  const submitOscarPick=async(filmId)=>{
    if(myOscar)return notify('Already submitted',T.red)
    await supabase.from('oscar_predictions').insert({player_id:profile.id,best_picture_film_id:filmId,league_id:league?.id})
    await logActivity(profile.id,'oscar',{film_title:films.find(f=>f.id===filmId)?.title,player_name:profile.name},league?.id)
    notify(`🏆 Locked — ${films.find(f=>f.id===filmId)?.title}`,T.gold);loadData(league?.id)
  }
  const saveForecast=async(filmId,predicted)=>{
    const ex=allForecasts.find(f=>f.player_id===profile.id&&f.film_id===filmId)
    if(ex)await supabase.from('forecasts').update({predicted_m:predicted}).eq('id',ex.id)
    else await supabase.from('forecasts').insert({player_id:profile.id,film_id:filmId,phase:curPhase(),predicted_m:predicted,league_id:league?.id})
    await logActivity(profile.id,'forecast',{film_title:films.find(f=>f.id===filmId)?.title,predicted_m:predicted,player_name:profile.name},league?.id)
    notify(`Forecast saved — $${predicted}M`,T.blue);loadData(league?.id)
  }

  const embedFilmId=(()=>{const q=new URLSearchParams(window.location.search);return q.get('embed')||null})()
  if(embedFilmId)return <EmbedWidget filmId={embedFilmId}/>

  const distCodeFromUrl=(()=>{const q=new URLSearchParams(window.location.search);return q.get('distributor')?.toUpperCase()||null})()
  if(distCodeFromUrl)return <DistributorPortal code={distCodeFromUrl}/>

  const inviteFromUrl=(()=>{const p=window.location.pathname,q=new URLSearchParams(window.location.search);return p.match(/\/join\/([A-Z0-9-]+)/i)?.[1]?.toUpperCase()||q.get('invite')?.toUpperCase()||null})()
  if(inviteFromUrl&&!session&&!loading)return <InviteLanding code={inviteFromUrl} onLogin={()=>{setInviteCode(inviteFromUrl)}}/>
  if(loading)return(<div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono}}><div style={{textAlign:'center'}}><div style={{fontSize:'52px',fontWeight:900,color:T.gold,letterSpacing:'-2px',marginBottom:'16px'}}>BOXD</div><div style={{width:'40px',height:'3px',background:T.gold,borderRadius:'2px',margin:'0 auto',animation:'pulse 1.2s ease-in-out infinite'}}/></div></div>)
  if(!session)return<Login/>
  if(!profile)return<CreateProfile session={session} onCreated={()=>{loadProfile();loadLeagues()}} notify={notify}/>

  if(!league)return(
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono,padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'480px'}}>
        <div style={{fontSize:'52px',fontWeight:900,color:T.gold,letterSpacing:'-2px',marginBottom:'6px',lineHeight:1}}>BOXD</div>
        <div style={{fontSize:'11px',color:T.textDim,letterSpacing:'3px',marginBottom:'40px'}}>FANTASY BOX OFFICE</div>
        {myLeagues.length>0&&<div style={{marginBottom:'32px'}}>
          <div style={{...S.label,marginBottom:'12px'}}>Your Leagues</div>
          {myLeagues.map(lg=>(
            <div key={lg.id} className="hoverable" onClick={()=>enterLeague(lg)} style={{...S.card,display:'flex',alignItems:'center',gap:'14px',marginBottom:'8px',cursor:'pointer',border:`1px solid ${T.borderUp}`}}>
              <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${T.gold}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>🎬</div>
              <div style={{flex:1}}><div style={{fontSize:'15px',fontWeight:700,color:T.text}}>{lg.name}</div><div style={{fontSize:'12px',color:T.textSub,marginTop:'2px'}}>{lg.myRole==='commissioner'?'⚙️ Commissioner':'🎮 Player'} · Code: {lg.invite_code}</div></div>
              <div style={{color:T.gold,fontSize:'20px'}}>›</div>
            </div>
          ))}
        </div>}
        <div style={{display:'flex',gap:'10px',marginBottom:'24px'}}>
          <button onClick={()=>setLeaguePage('create')} style={{...S.btn,flex:1,background:leaguePage==='create'?T.gold:T.surfaceUp,color:leaguePage==='create'?'#0D0A08':T.textSub,border:`1px solid ${leaguePage==='create'?T.gold:T.border}`,padding:'10px',fontSize:'12px',textTransform:'none',letterSpacing:0}}>+ Create</button>
          <button onClick={()=>setLeaguePage('join')} style={{...S.btn,flex:1,background:leaguePage==='join'?T.blue:T.surfaceUp,color:leaguePage==='join'?'#fff':T.textSub,border:`1px solid ${leaguePage==='join'?T.blue:T.border}`,padding:'10px',fontSize:'12px',textTransform:'none',letterSpacing:0}}>Join Code</button>
          <button onClick={()=>{setLeaguePage('discover');loadPublicLeagues()}} style={{...S.btn,flex:1,background:leaguePage==='discover'?T.green:T.surfaceUp,color:leaguePage==='discover'?'#0D0A08':T.textSub,border:`1px solid ${leaguePage==='discover'?T.green:T.border}`,padding:'10px',fontSize:'12px',textTransform:'none',letterSpacing:0}}>🌍 Discover</button>
        </div>
        {leaguePage==='discover'&&<div style={{animation:'fadeUp .2s ease',marginBottom:'24px'}}>
          <div style={{...S.label,marginBottom:'12px'}}>Public Leagues</div>
          {publicLeagues.length===0&&<div style={{...S.card,textAlign:'center',padding:'30px',color:T.textSub,fontSize:'13px'}}>No public leagues to show yet.</div>}
          {publicLeagues.map(lg=>(
            <div key={lg.id} className="hoverable" style={{...S.card,display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${T.green}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>🌍</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'14px',fontWeight:700,color:T.text}}>{lg.name}</div>
                <div style={{fontSize:'11px',color:T.textSub}}>{lg.member_count||0} members{lg.description?` · ${lg.description}`:''}</div>
              </div>
              <Btn onClick={()=>joinPublicLeague(lg)} color={T.green} size="sm">Join</Btn>
            </div>
          ))}
        </div>}
        {leaguePage==='create'&&<div style={{animation:'fadeUp .2s ease'}}>
          <div style={{...S.label,marginBottom:'8px'}}>League Name</div>
          <input value={newLeagueName} onChange={e=>setNewLeagueName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createLeague()} placeholder="e.g. The Box Office Boyz" style={{...S.inp,marginBottom:'12px',fontSize:'15px',padding:'14px 16px'}}/>
          <Btn onClick={createLeague} color={T.gold} full size="lg">Create League</Btn>
        </div>}
        {leaguePage==='join'&&<div style={{animation:'fadeUp .2s ease'}}>
          <div style={{...S.label,marginBottom:'8px'}}>Invite Code</div>
          <input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&joinLeague()} placeholder="BOXD-XXXX" style={{...S.inp,marginBottom:'12px',fontSize:'18px',padding:'14px 16px',letterSpacing:'3px',textAlign:'center'}}/>
          <Btn onClick={joinLeague} color={T.blue} textColor="#fff" full size="lg">Join League</Btn>
        </div>}
        <div style={{marginTop:'32px',textAlign:'center'}}><button onClick={()=>supabase.auth.signOut()} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontFamily:T.mono,fontSize:'12px'}}>Sign out</button></div>
      </div>
    </div>
  )

  const ph=curPhase()
  const win=isWindow()
  const cur=cfg.currency||'$'
  const phaseFilms=films.filter(f=>f.phase===ph)
  const myRoster=rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id))
  const myBudget=budgetLeft(profile.id)
  const pendingForMe=trades.filter(t=>t.receiver_id===profile.id&&t.status==='pending')
  const myPicks=allPicks.filter(p=>p.user_id===profile.id)
  const hasEverBought=rosters.some(r=>r.player_id===profile.id)
  const recutUsed=chips?.recut_used||false
  const shortUsed=!!chips?.short_film_id
  const analystUsed=!!chips?.analyst_film_id
  const sealedWindowOpen=cfg.sealed_bid_window_open||false
  const sealedWindowDeadline=cfg.sealed_bid_deadline||null
  const myPendingBid=sealedBids.find(b=>b.player_id===profile?.id&&b.status==='pending')
  const draftWindowOpen=cfg.draft_window_open||false
  const draftDeadline=cfg.draft_deadline||null
  const myDraftPicks=myRoster.length
  const draftShortfall=draftWindowOpen?Math.max(0,DRAFT_MIN-myDraftPicks):0
  const draftPenalty=draftShortfall*DRAFT_PENALTY
  const wMs=cfg.phase_window_opened_at?Math.max(0,72*3600000-(nowRef.current-new Date(cfg.phase_window_opened_at).getTime())):0

  // PAGE VISIBILITY — hide empty pages so first-time view isn't broken
  const hasNews=news.length>0
  const hasResults=Object.keys(results).length>0
  const hasFridayForecasts=fridayForecasts.length>0
  const hasPicks=allPicks.length>0

  const ALL_PAGES=[
    {id:'market',icon:'🎬',label:'Market'},
    {id:'roster',icon:'📁',label:'Roster'},
    {id:'chips',icon:'⚡',label:'Chips'},
    {id:'league',icon:'🥇',label:'League'},
    {id:'community',icon:'👥',label:'Community'},
    {id:'feed',icon:'📡',label:'Feed'},
    ...(hasNews?[{id:'signals',icon:'⚡',label:'Signals'}]:[]),
    ...(polls.length>0?[{id:'polls',icon:'🗳',label:'Polls'}]:[]),
    {id:'intent',icon:'👁️',label:'Watchlist'},
    {id:'reviews',icon:'⭐',label:'Reviews'},
    {id:'forecaster',icon:'📊',label:'Forecaster'},
    {id:'oscar',icon:'🏆',label:'Oscars'},
    {id:'results',icon:'📋',label:'Results'},
    {id:'archive',icon:'🏛️',label:'Archive'},{id:'howto',icon:'❓',label:'How to Play'},{id:'legal',icon:'📜',label:'Legal'},
    ...(hasPicks&&films.length>0?[{id:'slate',icon:'🗺',label:'Slate Map'}]:[]),
    ...(hasResults?[{id:'report',icon:'📰',label:'Match Report'}]:[]),
    ...(hasPicks?[{id:'intelligence',icon:'📡',label:'Intelligence'}]:[]),
    ...(isCommissioner?[{id:'warroom',icon:'⚡',label:'War Room'},{id:'commissioner',icon:'⚙️',label:'Panel'},{id:'distributor',icon:'📈',label:'Insights'}]:[])
  ]


  // ── NEWS TICKER STRIP ────────────────────────────────────────────────────
  const NewsTickerStrip=()=>{
    if(news.length===0)return null
    const recent=news.slice(0,8)
    const items=[...recent,...recent] // duplicate for seamless scroll
    return(
      <div style={{background:T.surface,borderTop:`1px solid ${T.red}33`,borderBottom:`1px solid ${T.red}33`,overflow:'hidden',position:'relative',marginBottom:'12px'}}>
        <div style={{display:'flex',alignItems:'center'}}>
          <div style={{background:`${T.red}22`,padding:'8px 14px',fontSize:'10px',color:T.red,fontWeight:700,letterSpacing:'2px',flexShrink:0,fontFamily:T.mono,borderRight:`1px solid ${T.red}33`}}>📡 SIGNALS</div>
          <div style={{flex:1,overflow:'hidden',whiteSpace:'nowrap',padding:'8px 0'}}>
            <div style={{display:'inline-block',animation:'tickerScroll 60s linear infinite',whiteSpace:'nowrap'}}>
              {items.map((n,i)=>{
                const film=films.find(f=>f.id===n.film_id)
                const col=n.sentiment==='positive'?T.green:n.sentiment==='negative'?T.red:T.textSub
                return(
                  <span key={i} onClick={()=>setPage('signals')} style={{display:'inline-block',marginRight:'40px',cursor:'pointer'}}>
                    <span style={{color:col,marginRight:'8px'}}>●</span>
                    <span style={{color:T.text,fontSize:'13px',fontWeight:500}}>{n.headline}</span>
                    {film&&<span style={{color:T.textDim,fontSize:'11px',marginLeft:'8px'}}>· {film.title}</span>}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── MARKET PAGE ─────────────────────────────────────────────────────────
  // ── RELEASE CALENDAR STRIP ──────────────────────────────────────────────
  // Horizontal scrolling week-by-week view of upcoming films.
  // Shows the next ~8 weeks. Each column = one release week.
  // Tapping a film card opens FilmDetail; eye icon toggles watchlist.
  const ReleaseCalendarStrip=()=>{
    // Collapsible, condensed week-rail. Scrolls BOTH directions so you can
    // look back at past weeks. Each week column has a capped height with its
    // own internal scroll, so a busy week never stretches the whole strip.
    const[collapsed,setCollapsed]=useState(false)
    const railRef=useRef(null)
    const liveFilms=films.filter(f=>f.phase!==HISTORICAL_PHASE)
    const allWeeks=[...new Set(liveFilms.map(f=>f.week))].sort((a,b)=>a-b)
    if(allWeeks.length===0)return null

    // Auto-scroll so the current week sits near the left on first paint
    useEffect(()=>{
      if(railRef.current){
        const cur=railRef.current.querySelector('[data-now="1"]')
        if(cur)railRef.current.scrollLeft=Math.max(0,cur.offsetLeft-12)
      }
    },[collapsed])

    return(
      <div style={{marginBottom:'14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
          <button onClick={()=>setCollapsed(c=>!c)} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:'6px'}} aria-label="Toggle release calendar">
            <span style={{...S.label,color:T.textSub}}>📅 Release Calendar</span>
            <span style={{fontSize:'10px',color:T.textDim}}>{collapsed?'▸':'▾'}</span>
          </button>
          {!collapsed&&<div style={{fontSize:'10px',color:T.textDim}}>‹ scroll ›</div>}
        </div>
        {!collapsed&&(
          <div ref={railRef} style={{overflowX:'auto',paddingBottom:'4px',scrollbarWidth:'thin',scrollbarColor:`${T.border} transparent`,WebkitOverflowScrolling:'touch'}}>
            <div style={{display:'flex',gap:'8px',minWidth:'max-content',paddingRight:'12px'}}>
              {allWeeks.map(wk=>{
                const weekFilms=liveFilms.filter(f=>f.week===wk)
                const isNow=wk===cfg.current_week
                const isPast=wk<cfg.current_week
                return(
                  <div key={wk} data-now={isNow?'1':'0'} style={{
                    background:isNow?`${T.gold}10`:T.surfaceUp,
                    border:`1px solid ${isNow?T.gold+'55':T.border}`,
                    borderRadius:'10px',padding:isMobile?'8px':'12px',width:isMobile?'126px':'210px',flexShrink:0,
                    opacity:isPast?0.6:1,
                  }}>
                    <div style={{marginBottom:'6px',paddingBottom:'6px',borderBottom:`1px solid ${T.border}`}}>
                      <div style={{fontSize:isMobile?'10px':'13px',fontWeight:700,color:isNow?T.gold:isPast?T.textDim:T.text}}>{isNow?'🎬 This Week':dateLabel(wk)}</div>
                      <div style={{fontSize:isMobile?'8px':'10px',color:T.textDim,marginTop:'1px'}}>{isNow?dateLabel(wk)+' · ':''}{weekFilms.length} film{weekFilms.length!==1?'s':''}</div>
                    </div>
                    {/* Capped-height inner scroll so busy weeks stay compact */}
                    <div style={{display:'flex',flexDirection:'column',gap:isMobile?'5px':'7px',maxHeight:isMobile?'168px':'280px',overflowY:'auto',scrollbarWidth:'thin'}}>
                      {weekFilms.map(film=>{
                        const isPicked=allPicks.some(p=>p.film_id===film.id&&p.user_id===profile?.id)
                        const owned=rosters.find(r=>r.player_id===profile?.id&&r.film_id===film.id&&r.active)
                        const gc=GENRE_COL[film.genre]||T.textSub
                        const actual=results[film.id]
                        const val=actual!=null?null:filmVal(film)
                        return(
                          <div key={film.id} onClick={()=>setFilmDetail(film)} style={{
                            display:'flex',gap:'6px',alignItems:'center',cursor:'pointer',
                            background:owned?`${T.gold}14`:T.surface,
                            border:`1px solid ${owned?T.gold+'44':gc+'22'}`,
                            borderRadius:'7px',padding:isMobile?'5px 6px':'7px 8px',
                          }}>
                            <FilmPoster film={film} width={isMobile?24:38} height={isMobile?36:57} radius={3}/>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:isMobile?'9px':'12px',fontWeight:600,color:owned?T.gold:T.text,lineHeight:1.25,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{film.title}</div>
                              <div style={{fontSize:isMobile?'8px':'11px',color:T.textDim,marginTop:'2px'}}>
                                {actual!=null?<span style={{color:T.green}}>${actual}M</span>:val!=null?`$${val}M`:'🔒'}
                                {film.rt!=null&&<span style={{color:film.rt>=75?T.green:T.red,marginLeft:'3px'}}>{film.rt}%</span>}
                              </div>
                            </div>
                            {actual==null&&<button onClick={e=>{e.stopPropagation();if(profile)togglePick(film.id)}}
                              style={{background:'none',border:'none',cursor:'pointer',padding:'1px',lineHeight:1,flexShrink:0,fontSize:'11px',opacity:isPicked?1:0.3,color:isPicked?T.gold:'#fff'}}
                              title={isPicked?'Remove from watchlist':'Add to watchlist'}
                              aria-label={`${isPicked?'Remove':'Add'} ${film.title} ${isPicked?'from':'to'} watchlist`}>👁</button>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }


  // ── GLOBAL SEARCH — one box for everything: films, players, pages ───────
  const GlobalSearchOverlay=()=>{
    const[q,setQ]=useState('')
    const nq=q.trim().toLowerCase()
    const PAGES=[
      {id:'market',icon:'🎬',label:'Market'},{id:'roster',icon:'🎞',label:'My Roster'},
      {id:'league',icon:'🏆',label:'Standings'},{id:'chips',icon:'⚡',label:'Chips'},
      {id:'intent',icon:'👁️',label:'Watchlist'},{id:'reviews',icon:'⭐',label:'Reviews'},{id:'forecaster',icon:'📊',label:'Forecaster'},
      {id:'oscar',icon:'🏅',label:'Oscars'},{id:'results',icon:'📋',label:'Results'},
      {id:'community',icon:'👥',label:'Community'},{id:'feed',icon:'📰',label:'League Feed'},
      {id:'slate',icon:'🗺',label:'Slate Map'},{id:'intelligence',icon:'📡',label:'Intelligence'},
      {id:'archive',icon:'🏛️',label:'Archive'},{id:'howto',icon:'❓',label:'How to Play'},{id:'legal',icon:'📜',label:'Legal'},
      ...(isCommissioner?[{id:'distributor',icon:'📈',label:'Distributor Insights'},{id:'commissioner',icon:'⚙️',label:'Commissioner'},{id:'warroom',icon:'⚡',label:'War Room'}]:[]),
    ]
    const rank=(text)=>{const t=text.toLowerCase();return t.startsWith(nq)?0:t.includes(nq)?1:2}
    const filmHits=nq?films.filter(f=>`${f.title} ${f.dist} ${f.starActor||''}`.toLowerCase().includes(nq)).sort((a,b)=>rank(a.title)-rank(b.title)).slice(0,6):[]
    const playerHits=nq?players.filter(p=>(p.name||'').toLowerCase().includes(nq)).slice(0,4):[]
    const pageHits=nq?PAGES.filter(p=>p.label.toLowerCase().includes(nq)).slice(0,5):PAGES.slice(0,8)
    const close=()=>setSearchOpen(false)
    return(
      <div style={{position:'fixed',inset:0,background:'#000000DD',zIndex:650,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'calc(20px + env(safe-area-inset-top))'}} onClick={close}>
        <div style={{width:'100%',maxWidth:'480px',padding:'0 16px'}} onClick={e=>e.stopPropagation()}>
          <input
            autoFocus value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{if(e.key==='Escape')close()}}
            placeholder="Search films, players, pages…"
            aria-label="Global search"
            style={{...S.inp,fontSize:'15px',padding:'14px 16px',borderRadius:'14px',border:`1px solid ${T.gold}55`,boxShadow:`0 8px 32px #000000AA`}}
          />
          <div style={{marginTop:'10px',maxHeight:'65vh',overflowY:'auto',borderRadius:'14px'}}>
            {filmHits.length>0&&<div style={{...S.label,padding:'8px 4px 4px'}}>Films</div>}
            {filmHits.map(f=>(
              <div key={f.id} onClick={()=>{setFilmDetail(f);close()}} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center',padding:'8px 12px'}}>
                <FilmPoster film={f} width={30} height={45} radius={4}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.title}</div>
                  <div style={{fontSize:'10px',color:T.textSub}}>{f.dist} · {dateLabel(f.week)} · P{f.phase}</div>
                </div>
                <span style={{fontSize:'11px',color:T.gold,fontFamily:T.mono}}>{results[f.id]!=null?`$${results[f.id]}M`:f.basePrice!=null?`$${filmVal(f)}M`:'🔒'}</span>
              </div>
            ))}
            {playerHits.length>0&&<div style={{...S.label,padding:'8px 4px 4px'}}>Players</div>}
            {playerHits.map(p=>(
              <div key={p.id} onClick={()=>{goToProfile(p);close()}} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center',padding:'8px 12px'}}>
                <div style={{width:'30px',height:'30px',borderRadius:'50%',background:p.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:800}}>{p.name?.[0]||'?'}</div>
                <div style={{flex:1,fontSize:'13px',fontWeight:600}}>{p.name}</div>
                <span style={{fontSize:'11px',color:T.gold,fontFamily:T.mono}}>{calcPoints(p.id)}pts</span>
              </div>
            ))}
            <div style={{...S.label,padding:'8px 4px 4px'}}>{nq?'Pages':'Go to'}</div>
            {pageHits.map(p=>(
              <div key={p.id} onClick={()=>{setPage(p.id);close()}} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center',padding:'10px 12px'}}>
                <span style={{fontSize:'15px'}}>{p.icon}</span>
                <span style={{fontSize:'13px',fontWeight:600}}>{p.label}</span>
              </div>
            ))}
            {nq&&filmHits.length===0&&playerHits.length===0&&pageHits.length===0&&(
              <div style={{...S.card,textAlign:'center',padding:'24px',color:T.textSub,fontSize:'12px'}}>Nothing found for "{q}"</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── REVIEWS FEED PAGE ─────────────────────────────────────────────────
  const ReviewsPage=()=>{
    const sorted=[...reviews].sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at))
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>⭐ League Reviews</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>What the league actually thought — tap any review to open the film</div>
        {sorted.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub,fontSize:'13px'}}>No reviews yet. Once films release, rate them from the film card.</div>}
        {sorted.map(r=>{
          const film=films.find(f=>f.id===r.film_id);if(!film)return null
          const p=players.find(pl=>pl.id===r.user_id)
          const thread=reviewComments.filter(c=>c.review_id===r.id)
          const verified=bookingClicks.some(b=>b.user_id===r.user_id&&b.film_id===film.id)
          return(
            <div key={r.id} onClick={()=>setFilmDetail(film)} className="hoverable" style={{...S.card,marginBottom:'10px',cursor:'pointer',display:'flex',gap:'12px'}}>
              <FilmPoster film={film} width={48} height={72} radius={6}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'13px',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{film.title}</div>
                <div style={{display:'flex',gap:'8px',alignItems:'center',marginTop:'3px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'11px',fontWeight:700,color:p?.color||T.textSub}}>{p?.name||'Player'}</span>
                  <span style={{fontSize:'12px',color:T.gold,fontFamily:T.mono}}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                  {verified&&<span style={{fontSize:'9px',color:T.green,fontWeight:700}}>🎟</span>}
                  {thread.length>0&&<span style={{fontSize:'10px',color:T.textDim}}>💬 {thread.length}</span>}
                </div>
                {r.body&&<div style={{fontSize:'12px',color:T.text,lineHeight:1.5,marginTop:'5px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{r.body}</div>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const MarketPage=()=>{
    // Local input state — keeps focus while typing (App-level state caused
    // a full page remount on every keystroke, dropping focus/keyboard)
    const[marketSearch,setMarketSearch]=useState('')
    const[marketGenre,setMarketGenre]=useState('All')
    const visible=phaseFilms.filter(f=>{
      if(marketGenre!=='All'&&f.genre!==marketGenre)return false
      if(marketSearch&&!f.title.toLowerCase().includes(marketSearch.toLowerCase())&&!f.dist.toLowerCase().includes(marketSearch.toLowerCase()))return false
      return true
    })
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        {/* MOVIE OF THE WEEK pinned card */}
        {movieOfWeek&&movieOfWeek.week_num===cfg.current_week&&(()=>{
          const mowFilm=films.find(f=>f.id===movieOfWeek.film_id);if(!mowFilm)return null
          return(
            <div onClick={()=>setFilmDetail(mowFilm)} style={{background:`linear-gradient(135deg,${T.gold}18,${T.surface})`,border:`1px solid ${T.gold}44`,borderRadius:'14px',padding:'14px',marginBottom:'14px',cursor:'pointer',display:'flex',gap:'14px',alignItems:'flex-start'}}>
              <FilmPoster film={mowFilm} width={64} height={96} radius={8}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{...S.label,color:T.gold,marginBottom:'4px'}}>🎬 Movie of the Week</div>
                <div style={{fontSize:'14px',fontWeight:700,marginBottom:'4px',lineHeight:1.3}}>{mowFilm.title}</div>
                {movieOfWeek.headline&&<div style={{fontSize:'12px',color:T.text,marginBottom:'6px',fontStyle:'italic'}}>"{movieOfWeek.headline}"</div>}
                <div style={{display:'flex',gap:'8px',marginTop:'6px',flexWrap:'wrap'}}>
                  {movieOfWeek.bull_case&&<div style={{fontSize:'10px',color:T.green,background:`${T.green}18`,padding:'2px 8px',borderRadius:'4px'}}>🐂 Bull case</div>}
                  {movieOfWeek.bear_case&&<div style={{fontSize:'10px',color:T.red,background:`${T.red}18`,padding:'2px 8px',borderRadius:'4px'}}>🐻 Bear case</div>}
                </div>
              </div>
              <div style={{color:T.gold,fontSize:'18px'}}>›</div>
            </div>
          )
        })()}

        {/* RELEASE CALENDAR — always visible */}
        <ReleaseCalendarStrip/>

        {/* NEWS TICKER · hidden until first buy */}
        {hasEverBought&&<NewsTickerStrip/>}

        {/* WEEKEND LIVE — Fri 5pm-Sun 11pm · hidden until player has bought first film */}
        {hasEverBought&&(()=>{
          const now=new Date()
          const day=now.getDay();const hr=now.getHours()
          const isWeekendLive=(day===5&&hr>=17)||day===6||(day===0&&hr<=23)
          if(!isWeekendLive)return null
          const opening=films.filter(f=>f.week===cfg.current_week&&f.phase===curPhase()&&results[f.id]==null).slice(0,4)
          if(opening.length===0)return null
          return(
            <div style={{background:`linear-gradient(135deg,${T.red}18,${T.surface})`,border:`1px solid ${T.red}55`,borderRadius:'14px',padding:'14px',marginBottom:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:T.red,animation:'pulse 1.5s infinite'}}/>
                <div style={{...S.label,color:T.red}}>🔴 WEEKEND LIVE</div>
                <div style={{fontSize:'11px',color:T.textSub,marginLeft:'auto'}}>{day===5?'Friday':day===6?'Saturday':'Sunday'} · estimates landing</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'8px'}}>
                {opening.map(f=>(
                  <div key={f.id} onClick={()=>setFilmDetail(f)} style={{background:T.surfaceUp,borderRadius:'8px',padding:'10px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center'}}>
                    <FilmPoster film={f} width={36} height={54} radius={5}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'12px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.title.split(':')[0]}</div>
                      <div style={{fontSize:'10px',color:T.textSub}}>est ${f.estM}M</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* SEASON STORYLINES — auto-generated narrative, derived live */}
        {(()=>{
          if(players.length<2)return null
          const ranked=players.map(p=>({p,pts:calcPoints(p.id)})).sort((a,b)=>b.pts-a.pts)
          const stories=[]
          if(ranked[0].pts>0){
            const gap=ranked[0].pts-ranked[1].pts
            stories.push(gap===0
              ?`🤝 ${ranked[0].p.name} and ${ranked[1].p.name} are dead level at the top`
              :`👑 ${ranked[0].p.name} leads by ${gap}pts`)
          }
          let tight=null
          for(let i=0;i<ranked.length-1;i++){
            const d=ranked[i].pts-ranked[i+1].pts
            if(ranked[i].pts>0&&(tight==null||d<tight.d))tight={d,a:ranked[i].p.name,b:ranked[i+1].p.name}
          }
          if(tight&&tight.d>0&&tight.d<=15)stories.push(`⚔️ Tightest battle: ${tight.a} vs ${tight.b} — just ${tight.d}pts in it`)
          const recent=films.filter(f=>results[f.id]!=null&&f.estM&&f.week>=cfg.current_week-2)
          if(recent.length){
            const top=recent.reduce((a,b)=>results[a.id]/a.estM>results[b.id]/b.estM?a:b)
            const ratio=results[top.id]/top.estM
            if(ratio>=1.2)stories.push(`🚀 ${top.title} smashed its estimate — ${ratio.toFixed(1)}× opening`)
            else if(ratio<=0.6)stories.push(`💥 ${top.title} fell hard — ${Math.round(ratio*100)}% of estimate`)
          }
          const hot=films.filter(f=>results[f.id]==null&&f.phase===curPhase()).map(f=>({f,buzz:calcBuzzIndex({...f,hasResult:false},allPicks,news,rosters,players.length,cfg.current_week)||0})).sort((a,b)=>b.buzz-a.buzz)[0]
          if(hot&&hot.buzz>=50)stories.push(`🔥 ${hot.f.title} is the league's hottest property right now`)
          if(stories.length===0)return null
          return(
            <div style={{...S.card,marginBottom:'14px',background:`linear-gradient(135deg,${T.gold}08,${T.surface})`,border:`1px solid ${T.gold}22`}}>
              <div style={{...S.label,color:T.gold,marginBottom:'8px'}}>📰 Season Storylines</div>
              {stories.map((s,i)=><div key={i} style={{fontSize:'12px',color:T.text,lineHeight:1.8}}>{s}</div>)}
            </div>
          )
        })()}

        {/* THE PULSE — daily check-in · hidden until player has bought first film */}
        {hasEverBought&&(()=>{
          const openingWeek=films.filter(f=>f.week===cfg.current_week&&f.phase===curPhase()&&results[f.id]==null).slice(0,3)
          const heating=films.filter(f=>results[f.id]==null&&f.phase===curPhase()).map(f=>({f,buzz:calcBuzzIndex({...f,hasResult:false},allPicks,news,rosters,players.length,cfg.current_week)||0})).sort((a,b)=>b.buzz-a.buzz).slice(0,3)
          if(openingWeek.length===0&&heating.length===0)return null
          return(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'10px',marginBottom:'14px'}}>
              {openingWeek.length>0&&<div style={{...S.card,padding:'12px'}}>
                <div style={{...S.label,marginBottom:'8px',color:T.green}}>🎬 Opening This Week</div>
                {openingWeek.map(f=>(
                  <div key={f.id} onClick={()=>setFilmDetail(f)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',cursor:'pointer'}}>
                    <span style={{fontSize:'12px',color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'70%'}}>{f.title.split(':')[0]}</span>
                    <span style={{fontSize:'11px',color:T.textSub,fontFamily:T.mono}}>{f.estM?`$${f.estM}M`:'—'}</span>
                  </div>
                ))}
              </div>}
              {heating.length>0&&<div style={{...S.card,padding:'12px'}}>
                <div style={{...S.label,marginBottom:'8px',color:T.orange}}>🔥 Heating Up</div>
                {heating.map(({f,buzz})=>(
                  <div key={f.id} onClick={()=>setFilmDetail(f)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',cursor:'pointer'}}>
                    <span style={{fontSize:'12px',color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'70%'}}>{f.title.split(':')[0]}</span>
                    <span style={{fontSize:'11px',color:T.orange,fontFamily:T.mono,fontWeight:700}}>{buzz}</span>
                  </div>
                ))}
              </div>}
            </div>
          )
        })()}

        {!hasEverBought&&(
          <div style={{background:`linear-gradient(135deg,${T.gold}14,${T.surface})`,border:`1px solid ${T.gold}44`,borderRadius:'14px',padding:'18px 20px',marginBottom:'14px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
              <span style={{fontSize:'20px'}}>👋</span>
              <div style={{fontSize:'15px',fontWeight:700,color:T.gold}}>Welcome to BOXD</div>
            </div>
            <div style={{fontSize:'13px',color:T.text,lineHeight:1.6}}>Pick up to <strong>{MAX_ROSTER} films</strong> this phase. You have <strong style={{color:T.gold}}>${myBudget}M</strong> to spend. Films pay out when results land Monday — opening points + weekly grosses + bonuses. <span style={{color:T.textSub}}>Tap any card to start.</span></div>
          </div>
        )}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'12px'}}>
          <div style={S.pageTitle}>The Market</div>
          <div style={{fontSize:'12px',color:T.textSub}}>{visible.length} films · Phase {ph}</div>
        </div>
        <div style={{background:T.surfaceUp,borderRadius:'12px',padding:'12px',marginBottom:'14px',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
          <input value={marketSearch} onChange={e=>setMarketSearch(e.target.value)} placeholder="🔍 Search films or distributors…" style={{...S.inp,flex:'1 1 200px',minWidth:'160px',fontSize:'13px',padding:'10px 14px'}}/>
          <select value={marketGenre} onChange={e=>setMarketGenre(e.target.value)} style={{...S.inp,width:'auto',fontSize:'12px',padding:'10px 14px'}}>
            <option value="All">All genres</option>
            {Object.keys(GENRE_COL).map(g=><option key={g}>{g}</option>)}
          </select>
        </div>

        {visible.length===0&&(
          <div style={{...S.card,textAlign:'center',padding:'40px 20px'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>🔍</div>
            <div style={{fontSize:'14px',fontWeight:600,color:T.text,marginBottom:'4px'}}>No films match</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Try a different search or genre.</div>
            <Btn onClick={()=>{setMarketSearch('');setMarketGenre('All')}} variant="outline" color={T.gold} size="sm">Clear filters</Btn>
          </div>
        )}
        <div className="film-grid" style={{display:'grid',gridTemplateColumns:isMobile?'repeat(auto-fill,minmax(160px,1fr))':'repeat(auto-fill,minmax(185px,1fr))',gap:isMobile?'10px':'16px'}}>
          {visible.map(film=>{
            const actual=results[film.id]
            const val=filmVal(film)
            const owned=rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active)
            const isPicked=allPicks.some(p=>p.film_id===film.id&&p.user_id===profile.id)
            const gc=GENRE_COL[film.genre]||T.textSub
            return(
              <div key={film.id} className="film-card-tilt hoverable" onClick={()=>setFilmDetail(film)} style={{background:T.surface,border:`1px solid ${owned?T.gold+'66':T.border}`,borderRadius:'14px',overflow:'hidden',cursor:'pointer',position:'relative',display:'flex',flexDirection:'column'}}>
                <div style={{position:'relative',width:'100%',aspectRatio:'2/3'}}>
                  <FilmPoster film={film} width="100%" height="100%" radius={0} owned={!!owned}/>
                  {owned&&<div style={{position:'absolute',top:'8px',right:'8px',background:T.gold,color:'#000',borderRadius:'4px',padding:'2px 6px',fontSize:'10px',fontWeight:700,fontFamily:T.mono}}>OWNED</div>}
                  {actual!=null&&<div style={{position:'absolute',top:'8px',left:'8px',background:T.green,color:'#000',borderRadius:'4px',padding:'2px 6px',fontSize:'10px',fontWeight:700,fontFamily:T.mono}}>${actual}M</div>}
                </div>
                <div style={{padding:'10px 12px',flex:1,display:'flex',flexDirection:'column'}}>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:600,lineHeight:1.3,color:T.text,display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{film.title}</span>
                    </div>
                    <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px',display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                      <span>{film.dist}</span>
                      {film.rt!=null&&<><span style={{color:T.textDim}}>·</span><span style={{color:film.rt>=75?T.green:film.rt>=55?T.gold:T.red}}>RT {film.rt}%</span></>}
                      {(()=>{const fr=reviews.filter(r=>r.film_id===film.id);if(!fr.length)return null;const avg=fr.reduce((s,r)=>s+r.rating,0)/fr.length;return<><span style={{color:T.textDim}}>·</span><span style={{color:T.gold}}>★{avg.toFixed(1)}</span></>})()}
                      <span style={{color:T.textDim}}>·</span><span style={{color:T.textDim}}>{dateLabel(film.week)}</span>
                    </div>
                  </div>
                  {/* Buzz Index · limited to first 30 cards for perf */}
                  {visible.indexOf(film)<30&&(()=>{
                    const buzz=calcBuzzIndex({...film,hasResult:actual!=null},allPicks,news,rosters,players.length,cfg.current_week,val)
                    if(buzz==null)return null
                    return(
                      <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'6px',fontSize:'10px'}}>
                        <span style={{color:T.textDim,letterSpacing:'1px'}}>BUZZ</span>
                        <div style={{flex:1,height:'3px',background:T.border,borderRadius:'2px',overflow:'hidden'}}>
                          <div style={{width:`${buzz}%`,height:'100%',background:buzz>=70?T.red:buzz>=50?T.orange:T.gold}}/>
                        </div>
                        <span style={{color:buzz>=70?T.red:buzz>=50?T.orange:T.gold,fontWeight:700,fontFamily:T.mono}}>{buzz}</span>
                      </div>
                    )
                  })()}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'8px'}}>
                    <div>
                      <div style={S.label}>Price</div>
                      {val!=null
                        ?(()=>{
                          const ipo=film.basePrice||5
                          const changed=actual!=null&&val!==ipo
                          return changed?(
                            <div>
                              <div style={{fontSize:'10px',color:T.textDim,fontFamily:T.mono,textDecoration:'line-through'}}>${ipo}M</div>
                              <div style={{fontSize:'15px',fontWeight:800,color:val>=ipo?T.green:T.red,fontFamily:T.mono}}>${val}M {val>=ipo?'▲':'▼'}</div>
                            </div>
                          ):<div style={{fontSize:'15px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>${val}M</div>
                        })()
                        :<div style={{fontSize:'13px',fontWeight:700,color:T.textDim}}>🔒 TBC</div>
                      }
                    </div>
                    {!owned&&actual==null&&val!=null&&<button onClick={e=>{e.stopPropagation();buyFilm(film)}} style={{background:T.gold,color:'#0D0A08',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:800,cursor:'pointer',fontFamily:T.mono,letterSpacing:'0.5px',whiteSpace:'nowrap'}}>BUY ${val}M</button>}
                    {!owned&&actual==null&&val==null&&<div style={{fontSize:'10px',color:T.textDim,textAlign:'right',lineHeight:1.4}}>Slate<br/>locked</div>}
                    {owned&&actual==null&&<button onClick={e=>{e.stopPropagation();sellFilm(film)}} style={{background:T.red,color:'#fff',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:800,cursor:'pointer',fontFamily:T.mono,letterSpacing:'0.5px',whiteSpace:'nowrap'}}>SELL</button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {visible.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No films match your filters.</div>}
      </div>
    )
  }


  // ── ROSTER PAGE ──────────────────────────────────────────────────────────
  const RosterPage=()=>(
    <div style={{animation:'fadeUp .2s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'14px'}}>
        <div style={S.pageTitle}>Your Roster</div>
        <div style={{fontSize:'12px',color:T.textSub}}>{myRoster.length}/{MAX_ROSTER} · {cur}{myBudget}M left</div>
      </div>
      {myRoster.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No films yet. Head to the Market.</div>:myRoster.map(h=>{
        const film=films.find(f=>f.id===h.film_id);if(!film)return null
        const actual=results[film.id]
        const eb=isEarlyBird(h)
        let op=actual!=null?calcOpeningPts(film,actual,eb,analystOn(profile.id,film.id)):0
        const wp=Math.round(calcWeeklyPts(weeklyG[film.id]||{}))
        const lb=calcLegsBonus(actual,weeklyG[film.id]?.[2])
        const total=op+wp+lb
        return(
          <div key={h.id} className="hoverable" onClick={()=>setScoreModal({film,holding:h})} style={{...S.card,marginBottom:'10px',cursor:'pointer'}}>
            <div style={{display:'flex',gap:'12px'}}>
              <FilmPoster film={film} width={50} height={75} radius={7}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'14px',fontWeight:700,marginBottom:'4px'}}>{film.title}</div>
                <div style={{fontSize:'11px',color:T.textSub,marginBottom:'8px'}}>{film.dist} · {dateLabel(film.week)} · Bought ${h.bought_price}M{eb&&' · 🐦 EB'}</div>
                {actual!=null?<div style={{display:'flex',gap:'10px',alignItems:'baseline'}}>
                  <span style={{fontSize:'10px',color:T.textDim,letterSpacing:'1.5px'}}>SCORED</span>
                  <span style={{fontSize:'20px',fontWeight:900,color:T.gold,fontFamily:T.mono}}>{total}pts</span>
                </div>:<div style={{display:'flex',gap:'10px',alignItems:'baseline'}}>
                  <span style={{fontSize:'10px',color:T.textDim,letterSpacing:'1.5px'}}>VALUE</span>
                  {filmVal(film)!=null
                    ?<><span style={{fontSize:'18px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>${filmVal(film)}M</span>
                    <span style={{fontSize:'11px',color:filmVal(film)>h.bought_price?T.green:filmVal(film)<h.bought_price?T.red:T.textSub,fontFamily:T.mono}}>{filmVal(film)>h.bought_price?'+':''}{filmVal(film)-h.bought_price}M</span></>
                    :<span style={{fontSize:'15px',color:T.textDim}}>—</span>
                  }
                </div>}
              </div>
              {actual==null&&<Btn onClick={e=>{e.stopPropagation();sellFilm(film)}} color={T.red} textColor="#fff" size="sm" sx={{alignSelf:'center'}}>Sell</Btn>}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── HOW TO PLAY PAGE — Comprehensive handguide ───────────────────────────
  const LegalPage=()=>{
    const[tab,setTab]=useState('privacy')
    const updated='June 2026'
    return(
      <div>
        <div style={S.pageTitle}>Legal</div>
        <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
          <button onClick={()=>setTab('privacy')} style={{...S.btn,flex:1,background:tab==='privacy'?T.gold:T.surfaceUp,color:tab==='privacy'?'#0D0A08':T.textSub,border:`1px solid ${tab==='privacy'?T.gold:T.border}`,padding:'10px',fontSize:'12px',textTransform:'none',letterSpacing:0}}>Privacy</button>
          <button onClick={()=>setTab('terms')} style={{...S.btn,flex:1,background:tab==='terms'?T.gold:T.surfaceUp,color:tab==='terms'?'#0D0A08':T.textSub,border:`1px solid ${tab==='terms'?T.gold:T.border}`,padding:'10px',fontSize:'12px',textTransform:'none',letterSpacing:0}}>Terms</button>
        </div>
        <div style={{...S.card,fontSize:'12px',color:T.textSub,lineHeight:1.7}}>
          {tab==='privacy'?(
            <div>
              <div style={{fontSize:'15px',fontWeight:700,color:T.text,marginBottom:'4px'}}>Privacy Policy</div>
              <div style={{fontSize:'10px',color:T.textDim,marginBottom:'14px'}}>Last updated {updated}</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Who we are.</span> BOXD is a fantasy film game. This policy explains what data we hold and why. We are the data controller for the purposes of UK GDPR.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>What we collect.</span> Your email address (for login), the display name and profile details you choose, and the in-game activity you generate — film picks, trades, reviews, comments, forecasts, and reactions.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>How we use it.</span> To run the game, show you and your league standings and activity, and operate features you use. We do not sell your personal contact details.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Aggregated game data.</span> BOXD shows film distributors anonymised, aggregated audience-interest data (for example, how many players are tracking a film). This is aggregate only and is not linked to your name or contact details.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Storage & security.</span> Data is held on Supabase (our database and authentication provider). Access is restricted and protected by database security rules.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Your rights.</span> Under UK GDPR you can request access to, correction of, or deletion of your data. To do so, contact us at the email below. Deleting your account removes your profile and associated personal data.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Cookies & local storage.</span> We use minimal local storage on your device to keep you logged in and remember preferences (like dismissed prompts). We do not use third-party advertising trackers.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Contact.</span> For any privacy request or question, email <span style={{color:T.gold}}>mattharris2105@gmail.com</span>.</div>
            </div>
          ):(
            <div>
              <div style={{fontSize:'15px',fontWeight:700,color:T.text,marginBottom:'4px'}}>Terms of Service</div>
              <div style={{fontSize:'10px',color:T.textDim,marginBottom:'14px'}}>Last updated {updated}</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>The game.</span> BOXD is a free fantasy game for entertainment. You draft films and score on real box-office performance. There is no real-money wagering and no prizes of monetary value unless a specific league states otherwise.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Your account.</span> You're responsible for activity under your account. Provide accurate information and keep your login secure. You must be 13 or older to use BOXD.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Acceptable use.</span> Be civil. Don't post unlawful, hateful, harassing, or spam content in reviews, comments, screenings, or names. Don't attempt to exploit, disrupt, or gain unauthorised access to the game. We may remove content or suspend accounts that break these rules.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>User content.</span> You keep ownership of what you post, but grant us a licence to display it within the game. You're responsible for what you post and confirm you have the right to post it.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Game data & fairness.</span> Film estimates, prices, and results are set by the game operator and may be adjusted to keep the game fair or correct errors. Decisions of the game operator are final.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Availability.</span> BOXD is provided "as is". We don't guarantee uninterrupted availability and may change or discontinue features.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Liability.</span> To the extent permitted by law, we're not liable for indirect or incidental losses arising from use of the game.</div>
              <div style={{marginBottom:'10px'}}><span style={{color:T.text,fontWeight:700}}>Contact.</span> Questions about these terms: <span style={{color:T.gold}}>mattharris2105@gmail.com</span>.</div>
            </div>
          )}
        </div>
      </div>
    )
  }
  const HowToPlayPage=()=>{
    const[openSection,setOpenSection]=useState('basics')
    const[guideSearch,setGuideSearch]=useState('')

    const Section=({id,icon,title,summary,color=T.gold,children})=>{
      const isOpen=openSection===id
      if(guideSearch.trim()){
        const hay=`${title} ${summary} ${typeof children==='string'?children:''}`.toLowerCase()
        if(!hay.includes(guideSearch.toLowerCase().trim()))return null
      }
      return(
        <div style={{...S.card,marginBottom:'8px',padding:0,overflow:'hidden',border:`1px solid ${isOpen?color+'66':T.border}`}}>
          <div onClick={()=>setOpenSection(isOpen?null:id)} style={{padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'20px',flexShrink:0}}>{icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'14px',fontWeight:700,color:isOpen?color:T.text}}>{title}</div>
              <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px',lineHeight:1.4}}>{summary}</div>
            </div>
            <div style={{color:T.textDim,fontSize:'18px',transition:'transform .2s',transform:isOpen?'rotate(90deg)':'none'}}>›</div>
          </div>
          {isOpen&&<div style={{padding:'0 16px 16px',animation:'fadeUp .15s ease',borderTop:`1px solid ${T.border}`}}>
            <div style={{paddingTop:'14px',fontSize:'13px',color:T.text,lineHeight:1.7}}>{children}</div>
          </div>}
        </div>
      )
    }

    const Group=({title,children})=>(
      <>
        <div style={{...S.label,marginTop:'18px',marginBottom:'10px',color:T.textSub}}>{title}</div>
        {children}
      </>
    )

    const Highlight=({color=T.gold,children})=><strong style={{color}}>{children}</strong>

    return(
      <div style={{animation:'fadeUp .2s ease',maxWidth:'720px'}}>
        <div style={S.pageTitle}>📖 Player Handguide</div>
        <div style={{fontSize:'13px',color:T.textSub,marginBottom:'16px',lineHeight:1.6}}>
          Every system in BOXD explained. Tap a section to expand. Use search to jump straight to a topic.
        </div>
        <input value={guideSearch} onChange={e=>setGuideSearch(e.target.value)} placeholder="🔍 Search the guide…" style={{...S.inp,marginBottom:'16px',fontSize:'13px'}}/>

        <Group title="🎯 Start Here">
          <Section id="basics" icon="🎬" color={T.gold} title="What is BOXD?" summary="The core game in 30 seconds.">
            BOXD is fantasy box office. You build a roster of films you think will outperform their estimates, and you score points when real-world weekend grosses come in.
            <br/><br/>
            The season runs in <Highlight>4 phases</Highlight>. Each phase covers a stretch of weeks ({PHASE_NAMES[1]}, {PHASE_NAMES[2]}, {PHASE_NAMES[3]}, {PHASE_NAMES[4]}). You get a fresh budget per phase and pick up to <Highlight>{MAX_ROSTER} films</Highlight> per phase.
            <br/><br/>
            Results land <Highlight color={T.green}>every Monday</Highlight>. Films that beat their estimate score big. Films that flop cost you. Highest total points at the end wins.
          </Section>
          <Section id="phases" icon="📅" color={T.gold} title="Phases & the season clock" summary="How time moves and when budgets reset.">
            The season has 4 phases. The commissioner advances phases manually. When a phase ends:
            <br/>• Any unspent budget gets <Highlight color={T.green}>banked</Highlight> and added to next phase's budget
            <br/>• Your roster from that phase stays locked in (films keep scoring as their weeks land)
            <br/>• You get a new roster slot allowance for the new phase
            <br/><br/>
            <Highlight>Phase budgets:</Highlight> {Object.entries(PHASE_BUDGETS).map(([p,b])=>`P${p} = $${b}M`).join(' · ')}.
            <br/><br/>
            At the start of each phase there's an optional <Highlight color={T.green}>free-trade window</Highlight> (72hrs) where you can sell films for zero fees. Use it to clean up before going into the new slate.
          </Section>
          <Section id="firstmove" icon="🎯" color={T.gold} title="Your first move" summary="What to do in the first hour.">
            1. Open <Highlight>Market</Highlight>. Scroll the films available in your current phase.
            <br/>2. Tap any film to see its details, including price drivers and a Buzz Index.
            <br/>3. Add films to your <Highlight color={T.blue}>watchlist</Highlight> by tapping the 👁 button — no commitment, just tracking.
            <br/>4. When you've spotted 3-5 you believe in, <Highlight color={T.gold}>buy</Highlight> them. Buy early — films are cheapest 6+ weeks out.
            <br/>5. Check the <Highlight>Roster</Highlight> page to see your portfolio. As results land Mondays, the score breakdown for each film shows up here.
          </Section>
        </Group>

        <Group title="💰 Buying & Selling">
          <Section id="market" icon="🎬" color={T.blue} title="The Market" summary="How prices work, and why they move.">
            Every film has a base price (its IPO). The actual price you pay is the IPO multiplied by 4 live drivers:
            <br/>• <Highlight>Ownership</Highlight> — popular films cost more (up to +30%); a film few people own is never discounted for it
            <br/>• <Highlight>Time to release</Highlight> — 6+ weeks out = −15%, graduates to +10% at release week
            <br/>• <Highlight>RT Score</Highlight> — better critics = higher price (≥90% = +15%)
            <br/>• <Highlight>Watchlist Heat</Highlight> — how many players added it this week
            <br/><br/>
            Tap any film and open the <Highlight>Info</Highlight> tab to see exactly which driver is pushing the price up or down right now.
          </Section>
          <Section id="buying" icon="🛒" color={T.blue} title="Buying a film" summary="Spend wisely. Conviction shows in price.">
            Cost comes out of your phase budget. Two rules:
            <br/>• <Highlight color={T.red}>Max {MAX_ROSTER} films per phase</Highlight>
            <br/>• You can only buy films from <Highlight>your current phase</Highlight>
            <br/><br/>
            Buying <Highlight color={T.green}>early</Highlight> ({EARLY_BIRD_WEEKS}+ weeks before release) earns you the 🐦 <Highlight color={T.green}>Early Bird</Highlight> tag — +10% on opening points if the film beats estimate by 10%+.
            <br/><br/>
            <Highlight color={T.red}>Only one Early Bird per phase.</Highlight> If you qualify on multiple films, the earliest acquired one gets the tag. Buy first, buy cheap, and pick the right film.
            <br/><br/>
            <Highlight>Pricing IS the conviction layer.</Highlight> Buying a film 6 weeks out means you pay 15% less than someone who buys at release week.
          </Section>
          <Section id="selling" icon="📉" color={T.red} title="Selling a film" summary="When and why to drop a film from your roster.">
            Click <Highlight>Sell</Highlight> on any active film. You get current market value minus a <Highlight color={T.red}>$5M transaction fee</Highlight> (zero fee during phase free-trade windows).
            <br/><br/>
            Common reasons to sell:
            <br/>• <Highlight>Bad news landed</Highlight> — RT crashed, controversy, weak tracking
            <br/>• <Highlight>You overbought</Highlight> — your full roster needs trimming
            <br/>• <Highlight>Phase ending</Highlight> — drop dead weight to bank more for next phase
            <br/><br/>
            Once a film has results, it's <Highlight>locked</Highlight> — you can't sell after the fact. The points are yours either way.
          </Section>
          <Section id="trades" icon="🔄" color={T.blue} title="Trading with other players" summary="Swap films straight up, no money involved.">
            Propose a trade from the <Highlight>Trades</Highlight> page: pick one of your films, pick one of theirs, send proposal. They accept or reject.
            <br/><br/>
            Trades are <Highlight>1-for-1 swaps</Highlight>, no cash. The film carries its original buy price + week into the new owner's roster, so Early Bird tags transfer.
            <br/><br/>
            Trades are only available within the <Highlight>same phase</Highlight> — you can't trade Summer films for Awards Season ones.
          </Section>
        </Group>

        <Group title="📊 Scoring — How Points Get Earned">
          <Section id="opening" icon="🎯" color={T.green} title="Opening weekend points" summary="The biggest scoring event for each film.">
            When real opening weekend numbers come in Monday, you score points based on:
            <br/><br/>
            <Highlight>actual_gross × performance multiplier × RT bonus</Highlight>
            <br/><br/>
            <Highlight>Performance multiplier:</Highlight>
            <br/>• 2.0× if film hits ≥200% of estimate (massive overperformer)
            <br/>• 1.6× at 150%+
            <br/>• 1.35× at 130%+
            <br/>• 1.15× at 110%+
            <br/>• 1.00× at 95-110% (on-target)
            <br/>• 0.85× at 80-95%
            <br/>• 0.65× at 60-80%
            <br/>• 0.45× at &lt;60% (flop)
            <br/><br/>
            <Highlight>RT bonus:</Highlight> ≥90% = +25%, ≥75% = +10%, &lt;50% = −15%.
            <br/><br/>
            Example: $80M actual on a $40M estimate (2.0×) with 95% RT = 80 × 2.0 × 1.25 = <Highlight color={T.gold}>200pts</Highlight>.
          </Section>
          <Section id="weekly" icon="📅" color={T.blue} title="Weekly grosses & legs" summary="Films keep paying out for multiple weeks.">
            Each week of theatrical run adds points:
            <br/>• Weeks 1-3: <Highlight>1pt per $1M</Highlight> gross
            <br/>• Week 4+: <Highlight color={T.green}>1.1pts per $1M</Highlight> (rewarding longevity)
            <br/><br/>
            <Highlight color={T.green}>🦵 Legs bonus</Highlight>: if a film's Week 2 drop is under 30% (strong word-of-mouth), you get a flat <Highlight color={T.green}>+25pt bonus</Highlight>.
            <br/><br/>
            This is why "small films with great reviews" can sometimes outscore blockbusters — they hold their audience week after week.
          </Section>
          <Section id="bonuses" icon="🏆" color={T.gold} title="All the bonuses" summary="Every modifier in the scoring engine.">
            On top of opening + weekly + legs, you can earn these:
            <br/>• 🐦 <Highlight color={T.green}>Early Bird +10%</Highlight> on opening pts if you bought {EARLY_BIRD_WEEKS}+ weeks before release AND the film beats estimate by 10%+. One Early Bird per phase — earliest qualifying pick gets it.
            <br/>• 🎯 <Highlight color={T.blue}>Analyst +60pts</Highlight> flat if you used your Analyst chip and your opening prediction was within 10%
            <br/>• 📊 <Highlight color={T.blue}>Forecaster bonus</Highlight> for most accurate predictions (see Forecaster)
          </Section>
          <Section id="reading" icon="🔍" color={T.gold} title="Reading the score breakdown" summary="Tap any of your scored films for the full math.">
            Open <Highlight>Roster</Highlight>, tap any scored film. The <Highlight>Score Breakdown</Highlight> modal shows every line: base opening, EB bonus, RT effect, weekly grosses, legs, all chip bonuses, total.
            <br/><br/>
            If a film didn't score what you expected, this is where you find out why. Often it's a chip you forgot to activate, or a film that scored fine on opening but flopped on legs.
          </Section>
        </Group>

        <Group title="⚡ Chips — Your 2 One-Time Power Moves">
          <Section id="recut" icon="🎬" color={T.purple} title="THE RECUT" summary="Nuke your roster, zero fees. Save for catastrophe.">
            Clears your entire active roster — every film sold at current market value with <Highlight color={T.green}>zero transaction fees</Highlight>.
            <br/><br/>
            Use it when your roster is full of films you no longer believe in, or when you want to reset completely before going into a new stretch of releases.
            <br/><br/>
            <Highlight color={T.red}>One-time use across the entire season.</Highlight> Don't waste it on a single bad pick.
          </Section>
          <Section id="analyst" icon="🎯" color={T.blue} title="ANALYST" summary="Predict opening number. Within 10% = +60pts.">
            Pick a film you <Highlight>own</Highlight>, then commit to a specific opening number ($M). If the actual opening lands within 10% of your prediction, you get a flat <Highlight color={T.blue}>+60pts bonus</Highlight> on top of normal scoring.
            <br/><br/>
            Miss by more than 10%, nothing happens — no penalty, but the chip is spent.
            <br/><br/>
            Best used on films you've researched obsessively — sequels with predictable patterns, films with strong pre-sales data.
          </Section>
        </Group>

        <Group title="🎮 Side Games & Tools">
          <Section id="forecaster" icon="📊" color={T.blue} title="The Forecaster" summary="Predict opening numbers for every film. Track your accuracy.">
            Open <Highlight>Forecaster</Highlight>. For every upcoming film, type your predicted opening ($M). The system tracks your accuracy across all predictions and shows you how you compare to the rest of the league.
            <br/><br/>
            Purely for fun and bragging rights — no points impact. But getting good at forecasting makes you a better buyer.
          </Section>
          <Section id="oscar" icon="🏆" color={T.gold} title="Oscar Best Picture pick" summary="One pick all season. Purely for fun.">
            From the Oscars page, pick one film as your Best Picture prediction. Lock it in once and see how it plays out at season end.
            <br/><br/>
            <Highlight>No points awarded</Highlight> — this is a social call. Bragging rights only.
            <br/><br/>
            <Highlight>One pick per player, no changes</Highlight>. Choose carefully.
          </Section>
          <Section id="watchlist" icon="👁" color={T.blue} title="Watchlist" summary="Track films without committing budget.">
            Hit the 👁 button on any film to add it to your watchlist. Other players see your watchlist count, which contributes to that film's <Highlight color={T.red}>Heat</Highlight> driver.
            <br/><br/>
            Use the <Highlight>Community → Most Anticipated</Highlight> tab to see which films the whole league is watching — a strong signal of where prices are heading.
          </Section>
          <Section id="polls" icon="🗳" color={T.blue} title="Quick Polls" summary="Commissioner-posted opinion checks.">
            Anyone can vote on polls posted by the commissioner. Live tally bars show how the league is split. Social only — no points awarded.
          </Section>
          <Section id="motw" icon="🎬" color={T.gold} title="Movie of the Week" summary="Commissioner spotlight + bull/bear case.">
            Each week, the commissioner can pin a Movie of the Week to the top of Market — a contentious film with a clear bull case AND bear case. Pure information, no scoring impact.
          </Section>
        </Group>

        <Group title="📡 Reading the Charts">
          <Section id="buzz" icon="⚡" color={T.orange} title="The Buzz Index" summary="A single 0-100 score for film heat.">
            Composite of 3 inputs:
            <br/>• <Highlight>40%</Highlight> Watchlist heat (recent picks in last 14d)
            <br/>• <Highlight>30%</Highlight> Ownership (how many players hold it)
            <br/>• <Highlight>30%</Highlight> Time pressure (closeness to release)
            <br/><br/>
            <Highlight color={T.red}>70+</Highlight> = red hot. Price will already be high. Buy early or skip.
            <br/><Highlight color={T.orange}>50-69</Highlight> = warming up. Still a decent entry.
            <br/><Highlight color={T.gold}>30-49</Highlight> = neutral. Most films sit here.
            <br/><Highlight color={T.textDim}>&lt;30</Highlight> = cold. Either a sleeper or rightly ignored.
          </Section>
          <Section id="pulse" icon="📊" color={T.green} title="The Pulse" summary="Daily snapshot of market activity.">
            At the top of Market once you've bought your first film, The Pulse shows:
            <br/>• <Highlight>Movers (48h)</Highlight> — films whose price has changed most from news signals
            <br/>• <Highlight>Opening This Week</Highlight> — your immediate scoring opportunities
            <br/>• <Highlight>Heating Up</Highlight> — highest Buzz Index films right now
            <br/><br/>
            Treat it as your "what should I look at right now" briefing.
          </Section>
          <Section id="weekend-live" icon="🔴" color={T.red} title="Weekend Live" summary="Fri 5pm to Sun 11pm — live tracking mode.">
            From Friday evening to Sunday night, the Pulse swaps to <Highlight color={T.red}>Weekend Live</Highlight>: a red-pulse indicator showing the films opening that weekend plus your projected score.
            <br/><br/>
            Don't expect minute-by-minute updates — opening estimates only land Saturday afternoon for matinées, full weekend numbers Monday morning. But the mode reminds you the game is alive.
          </Section>
        </Group>

        <Group title="⚙️ Commissioner (Matt only)">
          <Section id="commish-basics" icon="⚙️" color={T.gold} title="What a commissioner does" summary="The week-to-week ops job.">
            Each week:
            <br/>• <Highlight>Monday</Highlight>: Run the box office ingest (or paste results manually via War Room)
            <br/>• <Highlight>Mid-week</Highlight>: Publish 1-2 news signals to keep prices moving
            <br/>• <Highlight>End of phase</Highlight>: Run "Advance Phase" — banks budgets, opens free-trade window
            <br/><br/>
            The Commissioner Panel has 5 tabs: Phase, Windows, Films, Bulk Import, Advanced.
          </Section>
          <Section id="warroom" icon="⚡" color={T.red} title="War Room — manual results entry" summary="Batch-enter weekend numbers.">
            If the auto-ingest doesn't pull a film (indies often miss), War Room lets you paste in 3 weeks of grosses at once per film. Saves all at once, recalculates film_values, resolves any open Short/Analyst chips.
          </Section>
          <Section id="slate-import" icon="📋" color={T.gold} title="Slate Manager — bulk film & gross import" summary="One CSV imports everything.">
            The Bulk Import tab takes <Highlight>one wide-format CSV</Highlight> with all your film metadata AND weekly grosses across columns. See the Export → Edit → Import flow described on the page itself.
            <br/><br/>
            Use this to spin up a new league fast, or to backfill historical grosses for older films.
          </Section>
          <Section id="advance" icon="🚀" color={T.purple} title="Advancing a phase" summary="Locks scoring, banks budgets, resets rosters.">
            When you click <Highlight>Advance Phase</Highlight>:
            <br/>• All players' unspent phase budget gets banked into the next phase
            <br/>• Phase scoring is locked (films already resulted keep their points)
            <br/>• A phase ceremony pops showing the winner, MVP film, and chip wins
            <br/>• The new phase starts with closed free-trade window — open it manually when ready
          </Section>
        </Group>

        <div style={{marginTop:'24px',padding:'14px 16px',background:T.surfaceUp,borderRadius:'10px',fontSize:'12px',color:T.textSub,lineHeight:1.6}}>
          💡 <strong style={{color:T.gold}}>Lost?</strong> Tap into the Feed page to see what other players are doing. The chip activations, trades, and forecasts all flow through there — it's the easiest way to learn by watching.
        </div>
      </div>
    )
  }

  // ── LEAGUE PAGE ──────────────────────────────────────────────────────────
  const LeaguePage=()=>{
    const standings=[...players].map(p=>({p,pts:calcPoints(p.id)})).sort((a,b)=>b.pts-a.pts)
    const prevStandings=Object.entries(standingsSnapshot).map(([id,pts])=>({id,pts})).sort((a,b)=>b.pts-a.pts)
    const prevRank={};prevStandings.forEach((s,i)=>{prevRank[s.id]=i})
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>League Standings</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>{league?.name} · {players.length} players · Phase {ph}</div>
        {standings.map((s,i)=>{
          const prev=prevRank[s.p.id];const delta=prev!=null?prev-i:0
          return(
            <div key={s.p.id} className="hoverable" onClick={()=>goToProfile(s.p)} style={{...S.card,marginBottom:'8px',display:'flex',alignItems:'center',gap:'14px',cursor:'pointer',border:`1px solid ${i===0?T.gold+'66':T.border}`}}>
              <div style={{fontSize:'24px',fontWeight:900,color:i===0?T.gold:i<3?T.text:T.textSub,fontFamily:T.mono,minWidth:'36px',textAlign:'center'}}>{i+1}</div>
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:s.p.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:900,flexShrink:0}}>{s.p.name?.[0]||'?'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'14px',fontWeight:700}}>{s.p.name}</div>
                <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{rosters.filter(r=>r.player_id===s.p.id&&r.active).length} films · {cur}{budgetLeft(s.p.id)}M left</div>
                {i>0&&standings[i-1].pts-s.pts>0&&<div style={{fontSize:'10px',color:T.textDim,fontFamily:T.mono,marginTop:'2px'}}>▲ {standings[i-1].pts-s.pts}pts to catch {standings[i-1].p.name}</div>}
              </div>
              {delta!==0&&<div style={{fontSize:'11px',color:delta>0?T.green:T.red,fontFamily:T.mono,fontWeight:700}}>{delta>0?'▲':'▼'}{Math.abs(delta)}</div>}
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'22px',fontWeight:900,color:i===0?T.gold:T.text,fontFamily:T.mono}}>{s.pts}</div>
                <div style={S.label}>pts</div>
              </div>
            </div>
          )
        })}
        {standings.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No players yet.</div>}
        {(()=>{
          const sups=calcSuperlatives()
          if(sups.length===0)return null
          return(
            <div style={{...S.card,marginTop:'18px',border:`1px solid ${T.gold}22`,background:`linear-gradient(135deg,${T.gold}06,${T.surface})`}}>
              <div style={{...S.label,color:T.gold,marginBottom:'12px'}}>🏅 Season Superlatives</div>
              {sups.map(s=>(
                <div key={s.title} style={{display:'flex',gap:'10px',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'20px',width:'28px',textAlign:'center'}}>{s.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'12px',fontWeight:700,color:T.text}}>{s.title}</div>
                    <div style={{fontSize:'10px',color:T.textDim,marginTop:'1px'}}>{s.detail}</div>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:700,color:T.gold}}>{s.who}</div>
                </div>
              ))}
              <div style={{fontSize:'9px',color:T.textDim,marginTop:'8px'}}>Auto-awarded from live data · updates as the season plays out</div>
            </div>
          )
        })()}
      </div>
    )
  }

  // ── FEED PAGE ────────────────────────────────────────────────────────────
  const FeedPage=()=>{
    const toggleFeedReaction=async(feedId,emoji)=>{
      const existing=feedReactions[feedId]?.[emoji]||[]
      if(existing.includes(profile.id)){
        await supabase.from('reactions').delete().eq('target_type','feed').eq('target_id',feedId).eq('user_id',profile.id).eq('emoji',emoji)
      }else{
        await supabase.from('reactions').insert({user_id:profile.id,target_type:'feed',target_id:feedId,emoji})
      }
      loadFeed(league?.id)
    }
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>League Feed</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Live activity across the league</div>
        {feedItems.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No activity yet.</div>:feedItems.map(item=>{
          const p=players.find(pl=>pl.id===item.user_id)
          let label='',col=T.textSub
          const pay=item.payload||{}
          if(item.type==='buy'){label=`bought ${pay.film_title} for $${pay.price}M`;col=T.gold}
          else if(item.type==='sell'){label=`dropped ${pay.film_title} for $${pay.proceeds}M`;col=T.red}
          else if(item.type==='trade_proposed'){label=`proposed trade: ${pay.my_film} ⇄ ${pay.their_film}`;col=T.blue}
          else if(item.type==='trade_accepted'){label=`traded ${pay.film_given} for ${pay.film_received}`;col=T.green}
          else if(item.type==='chip_recut'){label='activated 🎬 THE RECUT';col=T.purple}
          else if(item.type==='chip_short'){label=`📉 shorted ${pay.film_title}`;col=T.red}
          else if(item.type==='chip_analyst'){label=`🎯 Analyst on ${pay.film_title} · $${pay.prediction}M`;col=T.blue}
          else if(item.type==='auteur'){label=`🎭 declared Auteur: ${pay.actor} (${pay.film_count} films)`;col=T.orange}
          else if(item.type==='oscar'){label=`🏆 Oscar pick: ${pay.film_title}`;col=T.gold}
          else if(item.type==='forecast'){label=`📊 forecast ${pay.film_title} at $${pay.predicted_m}M`;col=T.blue}
          else if(item.type==='phase_advance'){label=`⚡ advanced to Phase ${pay.to_phase}`;col=T.gold}
          else label=item.type
          return(
            <div key={item.id} style={{...S.card,marginBottom:'8px',padding:'12px 14px'}}>
              <div style={{display:'flex',gap:'12px',alignItems:'flex-start'}}>
                <div onClick={()=>p&&goToProfile(p)} style={{width:'32px',height:'32px',borderRadius:'50%',background:p?.color||T.textSub,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'13px',flexShrink:0,cursor:'pointer'}}>{p?.name?.[0]||'?'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px'}}>
                    <span style={{color:p?.color||T.gold,fontWeight:700,cursor:'pointer'}} onClick={()=>p&&goToProfile(p)}>{p?.name||'Someone'}</span>
                    <span style={{color:col,marginLeft:'5px'}}>{label}</span>
                  </div>
                  <div style={{fontSize:'10px',color:T.textDim,marginTop:'3px'}}>{timeAgo(item.created_at)}</div>
                  <div style={{display:'flex',gap:'4px',marginTop:'6px',flexWrap:'wrap'}}>
                    {EMOJI_OPTIONS.slice(0,5).map(emoji=>{
                      const users=feedReactions[item.id]?.[emoji]||[]
                      const mine=users.includes(profile.id)
                      if(users.length===0&&!mine)return null
                      return(
                        <button key={emoji} onClick={()=>toggleFeedReaction(item.id,emoji)} style={{background:mine?`${T.gold}22`:T.surfaceUp,border:`1px solid ${mine?T.gold+'66':T.border}`,borderRadius:'12px',padding:'3px 8px',cursor:'pointer',fontSize:'11px',color:mine?T.gold:T.textSub,fontFamily:T.mono}}>{emoji} {users.length}</button>
                      )
                    })}
                    {/* Quick-add reactions */}
                    <button onClick={()=>{const emoji=prompt('React with which emoji?',EMOJI_OPTIONS[0]);if(emoji)toggleFeedReaction(item.id,emoji)}} style={{background:'transparent',border:`1px dashed ${T.border}`,borderRadius:'12px',padding:'3px 8px',cursor:'pointer',fontSize:'11px',color:T.textDim}}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── INTENT (WATCHLIST) PAGE ──────────────────────────────────────────────
  const IntentPage=()=>{
    const watched=films.filter(f=>allPicks.some(p=>p.film_id===f.id&&p.user_id===profile.id))
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>Your Watchlist</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Films you're tracking · tap to view</div>
        {watched.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>Tap the 👁 button on any film to add it.</div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'10px'}}>
          {watched.map(f=>(
            <div key={f.id} onClick={()=>setFilmDetail(f)} className="hoverable" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'12px',overflow:'hidden',cursor:'pointer'}}>
              <FilmPoster film={f} width="100%" height={200} radius={0}/>
              <div style={{padding:'8px 10px'}}>
                <div style={{fontSize:'12px',fontWeight:600,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.title}</div>
                <div style={{fontSize:'10px',color:T.textSub,marginTop:'2px'}}>{f.dist} · W{f.week}</div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    )
  }


  // ── CHIPS PAGE ───────────────────────────────────────────────────────────
  const ChipsPage=()=>{
    const ChipCard=({icon,name,desc,used,color,onClick,status})=>(
      <div style={{...S.card,marginBottom:'10px',border:`1px solid ${used?T.border:color+'66'}`,opacity:used?0.5:1}}>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'12px',background:`${color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',flexShrink:0}}>{icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:700,color:used?T.textSub:color}}>{name} {used&&<span style={{color:T.textDim,fontSize:'11px',marginLeft:'4px'}}>USED</span>}</div>
            <div style={{fontSize:'12px',color:T.textSub,marginTop:'2px',lineHeight:1.4}}>{desc}</div>
            {status&&<div style={{fontSize:'11px',color,marginTop:'4px',fontWeight:600}}>{status}</div>}
          </div>
          {!used&&onClick&&<Btn onClick={onClick} color={color} textColor="#fff" size="sm">Use</Btn>}
        </div>
      </div>
    )
    const analystStatus=chips?.analyst_film_id?(()=>{const f=films.find(fl=>fl.id===chips.analyst_film_id);return `🎯 ${f?.title||'?'} · ${chips.analyst_result||'pending'}`})():null
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>Your Chips</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Each chip is one-time use across the whole season.</div>
        <ChipCard icon="🎬" name="THE RECUT" color={T.purple} used={recutUsed} onClick={activateRecut} desc="Clear your entire roster with zero transaction fees. Use it when things go wrong — no fees, clean slate."/>
        <ChipCard icon="🎯" name="ANALYST" color={T.blue} used={analystUsed} status={analystStatus} onClick={()=>setChipModal('analyst')} desc="Pick a film you own and commit to a specific opening number ($M). Within 10% of actual = +60pts on top of normal scoring."/>
      </div>
    )
  }

  // ── TRADES PAGE ──────────────────────────────────────────────────────────
  const TradesPage=()=>{
    const myProposed=trades.filter(t=>t.proposer_id===profile.id)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'14px'}}>
          <div style={S.pageTitle}>Trades</div>
          <Btn onClick={()=>setTradeModal(true)} color={T.blue} textColor="#fff" size="sm">+ Propose</Btn>
        </div>
        {pendingForMe.length>0&&<><div style={{...S.label,marginBottom:'10px',color:T.gold}}>Pending for you ({pendingForMe.length})</div>{pendingForMe.map(t=>{
          const proposer=players.find(p=>p.id===t.proposer_id)
          const myFilm=films.find(f=>f.id===t.receiver_film_id)
          const theirFilm=films.find(f=>f.id===t.proposer_film_id)
          return(
            <div key={t.id} style={{...S.card,marginBottom:'10px',border:`1px solid ${T.gold}44`}}>
              <div style={{fontSize:'13px',color:T.textSub,marginBottom:'10px'}}><span style={{color:proposer?.color||T.gold,fontWeight:700}}>{proposer?.name}</span> wants to trade</div>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                <div style={{textAlign:'center',flex:1}}>{theirFilm&&<><FilmPoster film={theirFilm} width={48} height={72} radius={6}/><div style={{fontSize:'10px',marginTop:'5px',color:T.green}}>YOU GET</div></>}</div>
                <div style={{fontSize:'22px',color:T.textSub}}>⇄</div>
                <div style={{textAlign:'center',flex:1}}>{myFilm&&<><FilmPoster film={myFilm} width={48} height={72} radius={6}/><div style={{fontSize:'10px',marginTop:'5px',color:T.red}}>YOU GIVE</div></>}</div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <Btn onClick={()=>acceptTrade(t)} color={T.green} textColor="#0D0A08" sx={{flex:1}}>Accept</Btn>
                <Btn onClick={()=>rejectTrade(t)} variant="outline" color={T.red} sx={{flex:1}}>Reject</Btn>
              </div>
            </div>
          )
        })}<Divider/></>}
        {myProposed.length>0&&<><div style={{...S.label,marginBottom:'10px'}}>Your proposals</div>{myProposed.map(t=>{
          const receiver=players.find(p=>p.id===t.receiver_id)
          const myFilm=films.find(f=>f.id===t.proposer_film_id)
          const theirFilm=films.find(f=>f.id===t.receiver_film_id)
          const statusCol={pending:T.gold,accepted:T.green,rejected:T.red,cancelled:T.textSub}[t.status]
          return(
            <div key={t.id} style={{...S.card,marginBottom:'10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div style={{fontSize:'13px',color:T.textSub}}>To <span style={{color:receiver?.color||T.gold,fontWeight:700}}>{receiver?.name}</span></div>
                <Pill color={statusCol}>{t.status}</Pill>
              </div>
              <div style={{fontSize:'12px',color:T.textSub}}>You offered <strong>{myFilm?.title}</strong> for <strong>{theirFilm?.title}</strong></div>
              {t.status==='pending'&&<Btn onClick={()=>cancelTrade(t)} variant="outline" color={T.red} size="sm" sx={{marginTop:'10px'}}>Cancel</Btn>}
            </div>
          )
        })}</>}
        {pendingForMe.length===0&&myProposed.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No active trades.</div>}
      </div>
    )
  }

  // ── FORECASTER PAGE ──────────────────────────────────────────────────────
  const ForecasterPage=()=>{
    // ── ACCURACY LEADERBOARD — avg % error across all resulted forecasts ──
    const board=players.map(p=>{
      const mine=allForecasts.filter(f=>f.player_id===p.id&&results[f.film_id]!=null&&results[f.film_id]>0)
      if(mine.length===0)return null
      const err=mine.reduce((s,f)=>s+Math.abs(Number(f.predicted_m)-results[f.film_id])/results[f.film_id],0)/mine.length
      return{p,err,n:mine.length,acc:Math.max(0,Math.round((1-err)*100))}
    }).filter(Boolean).sort((a,b)=>a.err-b.err)
    const [edit,setEdit]=useState({})
    const fcFilms=films.filter(f=>f.phase===ph&&results[f.id]==null)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>The Forecaster</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Predict opening weekends for every film. Track your accuracy vs the league — purely for bragging rights.</div>
        <div style={{...S.card,marginBottom:'16px',border:`1px solid ${T.blue}33`}}>
            <div style={{...S.label,color:T.blue,marginBottom:'10px'}}>🏅 Accuracy Leaderboard</div>
            {board.length===0&&(()=>{
              const resulted=films.filter(f=>results[f.id]!=null).length
              const totalCalls=allForecasts.length
              return <div style={{fontSize:'12px',color:T.textSub,lineHeight:1.7,padding:'4px 0'}}>
                The table appears once predictions can be scored against actual openings.
                So far: {totalCalls} prediction{totalCalls!==1?'s':''} logged · {resulted} film{resulted!==1?'s':''} opened — {totalCalls===0?'make your first calls below.':'none of the logged predictions were on films that have opened yet. Predict upcoming films below and the table fills in as they release.'}
              </div>
            })()}
            {board.map((b,i)=>(
              <div key={b.p.id} style={{display:'flex',gap:'10px',alignItems:'center',padding:'7px 0',borderBottom:i<board.length-1?`1px solid ${T.border}`:'none'}}>
                <span style={{fontSize:'13px',width:'24px',color:i===0?T.gold:T.textSub,fontWeight:800,fontFamily:T.mono}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}</span>
                <div style={{width:'24px',height:'24px',borderRadius:'50%',background:b.p.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800}}>{b.p.name?.[0]||'?'}</div>
                <span style={{flex:1,fontSize:'12px',fontWeight:600}}>{b.p.name}</span>
                <span style={{fontSize:'10px',color:T.textDim,fontFamily:T.mono}}>{b.n} call{b.n!==1?'s':''}</span>
                <span style={{fontSize:'14px',fontWeight:800,color:b.acc>=80?T.green:b.acc>=60?T.gold:T.red,fontFamily:T.mono}}>{b.acc}%</span>
              </div>
            ))}
            {board.length>0&&<div style={{fontSize:'9px',color:T.textDim,marginTop:'8px'}}>Accuracy = 100% minus average error vs actual openings · only resulted films count</div>}
          </div>
        {fcFilms.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No upcoming films to forecast.</div>:fcFilms.map(f=>{
          const cur=forecasts[f.id],val=edit[f.id]??cur??''
          return(
            <div key={f.id} style={{...S.card,marginBottom:'10px'}}>
              <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                <FilmPoster film={f} width={42} height={63} radius={6}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:600}}>{f.title}</div>
                  <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>Est ${f.estM}M · W{f.week}</div>
                </div>
                <input type="number" value={val} onChange={e=>setEdit({...edit,[f.id]:e.target.value})} placeholder="$M" style={{...S.inp,width:'80px',fontSize:'13px',textAlign:'center'}}/>
                <Btn onClick={()=>saveForecast(f.id,Number(val))} color={T.blue} textColor="#fff" size="sm" disabled={!val||isNaN(Number(val))}>{cur!=null?'Update':'Save'}</Btn>
              </div>
              {cur!=null&&<div style={{fontSize:'11px',color:T.green,marginTop:'8px'}}>✓ Forecast: ${cur}M</div>}
            </div>
          )
        })}
      </div>
    )
  }

  // ── OSCAR PAGE ───────────────────────────────────────────────────────────
  const OscarPage=()=>{
    const eligible=films.filter(f=>['Drama','Awards','Animation'].includes(f.genre)||f.phase>=3)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>🏆 Oscar Pick</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Pick the eventual Best Picture winner. Purely for bragging rights — no points impact.</div>
        {myOscar?(()=>{const pick=films.find(f=>f.id===myOscar.best_picture_film_id);return(
          <div style={{...S.card,padding:'24px',textAlign:'center',background:`linear-gradient(135deg,${T.gold}14,${T.surface})`,border:`1px solid ${T.gold}66`}}>
            {pick&&<><FilmPoster film={pick} width={120} height={180} radius={10}/><div style={{fontSize:'18px',fontWeight:700,marginTop:'12px',marginBottom:'4px'}}>{pick.title}</div><div style={{fontSize:'12px',color:T.textSub,marginBottom:'10px'}}>{pick.dist}</div></>}
            <Pill color={myOscar.correct==null?T.gold:myOscar.correct?T.green:T.red}>{myOscar.correct==null?'Locked ✓':myOscar.correct?'✓ Correct':'✗ Wrong'}</Pill>
          </div>
        )})():<>{eligible.map(f=>(
          <div key={f.id} className="hoverable" onClick={async()=>{if(await confirmModal(`Lock in ${f.title} as your Best Picture pick? You can't change it later.`))submitOscarPick(f.id)}} style={{...S.card,marginBottom:'8px',cursor:'pointer',display:'flex',gap:'12px',alignItems:'center'}}>
            <FilmPoster film={f} width={42} height={63} radius={6}/>
            <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{f.dist} · {f.genre}{f.rt!=null?` · RT ${f.rt}%`:''}</div></div>
            <div style={{color:T.gold,fontSize:'18px'}}>›</div>
          </div>
        ))}</>}
      </div>
    )
  }

  // ── RESULTS PAGE ─────────────────────────────────────────────────────────
  const ArchivePage=()=>{
    const histFilms=films.filter(f=>f.phase===HISTORICAL_PHASE).sort((a,b)=>(results[b.id]||0)-(results[a.id]||0))
    if(histFilms.length===0)return(
      <div><div style={S.pageTitle}>📜 Archive</div><div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub,fontSize:'13px'}}>No historical films yet. Films that released before the season started will appear here.</div></div>
    )
    return(
      <div>
        <div style={S.pageTitle}>📜 Archive</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px',lineHeight:1.6}}>How the season began — films that released before the live game started. These aren't tradeable, but you can see how they performed and how the market would have valued them.</div>
        <div className="film-grid" style={{display:'grid',gridTemplateColumns:isMobile?'repeat(auto-fill,minmax(150px,1fr))':'repeat(auto-fill,minmax(175px,1fr))',gap:isMobile?'10px':'14px'}}>
          {histFilms.map(f=>{
            const actual=results[f.id]
            const settled=actual!=null?calcMarketValue({...f,basePrice:f.basePrice||5},actual,weeklyG[f.id]||{}):null
            const beat=actual!=null&&f.estM?actual/f.estM:null
            return(
              <div key={f.id} onClick={()=>setFilmDetail(f)} className="hoverable" style={{...S.card,cursor:'pointer',padding:'0',overflow:'hidden'}}>
                <FilmPoster film={f} width="100%" height={isMobile?180:210} radius={0}/>
                <div style={{padding:'10px'}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:T.text,marginBottom:'2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.title}</div>
                  <div style={{fontSize:'10px',color:T.textSub,marginBottom:'6px'}}>{f.dist}</div>
                  {actual!=null?(
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div><div style={{fontSize:'9px',color:T.textDim}}>OPENED</div><div style={{fontSize:'13px',fontWeight:700,color:T.green,fontFamily:T.mono}}>${actual}M</div></div>
                      {beat!=null&&<div style={{fontSize:'10px',fontWeight:700,color:beat>=1?T.green:T.red}}>{beat>=1?'▲':'▼'}{Math.round(Math.abs(beat-1)*100)}%</div>}
                    </div>
                  ):<div style={{fontSize:'10px',color:T.textDim}}>No result recorded</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  const ResultsPage=()=>{
    const resulted=films.filter(f=>results[f.id]!=null).sort((a,b)=>b.week-a.week||b.phase-a.phase)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>Results</div>
        <div style={{fontSize:'11px',color:T.textSub,marginBottom:'14px',lineHeight:1.6}}>Opening weekends land Monday (auto-ingest or commissioner entry) · points = opening vs estimate, then weekly grosses and legs bonuses stack on top.</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>{resulted.length} films scored · most recent first</div>
        {resulted.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No results yet.</div>:resulted.map(f=>{
          const actual=results[f.id]
          const ratio=actual/f.estM
          return(
            <div key={f.id} className="hoverable" onClick={()=>setFilmDetail(f)} style={{...S.card,marginBottom:'8px',cursor:'pointer',display:'flex',gap:'12px',alignItems:'center'}}>
              <FilmPoster film={f} width={42} height={63} radius={6}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'13px',fontWeight:600}}>{f.title}</div>
                <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{f.dist} · W{f.week} · Est ${f.estM}M</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'16px',fontWeight:800,color:T.green,fontFamily:T.mono}}>${actual}M</div>
                <div style={{fontSize:'11px',color:ratio>=1?T.green:T.red,fontFamily:T.mono}}>{ratio.toFixed(2)}×</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── SIGNALS PAGE ─────────────────────────────────────────────────────────
  const SignalsPage=()=>{
    const [typeFilter,setTypeFilter]=useState('all')
    const types=['all','rt_score','trailer','festival','box_office','controversy','casting']
    const filtered=typeFilter==='all'?news:news.filter(n=>n.signal_type===typeFilter)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'12px'}}>
          <div style={S.pageTitle}>📡 Signals</div>
          {isCommissioner&&<Btn onClick={()=>setNewSignalOpen(true)} color={T.red} textColor="#fff" size="sm">+ Add Signal</Btn>}
        </div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>News & market intelligence · price impacts up to ±25% over 14d</div>
        <div style={{display:'flex',gap:'6px',overflowX:'auto',marginBottom:'14px',paddingBottom:'4px'}}>
          {types.map(t=><button key={t} onClick={()=>setTypeFilter(t)} style={{...S.btn,background:t===typeFilter?T.red:T.surfaceUp,color:t===typeFilter?'#fff':T.textSub,border:`1px solid ${t===typeFilter?T.red:T.border}`,padding:'6px 12px',fontSize:'11px',flexShrink:0,textTransform:'none',letterSpacing:0}}>{t.replace('_',' ')}</button>)}
        </div>
        {filtered.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No signals yet.</div>:filtered.map(n=>{
          const film=films.find(f=>f.id===n.film_id)
          const col=n.sentiment==='positive'?T.green:n.sentiment==='negative'?T.red:T.textSub
          return(
            <div key={n.id} className="hoverable" onClick={()=>film&&setFilmDetail(film)} style={{...S.card,marginBottom:'8px',cursor:film?'pointer':'default',borderLeft:`3px solid ${col}`}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:'10px',marginBottom:'6px'}}>
                <div style={{fontSize:'14px',fontWeight:700,color:T.text,lineHeight:1.3}}>{n.headline}</div>
              </div>
              {n.detail&&<div style={{fontSize:'12px',color:T.textSub,lineHeight:1.5,marginBottom:'8px'}}>{n.detail}</div>}
              <div style={{display:'flex',gap:'8px',alignItems:'center',fontSize:'10px',color:T.textDim}}>
                <Pill color={col}>{n.signal_type?.replace('_',' ')||'signal'}</Pill>
                {film&&<span>· {film.title}</span>}
                <span style={{marginLeft:'auto'}}>{timeAgo(n.signal_date)}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }


  // ── WEEKEND FORECAST PAGE (renamed from Friday Forecast) ─────────────────
  const FridayForecastPage=()=>{
    const[picks,setPicks]=useState({p1:'',p2:'',p3:''})
    const wkN=cfg.current_week
    const myForecast=fridayForecasts.find(f=>f.player_id===profile.id&&f.week_num===wkN)
    const lastWk=fridayForecasts.filter(f=>f.week_num===wkN-1&&f.resolved_score!=null)
    const upcoming=films.filter(f=>f.week===wkN&&results[f.id]==null)
    const now=new Date(),isLocked=now.getDay()>=4&&now.getHours()>=23
    const submit=async()=>{
      if(!picks.p1||!picks.p2||!picks.p3)return notify('Pick 3 films',T.red)
      const data={player_id:profile.id,league_id:league?.id,week_num:wkN,pick_1:picks.p1,pick_2:picks.p2,pick_3:picks.p3}
      if(myForecast)await supabase.from('friday_forecasts').update(data).eq('id',myForecast.id)
      else await supabase.from('friday_forecasts').insert(data)
      notify('🎯 Weekend forecast locked',T.gold);loadFridayForecasts(league?.id)
    }
    useEffect(()=>{if(myForecast)setPicks({p1:myForecast.pick_1||'',p2:myForecast.pick_2||'',p3:myForecast.pick_3||''})},[myForecast?.id])
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>🎯 Weekend Forecast</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Pick the top 3 grossing films this weekend · 30/20/10pts + 5 for any correct · locks Thursday midnight</div>
        {isLocked&&<div style={{...S.card,padding:'14px',background:`${T.orange}18`,border:`1px solid ${T.orange}44`,marginBottom:'14px',fontSize:'13px',color:T.orange}}>🔒 Locked for this weekend. New window opens Monday.</div>}
        {upcoming.length>=3?<div style={{...S.card,marginBottom:'14px'}}>
          <div style={{...S.label,marginBottom:'10px'}}>Your picks for Week {wkN}</div>
          {['p1','p2','p3'].map((slot,i)=>(
            <div key={slot} style={{marginBottom:'8px'}}>
              <div style={{fontSize:'11px',color:T.textDim,marginBottom:'4px'}}>{i===0?'🥇 1st place':i===1?'🥈 2nd place':'🥉 3rd place'} {i===0?'· 30pts':i===1?'· 20pts':'· 10pts'}</div>
              <select disabled={isLocked} value={picks[slot]} onChange={e=>setPicks({...picks,[slot]:e.target.value})} style={S.inp}>
                <option value="">Pick a film…</option>
                {upcoming.map(f=><option key={f.id} value={f.id}>{f.title} (est ${f.estM}M)</option>)}
              </select>
            </div>
          ))}
          <Btn onClick={submit} color={T.gold} full size="lg" sx={{marginTop:'10px'}} disabled={isLocked}>{myForecast?'Update Picks':'Submit Picks'}</Btn>
        </div>:<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No films opening this week.</div>}
        {lastWk.length>0&&<>
          <div style={{...S.label,marginTop:'24px',marginBottom:'10px'}}>Last week's leaderboard (W{wkN-1})</div>
          {[...lastWk].sort((a,b)=>(b.resolved_score||0)-(a.resolved_score||0)).map((f,i)=>{
            const p=players.find(pl=>pl.id===f.player_id)
            return(
              <div key={f.id} style={{...S.card,marginBottom:'6px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{fontSize:'14px',color:i===0?T.gold:T.textSub,fontWeight:700,minWidth:'20px'}}>#{i+1}</div>
                <div style={{width:'28px',height:'28px',borderRadius:'50%',background:p?.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#000',flexShrink:0}}>{p?.name?.[0]||'?'}</div>
                <div style={{flex:1,fontSize:'13px'}}>{p?.name}</div>
                <div style={{fontSize:'15px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>{f.resolved_score||0}pts</div>
              </div>
            )
          })}
        </>}
      </div>
    )
  }

  // ── COMMUNITY PAGE ───────────────────────────────────────────────────────
  const ScreeningsTab=()=>{
    const[hostOpen,setHostOpen]=useState(false)
    const[filmId,setFilmId]=useState('')
    const[cinema,setCinema]=useState('')
    const[city,setCity]=useState('')
    const[at,setAt]=useState('')
    const[note,setNote]=useState('')
    const upcoming=screenings.filter(s=>!s.screening_at||new Date(s.screening_at)>=new Date(Date.now()-86400000))
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'12px',color:T.textSub}}>Going to see something? Post it — others can join and book too.</div>
          <Btn onClick={()=>setHostOpen(!hostOpen)} color={T.gold} size="sm">{hostOpen?'Close':'+ Host'}</Btn>
        </div>
        {hostOpen&&(
          <div style={{...S.card,marginBottom:'14px',border:`1px solid ${T.gold}33`}}>
            <select value={filmId} onChange={e=>setFilmId(e.target.value)} style={{...S.inp,marginBottom:'8px',fontSize:'13px'}}>
              <option value="">Which film?</option>
              {films.filter(f=>results[f.id]==null||f.week>=cfg.current_week-2).map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <input value={cinema} onChange={e=>setCinema(e.target.value)} placeholder="Cinema (e.g. Odeon Leicester Sq)" style={{...S.inp,flex:1,fontSize:'13px'}}/>
              <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City" style={{...S.inp,width:'90px',fontSize:'13px'}}/>
            </div>
            <input type="datetime-local" value={at} onChange={e=>setAt(e.target.value)} style={{...S.inp,marginBottom:'8px',fontSize:'13px'}}/>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional) — 'IMAX, grabbing food after'" style={{...S.inp,marginBottom:'10px',fontSize:'13px'}}/>
            <Btn onClick={()=>{if(!filmId)return notify('Pick a film',T.red);hostScreening({filmId,cinema,city,at:at?new Date(at).toISOString():null,note});setHostOpen(false);setFilmId('');setCinema('');setCity('');setAt('');setNote('')}} color={T.gold} full>Post screening</Btn>
          </div>
        )}
        {upcoming.length===0&&!hostOpen&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No screenings posted. Be the first to organise one.</div>}
        {upcoming.map(s=>{
          const f=films.find(fl=>fl.id===s.film_id)
          const host=players.find(p=>p.id===s.host_id)
          const going=attendees.filter(a=>a.screening_id===s.id)
          const iGo=going.some(a=>a.user_id===profile?.id)
          const chain=BOOKING_CHAINS.find(c=>s.cinema?.toLowerCase().includes(c.id))||BOOKING_CHAINS[0]
          return(
            <div key={s.id} style={{...S.card,marginBottom:'10px'}}>
              <div style={{display:'flex',gap:'12px'}}>
                {f&&<FilmPoster film={f} width={46} height={69} radius={6}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'14px',fontWeight:700}}>{f?.title||'Film'}</div>
                  <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>
                    {s.cinema||'TBC'}{s.city?`, ${s.city}`:''}
                    {s.screening_at&&<> · {new Date(s.screening_at).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</>}
                  </div>
                  <div style={{fontSize:'10px',color:T.textDim,marginTop:'2px'}}>Hosted by {host?.name||'someone'}</div>
                  {s.note&&<div style={{fontSize:'11px',color:T.text,marginTop:'6px',fontStyle:'italic'}}>"{s.note}"</div>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}>
                <div style={{display:'flex',marginRight:'4px'}}>
                  {going.slice(0,5).map((a,i)=>{const ap=players.find(pl=>pl.id===a.user_id);return(
                    <div key={a.id} title={ap?.name} style={{width:'24px',height:'24px',borderRadius:'50%',background:ap?.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800,marginLeft:i?'-8px':0,border:`2px solid ${T.surface}`}}>{ap?.name?.[0]||'?'}</div>
                  )})}
                </div>
                <span style={{fontSize:'11px',color:T.textSub}}>{going.length} going</span>
                <div style={{flex:1}}/>
                <Btn onClick={()=>toggleAttend(s.id)} color={iGo?T.green:T.surfaceUp} textColor={iGo?'#0D0A08':T.text} size="sm">{iGo?'✓ Going':'Join'}</Btn>
                <a href={s.booking_url||affiliateWrap(chain.url,chain.id)} target="_blank" rel="noopener noreferrer" onClick={()=>trackBookingClick(s.film_id,chain.id)} style={{background:T.gold,color:'#0D0A08',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',fontWeight:700,textDecoration:'none'}}>🎟 Book</a>
                {s.host_id===profile?.id&&<button onClick={()=>cancelScreening(s.id)} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontSize:'12px'}}>✕</button>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const CommunityPage=()=>{
    const tab=communityTab,setTab=setCommunityTab
    const TabBtn=({id,label})=><button onClick={()=>setTab(id)} style={{...S.btn,background:'none',border:'none',padding:'8px 14px',fontSize:'12px',fontWeight:tab===id?700:400,color:tab===id?T.gold:T.textSub,borderBottom:`2px solid ${tab===id?T.gold:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0}}>{label}</button>
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>Community</div>
        <div style={{display:'flex',gap:'4px',borderBottom:`1px solid ${T.border}`,marginBottom:'14px',overflowX:'auto'}}>
          <TabBtn id="buzz" label="💬 Buzz"/>
          <TabBtn id="screenings" label="🎟 Screenings"/>
          <TabBtn id="anticipated" label="🔥 Anticipated"/>
          <TabBtn id="watchlists" label="👁 Watchlists"/>
          <TabBtn id="players" label="👥 Players"/>
        </div>
        {tab==='buzz'&&(()=>{
          // Unified social feed: reviews + comments merged, newest first
          const items=[
            ...reviews.map(r=>({type:'review',id:'r'+r.id,at:r.updated_at,user:r.user_id,film:r.film_id,rating:r.rating,body:r.body})),
            ...allComments.map(c=>({type:'comment',id:'c'+c.id,at:c.created_at,user:c.user_id,film:c.film_id,body:c.comment,gif:c.gif_url})),
          ].filter(x=>x.body||x.gif||x.rating).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,40)
          if(items.length===0)return <div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No chatter yet. Open any film → Comments or drop a review to start the conversation.</div>
          return items.map(item=>{
            const p=players.find(pl=>pl.id===item.user)
            const f=films.find(fl=>fl.id===item.film)
            const verb=item.type==='review'?'reviewed':'commented on'
            return(
              <div key={item.id} onClick={()=>f&&setFilmDetail(f)} className="hoverable" style={{...S.card,marginBottom:'8px',cursor:f?'pointer':'default',display:'flex',gap:'10px'}}>
                {f&&<FilmPoster film={f} width={38} height={57} radius={5}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',gap:'5px',alignItems:'baseline',flexWrap:'wrap'}}>
                    <span style={{fontSize:'12px',fontWeight:700,color:p?.color||T.gold}}>{p?.name||'Player'}</span>
                    <span style={{fontSize:'11px',color:T.textSub}}>{verb}</span>
                    <span style={{fontSize:'12px',fontWeight:700,color:f?T.gold:T.textDim}}>{f?f.title:'a film'}</span>
                    {item.rating&&<span style={{fontSize:'11px',color:T.gold,fontFamily:T.mono}}>{'★'.repeat(item.rating)}</span>}
                  </div>
                  {item.body&&<div style={{fontSize:'12px',color:T.textSub,lineHeight:1.5,marginTop:'4px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{item.body}</div>}
                  {item.gif&&<img src={item.gif} alt="" loading="lazy" style={{maxHeight:'70px',borderRadius:'6px',marginTop:'4px'}}/>}
                  <div style={{fontSize:'10px',color:T.textDim,marginTop:'4px'}}>{timeAgo(item.at)}</div>
                </div>
              </div>
            )
          })
        })()}
        {tab==='screenings'&&<ScreeningsTab/>}
        {tab==='anticipated'&&(()=>{
          const ranked=films.filter(f=>results[f.id]==null).map(f=>({f,count:allPicks.filter(p=>p.film_id===f.id).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count).slice(0,20)
          if(ranked.length===0)return <div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No watchlist data yet.</div>
          return ranked.map(({f,count},i)=>(
            <div key={f.id} onClick={()=>setFilmDetail(f)} className="hoverable" style={{...S.card,marginBottom:'8px',cursor:'pointer',display:'flex',gap:'12px',alignItems:'center'}}>
              <div style={{fontSize:'18px',color:i===0?T.red:i<3?T.orange:T.textSub,fontWeight:800,minWidth:'24px',fontFamily:T.mono}}>#{i+1}</div>
              <FilmPoster film={f} width={42} height={63} radius={6}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'11px',color:T.textSub}}>{f.dist} · W{f.week}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:'15px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>{count}</div><div style={{fontSize:'10px',color:T.textDim}}>watching</div></div>
            </div>
          ))
        })()}
        {tab==='watchlists'&&(()=>{
          const byPlayer=players.map(p=>({p,picks:allPicks.filter(pk=>pk.user_id===p.id).map(pk=>films.find(f=>f.id===pk.film_id)).filter(Boolean)})).filter(x=>x.picks.length>0)
          if(byPlayer.length===0)return <div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>Nobody's watchlisted any films yet.</div>
          return byPlayer.map(({p,picks})=>(
            <div key={p.id} style={{...S.card,marginBottom:'10px'}}>
              <div onClick={()=>goToProfile(p)} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px',cursor:'pointer'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:p.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{p.name?.[0]}</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:p.color}}>{p.name}</div><div style={{fontSize:'11px',color:T.textSub}}>{picks.length} films on watchlist</div></div>
              </div>
              <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
                {picks.slice(0,8).map(f=><div key={f.id} onClick={()=>setFilmDetail(f)} style={{cursor:'pointer',flexShrink:0}}><FilmPoster film={f} width={48} height={72} radius={5}/></div>)}
              </div>
            </div>
          ))
        })()}
        {tab==='players'&&players.map(p=>{
          const filmCount=rosters.filter(r=>r.player_id===p.id).length
          return(
            <div key={p.id} className="hoverable" onClick={()=>goToProfile(p)} style={{...S.card,marginBottom:'8px',cursor:'pointer',display:'flex',gap:'12px',alignItems:'center'}}>
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:p.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',fontWeight:700,flexShrink:0}}>{p.name?.[0]||'?'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'14px',fontWeight:700,color:p.color||T.gold}}>{p.name}</div>
                <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{filmCount} film{filmCount!==1?'s':''} picked</div>
              </div>
              <div style={{textAlign:'right'}}><div style={{fontSize:'17px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>{calcPoints(p.id)}</div><div style={S.label}>pts</div></div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── MOVIE OF WEEK PAGE — Post-launch ─────────────────────────────────────
  const MovieOfWeekPage=()=>{
    const[selFilm,setSelFilm]=useState('')
    const[hl,setHl]=useState('')
    const[bull,setBull]=useState('')
    const[bear,setBear]=useState('')
    const pinned=movieOfWeek
    const pinnedFilm=pinned?films.find(f=>f.id===pinned.film_id):null
    const submit=async()=>{
      if(!selFilm)return notify('Pick a film',T.red)
      const{error}=await supabase.from('movie_of_week').insert({league_id:league?.id,film_id:selFilm,week_num:cfg.current_week,headline:hl||null,bull_case:bull||null,bear_case:bear||null,created_by:profile.id})
      if(error)return notify(error.message,T.red)
      notify('🎬 Movie of the Week pinned',T.gold)
      setSelFilm('');setHl('');setBull('');setBear('')
      loadMovieOfWeek(league?.id)
    }
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>🎬 Movie of the Week</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Commissioner's spotlight pick with bull/bear case</div>
        {pinnedFilm&&pinned.week_num===cfg.current_week&&(
          <div style={{...S.card,marginBottom:'14px',padding:'18px',background:`linear-gradient(135deg,${T.gold}14,${T.surface})`,border:`1px solid ${T.gold}44`}}>
            <div style={{display:'flex',gap:'14px',marginBottom:'14px'}}>
              <FilmPoster film={pinnedFilm} width={72} height={108} radius={9}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{...S.label,color:T.gold,marginBottom:'4px'}}>Week {pinned.week_num} pick</div>
                <div style={{fontSize:'18px',fontWeight:800,marginBottom:'4px'}}>{pinnedFilm.title}</div>
                <div style={{fontSize:'12px',color:T.textSub}}>{pinnedFilm.dist} · est ${pinnedFilm.estM}M</div>
                {pinned.headline&&<div style={{fontSize:'13px',color:T.text,marginTop:'8px',fontStyle:'italic'}}>"{pinned.headline}"</div>}
              </div>
            </div>
            {pinned.bull_case&&<div style={{background:`${T.green}10`,border:`1px solid ${T.green}33`,borderRadius:'10px',padding:'12px',marginBottom:'8px'}}><div style={{fontSize:'11px',color:T.green,fontWeight:700,marginBottom:'4px'}}>🐂 BULL CASE</div><div style={{fontSize:'13px',color:T.text,lineHeight:1.5}}>{pinned.bull_case}</div></div>}
            {pinned.bear_case&&<div style={{background:`${T.red}10`,border:`1px solid ${T.red}33`,borderRadius:'10px',padding:'12px'}}><div style={{fontSize:'11px',color:T.red,fontWeight:700,marginBottom:'4px'}}>🐻 BEAR CASE</div><div style={{fontSize:'13px',color:T.text,lineHeight:1.5}}>{pinned.bear_case}</div></div>}
          </div>
        )}
        {isCommissioner&&(
          <div style={{...S.card,marginBottom:'14px'}}>
            <div style={{...S.label,marginBottom:'10px',color:T.orange}}>Pin a new Movie of the Week</div>
            <select value={selFilm} onChange={e=>setSelFilm(e.target.value)} style={{...S.inp,marginBottom:'10px'}}>
              <option value="">Select film…</option>
              {films.filter(f=>results[f.id]==null).map(f=><option key={f.id} value={f.id}>{f.title} · W{f.week}</option>)}
            </select>
            <input value={hl} onChange={e=>setHl(e.target.value)} placeholder="Headline (e.g. 'Could this be the surprise hit of summer?')" style={{...S.inp,marginBottom:'10px',fontSize:'13px'}}/>
            <textarea value={bull} onChange={e=>setBull(e.target.value)} placeholder="Bull case — why it overperforms…" style={{...S.inp,marginBottom:'10px',fontSize:'13px',minHeight:'70px',resize:'vertical',fontFamily:T.mono}}/>
            <textarea value={bear} onChange={e=>setBear(e.target.value)} placeholder="Bear case — why it could disappoint…" style={{...S.inp,marginBottom:'10px',fontSize:'13px',minHeight:'70px',resize:'vertical',fontFamily:T.mono}}/>
            <Btn onClick={submit} color={T.gold} full>Pin to League</Btn>
          </div>
        )}
      </div>
    )
  }

  // ── POLLS PAGE — Post-launch ─────────────────────────────────────────────
  const PollsPage=()=>{
    const[q,setQ]=useState('')
    const[opts,setOpts]=useState(['Yes','No'])
    const[selFilm,setSelFilm]=useState('')
    const vote=async(pollId,opt)=>{
      const existing=pollVotes.find(v=>v.poll_id===pollId&&v.player_id===profile.id)
      if(existing){
        await supabase.from('poll_votes').update({vote:opt}).eq('id',existing.id)
      }else{
        await supabase.from('poll_votes').insert({poll_id:pollId,player_id:profile.id,league_id:league?.id,vote:opt})
      }
      notify(`Voted: ${opt}`,T.blue);loadPolls(league?.id)
    }
    const submit=async()=>{
      if(!q.trim()||opts.filter(o=>o.trim()).length<2)return notify('Need a question + 2 options',T.red)
      const{error}=await supabase.from('polls').insert({league_id:league?.id,question:q.trim(),options:opts.filter(o=>o.trim()),film_id:selFilm||null,created_by:profile.id})
      if(error)return notify(error.message,T.red)
      notify('🗳 Poll posted',T.blue)
      setQ('');setOpts(['Yes','No']);setSelFilm('')
      loadPolls(league?.id)
    }
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>🗳 Quick Polls</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>League opinion checks · take the temperature of the room</div>
        {isCommissioner&&(
          <div style={{...S.card,marginBottom:'14px'}}>
            <div style={{...S.label,marginBottom:'10px',color:T.blue}}>New poll</div>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Question (e.g. 'Will Avatar 3 beat estimate?')" style={{...S.inp,marginBottom:'10px',fontSize:'13px'}}/>
            <div style={{...S.label,marginBottom:'6px'}}>Options</div>
            {opts.map((o,i)=>(
              <div key={i} style={{display:'flex',gap:'6px',marginBottom:'6px'}}>
                <input value={o} onChange={e=>{const n=[...opts];n[i]=e.target.value;setOpts(n)}} placeholder={`Option ${i+1}`} style={{...S.inp,flex:1,fontSize:'12px'}}/>
                {opts.length>2&&<button onClick={()=>setOpts(opts.filter((_,j)=>j!==i))} style={{background:T.surfaceUp,border:`1px solid ${T.border}`,color:T.red,padding:'8px 12px',borderRadius:'8px',cursor:'pointer',fontFamily:T.mono}}>✕</button>}
              </div>
            ))}
            {opts.length<4&&<button onClick={()=>setOpts([...opts,''])} style={{background:'none',border:`1px dashed ${T.border}`,color:T.textSub,padding:'6px 12px',borderRadius:'8px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px',marginBottom:'10px'}}>+ Add option</button>}
            <select value={selFilm} onChange={e=>setSelFilm(e.target.value)} style={{...S.inp,marginBottom:'10px',fontSize:'12px'}}>
              <option value="">No film attached</option>
              {films.filter(f=>results[f.id]==null).map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <Btn onClick={submit} color={T.blue} textColor="#fff" full>Post Poll</Btn>
          </div>
        )}
        {polls.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No polls yet.</div>:polls.map(poll=>{
          const myVote=pollVotes.find(v=>v.poll_id===poll.id&&v.player_id===profile.id)?.vote
          const filmRef=poll.film_id?films.find(f=>f.id===poll.film_id):null
          const tally={}
          ;(poll.options||[]).forEach(o=>{tally[o]=pollVotes.filter(v=>v.poll_id===poll.id&&v.vote===o).length})
          const totalVotes=Object.values(tally).reduce((s,n)=>s+n,0)
          return(
            <div key={poll.id} style={{...S.card,marginBottom:'10px'}}>
              {filmRef&&<div style={{fontSize:'10px',color:T.gold,marginBottom:'6px',letterSpacing:'1.5px'}}>📌 {filmRef.title}</div>}
              <div style={{fontSize:'14px',fontWeight:700,marginBottom:'12px'}}>{poll.question}</div>
              {(poll.options||[]).map(opt=>{
                const count=tally[opt]||0
                const pct=totalVotes?Math.round(count/totalVotes*100):0
                const isMine=myVote===opt
                return(
                  <div key={opt} onClick={()=>!poll.resolution&&vote(poll.id,opt)} style={{position:'relative',background:T.surfaceUp,border:`1px solid ${isMine?T.blue+'66':T.border}`,borderRadius:'8px',padding:'10px 12px',marginBottom:'6px',cursor:poll.resolution?'default':'pointer',overflow:'hidden'}}>
                    <div style={{position:'absolute',inset:0,width:`${pct}%`,background:`${T.blue}18`,pointerEvents:'none'}}/>
                    <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'13px',color:T.text,fontWeight:isMine?700:400}}>{opt}{isMine&&' ✓'}</span>
                      <span style={{fontSize:'11px',color:T.textSub,fontFamily:T.mono}}>{count} · {pct}%</span>
                    </div>
                  </div>
                )
              })}
              <div style={{fontSize:'10px',color:T.textDim,marginTop:'6px'}}>{totalVotes} vote{totalVotes!==1?'s':''} · {timeAgo(poll.created_at)}{poll.resolution&&<> · resolved: <strong style={{color:T.green}}>{poll.resolution}</strong></>}</div>
            </div>
          )
        })}
      </div>
    )
  }


  // ── DISTRIBUTOR INSIGHTS PAGE (with Sentiment Splits) ────────────────────
  // ── DISTRIBUTOR ACCESS MANAGER (commissioner) ───────────────────────────
  const ModerationPanel=()=>{
    const[busy,setBusy]=useState(false)
    const toggleBan=async(p)=>{
      if(!await confirmModal(`${p.is_banned?'Unban':'Ban'} ${p.name}? ${p.is_banned?'They can post again.':'They will no longer be able to post reviews, comments, or screenings.'}`,{danger:!p.is_banned}))return
      setBusy(true)
      await supabase.from('profiles').update({is_banned:!p.is_banned}).eq('id',p.id)
      setBusy(false)
      notify(p.is_banned?`${p.name} unbanned`:`${p.name} banned`,p.is_banned?T.green:T.red)
      loadData(league?.id)
    }
    return(
      <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.red}33`}}>
        <div style={{...S.label,marginBottom:'8px',color:T.red}}>🛡️ Moderation</div>
        <div style={{fontSize:'11px',color:T.textSub,marginBottom:'12px',lineHeight:1.5}}>
          Ban a user to stop them posting. You can also delete any review or comment directly (look for the red ✕ on their posts). For a full account block, disable them in Supabase → Authentication.
        </div>
        {players.filter(p=>p.id!==profile.id).length===0?<div style={{fontSize:'12px',color:T.textDim}}>No other players yet.</div>:
          players.filter(p=>p.id!==profile.id).map(p=>(
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:'28px',height:'28px',borderRadius:'50%',background:p.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'12px'}}>{p.name?.[0]||'?'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'12px',fontWeight:600,color:T.text}}>{p.name}{p.is_banned&&<span style={{color:T.red,fontSize:'10px',marginLeft:'6px'}}>BANNED</span>}</div>
              </div>
              <Btn onClick={()=>toggleBan(p)} variant="outline" color={p.is_banned?T.green:T.red} size="sm" disabled={busy}>{p.is_banned?'Unban':'Ban'}</Btn>
            </div>
          ))
        }
      </div>
    )
  }
  const DistributorAccessManager=()=>{
    const[codes,setCodes]=useState([])
    const[distName,setDistName]=useState('')
    const[email,setEmail]=useState('')
    const dists=[...new Set(films.map(f=>f.dist))].sort()
    useEffect(()=>{supabase.from('distributor_access').select('*').order('created_at',{ascending:false}).then(({data})=>{if(data)setCodes(data)})},[])
    const gen=async()=>{
      if(!distName)return notify('Pick a distributor',T.red)
      const code='BOXD-'+Math.random().toString(36).slice(2,8).toUpperCase()
      const{error}=await supabase.from('distributor_access').insert({distributor:distName,access_code:code,contact_email:email||null})
      if(error)return notify(error.message,T.red)
      setDistName('');setEmail('')
      const{data}=await supabase.from('distributor_access').select('*').order('created_at',{ascending:false})
      if(data)setCodes(data)
      notify(`✓ Access code created: ${code}`,T.green)
    }
    return(
      <div style={{...S.card,marginBottom:'12px'}}>
        <div style={{...S.label,marginBottom:'8px',color:T.blue}}>🔐 Distributor Access</div>
        <div style={{fontSize:'11px',color:T.textSub,marginBottom:'10px',lineHeight:1.5}}>Create a code that lets a distributor log into a read-only portal showing only their slate's intent data.</div>
        <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
          <select value={distName} onChange={e=>setDistName(e.target.value)} style={{...S.inp,flex:1,fontSize:'12px'}}>
            <option value="">Distributor…</option>
            {dists.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Contact email (optional)" style={{...S.inp,flex:1,fontSize:'12px'}}/>
          <Btn onClick={gen} color={T.blue} textColor="#fff" size="sm">Create</Btn>
        </div>
        {codes.map(c=>(
          <div key={c.id} style={{display:'flex',gap:'8px',alignItems:'center',padding:'7px 0',borderBottom:`1px solid ${T.border}`,fontSize:'12px'}}>
            <span style={{flex:1,fontWeight:600}}>{c.distributor}</span>
            <code style={{background:T.surfaceUp,padding:'2px 8px',borderRadius:'5px',color:T.gold,fontSize:'11px'}}>{c.access_code}</code>
            <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/?distributor=${c.access_code}`);notify('Portal link copied',T.green)}} style={{background:'none',border:'none',color:T.blue,cursor:'pointer',fontSize:'11px'}}>📋</button>
            <button onClick={async()=>{await supabase.from('distributor_access').delete().eq('id',c.id);setCodes(codes.filter(x=>x.id!==c.id))}} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontSize:'11px'}}>✕</button>
          </div>
        ))}
        {codes.length===0&&<div style={{fontSize:'11px',color:T.textDim}}>No access codes yet.</div>}
      </div>
    )
  }

  const DistributorPage=()=>{
    const dists=[...new Set(films.map(f=>f.dist))]
    const pickCounts={};allPicks.forEach(p=>{pickCounts[p.film_id]=(pickCounts[p.film_id]||0)+1})
    const selDist=distSel,setSelDist=setDistSel
    const b2bFilmId=distFilmId,setB2bFilmId=setDistFilmId
    const b2bFilm=films.find(f=>f.id===b2bFilmId)
    const openDist=(d)=>{
      const distFilms=films.filter(f=>f.dist===d).sort((a,b)=>(pickCounts[b.id]||0)-(pickCounts[a.id]||0))
      setSelDist(d);setB2bFilmId(distFilms[0]?.id||'')
    }
    // ── DISTRIBUTOR DETAIL VIEW ──────────────────────────────────────────
    if(selDist){
      const distFilms=films.filter(f=>f.dist===selDist).sort((a,b)=>a.week-b.week)
      const watchers=allPicks.filter(p=>distFilms.find(f=>f.id===p.film_id)).length
      const owners=rosters.filter(r=>r.active&&distFilms.find(f=>f.id===r.film_id)).length
      const clicksTotal=bookingClicks.filter(b=>distFilms.find(f=>f.id===b.film_id)).length
      const resulted=distFilms.filter(f=>results[f.id]!=null)
      const totalActual=resulted.reduce((s,f)=>s+results[f.id],0)
      const totalEst=resulted.filter(f=>f.estM).reduce((s,f)=>s+f.estM,0)
      const slateRatio=totalEst>0?totalActual/totalEst:null
      return(
        <div style={{animation:'fadeUp .2s ease'}}>
          <button onClick={()=>setSelDist(null)} style={{background:'none',border:'none',color:T.blue,fontSize:'13px',cursor:'pointer',padding:'0 0 12px',fontWeight:600}}>‹ All distributors</button>
          <div style={S.pageTitle}>{selDist}</div>
          <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>{distFilms.length} films on the 2026 slate · {resulted.length} opened</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:'8px',marginBottom:'16px'}}>
            <StatBox label="Watchers" value={watchers} color={T.gold}/>
            <StatBox label="Owners" value={owners} color={T.gold}/>
            <StatBox label="Booking clicks" value={clicksTotal} color={T.green}/>
            <StatBox label="Slate vs est" value={slateRatio!=null?`${slateRatio.toFixed(2)}×`:'—'} color={slateRatio>=1?T.green:slateRatio!=null?T.red:T.textSub}/>
          </div>
          {(()=>{
            // Conversion funnel + audience lock-in timing + genre benchmark
            const distPickRows=allPicks.filter(p=>distFilms.find(f=>f.id===p.film_id)&&p.picked_at)
            const ownConv=watchers>0?Math.round(owners/watchers*100):null
            const clickConv=watchers>0?Math.round(clicksTotal/watchers*100):null
            const lockIns=distPickRows.map(p=>{const f=distFilms.find(fl=>fl.id===p.film_id);const wk=Math.max(1,Math.floor((new Date(p.picked_at)-SEASON_ANCHOR)/(7*86400000))+1);return f.week-wk}).filter(n=>n>=0).sort((a,b)=>a-b)
            const medLock=lockIns.length?lockIns[Math.floor(lockIns.length/2)]:null
            const allLock=allPicks.filter(p=>p.picked_at).map(p=>{const f=films.find(fl=>fl.id===p.film_id);if(!f)return null;const wk=Math.max(1,Math.floor((new Date(p.picked_at)-SEASON_ANCHOR)/(7*86400000))+1);return f.week-wk}).filter(n=>n!=null&&n>=0).sort((a,b)=>a-b)
            const leagueLock=allLock.length?allLock[Math.floor(allLock.length/2)]:null
            const topG=Object.entries(distFilms.reduce((a,f)=>({...a,[f.genre]:(a[f.genre]||0)+1}),{})).sort((a,b)=>b[1]-a[1])[0]?.[0]
            const genreComps=films.filter(f=>f.genre===topG&&f.dist!==selDist&&results[f.id]!=null&&f.estM)
            const genreAvg=genreComps.length?genreComps.reduce((s,f)=>s+results[f.id]/f.estM,0)/genreComps.length:null
            return(
              <div style={{...S.card,marginBottom:'14px',background:T.surfaceUp}}>
                <div style={{...S.label,marginBottom:'10px',color:T.blue}}>Audience Insight</div>
                <div style={{fontSize:'12px',color:T.text,lineHeight:1.9}}>
                  {ownConv!=null&&<div>🔁 <strong style={{color:T.gold}}>{ownConv}%</strong> of watchers convert to owning the film{clickConv!=null&&<> · <strong style={{color:T.green}}>{clickConv}%</strong> click through to book</>}</div>}
                  {medLock!=null&&<div>⏱ Audience locks in <strong style={{color:T.gold}}>{medLock} week{medLock!==1?'s':''} before release</strong>{leagueLock!=null&&<span style={{color:T.textSub}}> (league median: {leagueLock}w)</span>}{leagueLock!=null&&medLock>leagueLock&&<span style={{color:T.green}}> — earlier commitment than average</span>}</div>}
                  {slateRatio!=null&&genreAvg!=null&&topG&&<div>🎭 {topG} slate performs <strong style={{color:slateRatio>=genreAvg?T.green:T.red}}>{slateRatio>=genreAvg?'+':''}{Math.round((slateRatio-genreAvg)*100)}pts vs est</strong> against other distributors' {topG.toLowerCase()} titles ({genreAvg.toFixed(2)}× benchmark)</div>}
                  {distPickRows.length===0&&<div style={{color:T.textDim}}>Insight builds as watchlist activity accrues on this slate.</div>}
                </div>
              </div>
            )
          })()}
          <div style={{...S.label,marginBottom:'8px'}}>Slate — tap a film for its intent report</div>
          {distFilms.map(f=>{
            const w=allPicks.filter(p=>p.film_id===f.id).length
            const sel=f.id===b2bFilmId
            return(
              <div key={f.id} onClick={()=>setB2bFilmId(f.id)} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center',padding:'8px 12px',border:`1px solid ${sel?T.gold+'66':T.border}`}}>
                <FilmPoster film={f} width={30} height={45} radius={4}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'12px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.title}</div>
                  <div style={{fontSize:'10px',color:T.textSub}}>{dateLabel(f.week)} · P{f.phase}{results[f.id]!=null?` · ✓ $${results[f.id]}M`:''}</div>
                </div>
                <span style={{fontSize:'10px',color:T.textSub,fontFamily:T.mono}}>👁 {w}</span>
                <span style={{color:sel?T.gold:T.textDim}}>{sel?'▾':'›'}</span>
              </div>
            )
          })}
          <div style={{marginTop:'14px'}}/>

        {/* ── B2B FILM INTENT REPORT ─────────────────────────────────── */}
        {b2bFilm&&(()=>{
          const filmPicks=allPicks.filter(p=>p.film_id===b2bFilm.id&&p.picked_at)
          // Weekly intent buckets from first pick to now
          const weekOf=d=>Math.max(1,Math.floor((new Date(d)-SEASON_ANCHOR)/(7*86400000))+1)
          const nowWk=cfg.current_week
          const buckets={}
          filmPicks.forEach(p=>{const w=weekOf(p.picked_at);buckets[w]=(buckets[w]||0)+1})
          const firstWk=filmPicks.length?Math.min(...Object.keys(buckets).map(Number)):nowWk
          const weeks=[];for(let w=firstWk;w<=Math.min(nowWk,b2bFilm.week);w++)weeks.push(w)
          const maxAdds=Math.max(1,...weeks.map(w=>buckets[w]||0))
          // Marketing events + 7-day lift
          const events=marketingEvents.filter(m=>m.film_id===b2bFilm.id&&m.event_date)
          const eventWeeks=new Set(events.map(e=>weekOf(e.event_date)))
          const lift=e=>{
            const t=new Date(e.event_date).getTime()
            const before=filmPicks.filter(p=>{const d=new Date(p.picked_at).getTime();return d>=t-7*86400000&&d<t}).length
            const after=filmPicks.filter(p=>{const d=new Date(p.picked_at).getTime();return d>=t&&d<t+7*86400000}).length
            return{before,after}
          }
          // Forecast spread
          const fcs=allForecasts.filter(f=>f.film_id===b2bFilm.id).map(f=>Number(f.predicted_m)).filter(n=>!isNaN(n)).sort((a,b)=>a-b)
          const median=fcs.length?fcs[Math.floor(fcs.length/2)]:null
          const clicks=bookingClicks.filter(b=>b.film_id===b2bFilm.id).length
          const owners=rosters.filter(r=>r.film_id===b2bFilm.id&&r.active).length
          const actual=results[b2bFilm.id]
          const exportCSV=()=>{
            const rows=[['week','week_commencing','watchlist_adds','marketing_event'].join(',')]
            weeks.forEach(w=>{
              const ev=events.find(e=>weekOf(e.event_date)===w)
              rows.push([w,dateLabel(w),buckets[w]||0,ev?`"${(ev.title||ev.event_type||'event').replace(/"/g,"'")}"`:''].join(','))
            })
            rows.push('')
            rows.push(['metric','value'].join(','))
            rows.push(['film',`"${b2bFilm.title}"`].join(','))
            rows.push(['distributor',`"${b2bFilm.dist}"`].join(','))
            rows.push(['total_watchers',filmPicks.length].join(','))
            rows.push(['active_owners',owners].join(','))
            rows.push(['booking_clicks',clicks].join(','))
            rows.push(['crowd_forecast_median_m',median??''].join(','))
            rows.push(['crowd_forecast_n',fcs.length].join(','))
            rows.push(['estimate_m',b2bFilm.estM??''].join(','))
            rows.push(['actual_opening_m',actual??''].join(','))
            const blob=new Blob([rows.join('\n')],{type:'text/csv'})
            const a=document.createElement('a');a.href=URL.createObjectURL(blob)
            a.download=`boxd-intent-${b2bFilm.id}.csv`;a.click();URL.revokeObjectURL(a.href)
          }
          return(
            <div style={{...S.card,marginBottom:'16px',border:`1px solid ${T.gold}33`,background:`linear-gradient(135deg,${T.gold}06,${T.surface})`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px',marginBottom:'10px',flexWrap:'wrap'}}>
                <div style={{fontSize:'14px',fontWeight:800,color:T.gold}}>🎯 Film Intent Report</div>
                <Btn onClick={exportCSV} variant="outline" color={T.blue} size="sm">⬇ CSV</Btn>
              </div>
              {/* Intent curve */}
              <div style={{...S.label,marginBottom:'6px'}}>Watchlist adds per week{eventWeeks.size>0&&' · ▲ marketing event'}</div>
              {filmPicks.length===0
                ?<div style={{fontSize:'11px',color:T.textDim,padding:'14px 0'}}>No watchlist activity yet for this title.</div>
                :<div style={{display:'flex',alignItems:'flex-end',gap:'3px',height:'70px',marginBottom:'4px'}}>
                  {weeks.map(w=>{
                    const v=buckets[w]||0
                    return(
                      <div key={w} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',height:'100%',justifyContent:'flex-end'}} title={`${dateLabel(w)}: ${v} adds`}>
                        {v>0&&<span style={{fontSize:'8px',color:T.textSub,fontFamily:T.mono}}>{v}</span>}
                        <div style={{width:'100%',height:`${Math.max(3,(v/maxAdds)*52)}px`,background:eventWeeks.has(w)?T.orange:T.gold,borderRadius:'3px 3px 0 0',opacity:v===0?0.15:1}}/>
                        <span style={{fontSize:'7px',color:eventWeeks.has(w)?T.orange:T.textDim}}>{eventWeeks.has(w)?'▲':''}</span>
                      </div>
                    )
                  })}
                </div>
              }
              {/* Marketing lift readouts */}
              {events.slice(0,3).map(e=>{
                const{before,after}=lift(e)
                const pct=before>0?Math.round(((after-before)/before)*100):(after>0?100:0)
                return(
                  <div key={e.id} style={{fontSize:'10px',color:T.textSub,marginBottom:'3px'}}>
                    ▲ <span style={{color:T.orange}}>{e.title||e.event_type||'Event'}</span> · {new Date(e.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} → <span style={{color:pct>=0?T.green:T.red,fontWeight:700,fontFamily:T.mono}}>{pct>=0?'+':''}{pct}%</span> adds (7d: {before}→{after})
                  </div>
                )
              })}
              {/* Headline metrics */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',gap:'8px',marginTop:'12px'}}>
                <StatBox label="Watchers" value={filmPicks.length} color={T.gold}/>
                <StatBox label="Owners" value={owners} color={T.gold}/>
                <StatBox label="Booking clicks" value={clicks} color={T.green}/>
                <StatBox label="Crowd forecast" value={median!=null?`$${median}M`:'—'} color={T.blue}/>
                {b2bFilm.estM!=null&&<StatBox label="Studio est" value={`$${b2bFilm.estM}M`} color={T.text}/>}
                {actual!=null&&<StatBox label="Actual" value={`$${actual}M`} color={T.green}/>}
              </div>
              {median!=null&&actual!=null&&(
                <div style={{fontSize:'10px',color:T.textSub,marginTop:'8px'}}>
                  Crowd accuracy: forecast ${median}M vs actual ${actual}M — <span style={{color:Math.abs(median-actual)/actual<=0.15?T.green:T.orange,fontWeight:700}}>{Math.round(Math.abs(median-actual)/actual*100)}% off</span> ({fcs.length} predictions)
                </div>
              )}
            </div>
          )
        })()}

        </div>
      )
    }
    // ── DISTRIBUTOR LIST VIEW ────────────────────────────────────────────
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>📈 Distributor Insights</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Tap a distributor for their slate report · how the league reads each slate</div>
        {dists.map(d=>{
          const distFilms=films.filter(f=>f.dist===d)
          const distResulted=distFilms.filter(f=>results[f.id]!=null)
          const distPicks=allPicks.filter(p=>distFilms.find(f=>f.id===p.film_id))
          if(distPicks.length===0&&distResulted.length===0)return null
          // Early-mover percentage — pickers who watchlisted >2 weeks before release
          const earlyMovers=distPicks.filter(p=>{
            const f=distFilms.find(fl=>fl.id===p.film_id);if(!f)return false
            const wkAtPick=cfg.current_week
            return f.week-wkAtPick>=2
          }).length
          const earlyPct=distPicks.length?Math.round(earlyMovers/distPicks.length*100):0
          // Picker accuracy — % of picks on films that overperformed
          const accuracyData=distResulted.map(f=>{
            const wasWatched=allPicks.some(p=>p.film_id===f.id)
            return{f,wasWatched,beat:results[f.id]/f.estM>=1.1}
          })
          const watchedHits=accuracyData.filter(x=>x.wasWatched&&x.beat).length
          const watchedTotal=accuracyData.filter(x=>x.wasWatched).length
          const accuracy=watchedTotal?Math.round(watchedHits/watchedTotal*100):null
          // Genre profile
          const genreBreak={}
          distFilms.forEach(f=>{genreBreak[f.genre]=(genreBreak[f.genre]||0)+1})
          const topGenre=Object.entries(genreBreak).sort((a,b)=>b[1]-a[1])[0]
          // Taste cluster — 5 films most co-picked with this distributor
          const peopleWhoLike=[...new Set(distPicks.map(p=>p.user_id))]
          const cluster={}
          allPicks.forEach(p=>{
            if(!peopleWhoLike.includes(p.user_id))return
            const f=films.find(fl=>fl.id===p.film_id)
            if(!f||f.dist===d)return
            cluster[f.id]=(cluster[f.id]||0)+1
          })
          const clusterTop=Object.entries(cluster).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id])=>films.find(f=>f.id===id)).filter(Boolean)
          // Build insight line
          let headline=''
          if(earlyPct>=60&&accuracy>=60)headline=`Players read ${d} early and accurately — this distributor is followed.`
          else if(earlyPct>=60)headline=`Strong early interest in ${d}'s slate; jury still out on accuracy.`
          else if(accuracy>=60)headline=`${d}'s slate consistently rewards late buyers.`
          else if(distPicks.length<3)headline=`Limited engagement with ${d}'s slate so far.`
          else headline=`Mixed signals — the league is undecided on ${d}.`
          return(
            <div key={d} onClick={()=>openDist(d)} className="hoverable" style={{...S.card,marginBottom:'12px',cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                <div style={{fontSize:'15px',fontWeight:700,color:T.blue}}>{d}</div>
                <span style={{color:T.textDim,fontSize:'14px'}}>›</span>
              </div>
              <div style={{fontSize:'12px',color:T.text,marginBottom:'12px',lineHeight:1.5,fontStyle:'italic'}}>{headline}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                <StatBox label="Early-mover" value={`${earlyPct}%`} color={earlyPct>=60?T.green:T.text}/>
                <StatBox label="Accuracy" value={accuracy!=null?`${accuracy}%`:'—'} color={accuracy>=60?T.green:accuracy<40?T.red:T.text}/>
                <StatBox label="Top genre" value={topGenre?.[0]||'—'} color={topGenre?GENRE_COL[topGenre[0]]||T.text:T.textSub}/>
              </div>
              {clusterTop.length>0&&<>
                <div style={{...S.label,marginBottom:'6px'}}>Co-picked with</div>
                <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
                  {clusterTop.map(f=><div key={f.id} onClick={()=>setFilmDetail(f)} style={{cursor:'pointer',flexShrink:0}}><FilmPoster film={f} width={42} height={63} radius={5}/></div>)}
                </div>
              </>}
            </div>
          )
        })}
      </div>
    )
  }

  // ── COMMISSIONER PAGE ────────────────────────────────────────────────────
  // ── FILM EDITOR ROW — inline edit + delete for commissioner slate view ───
  const FilmEditorRow=({film,results,weeklyG,onSave,onDelete})=>{
    const[open,setOpen]=useState(false)
    const[vals,setVals]=useState({
      title:film.title,dist:film.dist,genre:film.genre,
      base_price:film.basePrice??'',est_m:film.estM??'',
      rt:film.rt??'',star_actor:film.starActor??'',
      trailer:film.trailer??'',week:film.week,phase:film.phase,
      actual_m:results[film.id]??'',
      week2:weeklyG[film.id]?.[2]??'',week3:weeklyG[film.id]?.[3]??'',
      week4:weeklyG[film.id]?.[4]??'',week5:weeklyG[film.id]?.[5]??'',week6:weeklyG[film.id]?.[6]??'',
    })
    const set=(k,v)=>setVals(prev=>({...prev,[k]:v}))
    const inp={...S.inp,fontSize:'11px',padding:'5px 8px',marginBottom:'6px'}
    const actual=results[film.id]
    return(
      <div style={{borderBottom:`1px solid ${T.border}`,padding:'8px 0'}}>
        {/* Collapsed row */}
        <div style={{display:'flex',gap:'8px',alignItems:'center',cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
          <div style={{flex:1,minWidth:0}}>
            <span style={{fontSize:'12px',fontWeight:600,color:T.text}}>{film.title}</span>
            <span style={{fontSize:'10px',color:T.textSub,marginLeft:'8px'}}>P{film.phase} · W{film.week} · {film.dist}</span>
            {actual!=null&&<span style={{fontSize:'10px',color:T.green,marginLeft:'8px',fontFamily:T.mono}}>✓ ${actual}M</span>}
            {film.basePrice==null&&<span style={{fontSize:'10px',color:T.textDim,marginLeft:'8px'}}>🔒 TBC</span>}
          </div>
          <span style={{color:T.textDim,fontSize:'12px'}}>{open?'▲':'▼'}</span>
          <button onClick={e=>{e.stopPropagation();onDelete()}} aria-label={`Delete ${film.title}`} style={{background:'none',border:`1px solid ${T.red}44`,borderRadius:'6px',color:T.red,fontSize:'11px',padding:'3px 8px',cursor:'pointer',flexShrink:0}}>🗑</button>
        </div>
        {/* Expanded editor */}
        {open&&(
          <div style={{marginTop:'10px',background:T.surfaceUp,borderRadius:'10px',padding:'12px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'6px'}}>
              <div><div style={{...S.label,marginBottom:'4px'}}>Title</div><input value={vals.title} onChange={e=>set('title',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Distributor</div><input value={vals.dist} onChange={e=>set('dist',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Genre</div>
                <select value={vals.genre} onChange={e=>set('genre',e.target.value)} style={inp}>
                  {['Action','Horror','Drama','Family','Sci-Fi','Animation','Comedy','Thriller','Adventure','Concert'].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Phase</div>
                <select value={vals.phase} onChange={e=>set('phase',Number(e.target.value))} style={inp}>
                  {ALL_PHASES.map(p=><option key={p} value={p}>P{p} — {PHASE_NAMES[p]}</option>)}
                </select>
              </div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Week #</div><input type="number" value={vals.week} onChange={e=>set('week',Number(e.target.value))} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>IPO Price ($M)</div><input type="number" value={vals.base_price} onChange={e=>set('base_price',e.target.value)} placeholder="leave blank = TBC" style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Est Opening ($M)</div>
                <div style={{display:'flex',gap:'4px'}}>
                  <input type="number" value={vals.est_m} onChange={e=>set('est_m',e.target.value)} style={{...inp,flex:1}}/>
                  {(()=>{const sug=estimateOpening(film);return sug?<button onClick={()=>set('est_m',sug.est)} title={`Based on ${sug.n} ${sug.basis}`} style={{background:`${T.blue}18`,border:`1px solid ${T.blue}44`,borderRadius:'6px',color:T.blue,fontSize:'10px',fontWeight:700,padding:'0 8px',cursor:'pointer',whiteSpace:'nowrap'}}>≈ ${sug.est}</button>:null})()}
                </div>
              </div>
              <div><div style={{...S.label,marginBottom:'4px'}}>RT Score (0–100)</div><input type="number" value={vals.rt} onChange={e=>set('rt',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Star Actor</div><input value={vals.star_actor} onChange={e=>set('star_actor',e.target.value)} style={inp}/></div>
            </div>
            <div><div style={{...S.label,marginBottom:'4px'}}>Trailer URL (youtube embed)</div><input value={vals.trailer} onChange={e=>set('trailer',e.target.value)} placeholder="https://www.youtube.com/embed/..." style={{...inp,width:'100%',boxSizing:'border-box'}}/></div>
            <div style={{...S.label,marginBottom:'8px',marginTop:'10px',color:T.green}}>Results</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              <div><div style={{...S.label,marginBottom:'4px'}}>Opening W/E ($M)</div><input type="number" value={vals.actual_m} onChange={e=>set('actual_m',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Week 2 ($M)</div><input type="number" value={vals.week2} onChange={e=>set('week2',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Week 3 ($M)</div><input type="number" value={vals.week3} onChange={e=>set('week3',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Week 4 ($M)</div><input type="number" value={vals.week4} onChange={e=>set('week4',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Week 5 ($M)</div><input type="number" value={vals.week5} onChange={e=>set('week5',e.target.value)} style={inp}/></div>
              <div><div style={{...S.label,marginBottom:'4px'}}>Week 6 ($M)</div><input type="number" value={vals.week6} onChange={e=>set('week6',e.target.value)} style={inp}/></div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
              <Btn onClick={()=>setOpen(false)} variant="outline" color={T.textSub} size="sm" sx={{flex:1}}>Cancel</Btn>
              <Btn onClick={()=>{
                const updates={
                  title:vals.title.trim()||film.title,
                  dist:vals.dist.trim()||film.dist,
                  genre:vals.genre,
                  phase:Number(vals.phase),
                  week:Number(vals.week),
                  base_price:vals.base_price!==''?Number(vals.base_price):null,
                  est_m:vals.est_m!==''?Number(vals.est_m):null,
                  rt:vals.rt!==''?Number(vals.rt):null,
                  star_actor:vals.star_actor.trim()||null,
                  trailer:vals.trailer.trim()||null,
                  actual_m:vals.actual_m!==''?vals.actual_m:null,
                  week2:vals.week2!==''?vals.week2:null,week3:vals.week3!==''?vals.week3:null,
                  week4:vals.week4!==''?vals.week4:null,week5:vals.week5!==''?vals.week5:null,week6:vals.week6!==''?vals.week6:null,
                }
                onSave(updates);setOpen(false)
              }} color={T.green} textColor="#0D0A08" size="sm" sx={{flex:2}}>Save Changes</Btn>
            </div>
          </div>
        )}
      </div>
    )
  }

  const CommissionerPage=()=>{
    const tab=commishTab,setTab=setCommishTab
    const TabBtn=({id,label})=><button onClick={()=>setTab(id)} style={{...S.btn,background:'none',border:'none',padding:'8px 14px',fontSize:'12px',fontWeight:tab===id?700:400,color:tab===id?T.gold:T.textSub,borderBottom:`2px solid ${tab===id?T.gold:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0}}>{label}</button>
    const runIngest=async()=>{
      if(!await confirmModal('Run box office ingest now?'))return
      try{
        const res=await fetch(`${SUPABASE_URL}/functions/v1/ingest-results`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${SUPABASE_ANON_KEY}`}})
        const data=await res.json()
        setIngestLog(data)
        notify(`✓ Ingested ${data.matched||0} films`,T.green)
        loadData(league?.id)
      }catch(e){notify(`Ingest failed: ${e.message}`,T.red)}
    }
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>⚙️ Commissioner Panel</div>
        <div style={{display:'flex',gap:'2px',borderBottom:`1px solid ${T.border}`,marginBottom:'14px',overflowX:'auto'}}>
          <TabBtn id="phase" label="Phase"/><TabBtn id="windows" label="Windows"/><TabBtn id="films" label="Films"/><TabBtn id="bulk" label="Bulk Import"/><TabBtn id="advanced" label="Advanced"/>
        </div>

        {tab==='phase'&&<>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'10px',color:T.gold}}>Current State</div>
            <div style={{display:'flex',gap:'12px',marginBottom:'12px'}}>
              <StatBox label="Week" value={cfg.current_week}/>
              <StatBox label="Phase" value={ph} sub={PHASE_NAMES[ph]}/>
              <StatBox label="Window" value={win?'Open':'Closed'} color={win?T.green:T.textSub}/>
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <Btn onClick={async()=>{if(await updateLeagueConfig({current_week:cfg.current_week+1}))notify(`Week ${cfg.current_week+1}`,T.gold)}} color={T.gold} size="sm">Week +1</Btn>
              <Btn onClick={async()=>{if(await updateLeagueConfig({current_week:Math.max(1,cfg.current_week-1)}))notify(`Week ${Math.max(1,cfg.current_week-1)}`,T.gold)}} variant="outline" color={T.gold} size="sm">Week −1</Btn>
              <Btn onClick={advancePhase} color={T.purple} textColor="#fff" size="sm" disabled={phaseTransitioning}>Advance Phase →</Btn>
            </div>
          </div>

          {/* SAMPLE SIGNALS — launch helper */}
          <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.red}33`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div><div style={{fontSize:'14px',fontWeight:700,color:T.red}}>📡 Sample Signals</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>One-click seed · launch-day kickstart</div></div>
              <Btn onClick={async()=>{
                if(!await confirmModal('Add 8 sample news signals to kickstart the league?'))return
                const upcoming=films.filter(f=>results[f.id]==null&&f.phase===ph).slice(0,8)
                if(upcoming.length<3)return notify('Need at least 3 unresulted films',T.red)
                const samples=[
                  {type:'rt_score',sent:'positive',head:f=>`${f.title.split(':')[0]} hits 92% on Rotten Tomatoes`,imp:8,detail:f=>`Critics praise direction and performances. ${f.dist} expecting strong word-of-mouth.`},
                  {type:'trailer',sent:'positive',head:f=>`Final trailer for ${f.title.split(':')[0]} crosses 12M views in 24hrs`,imp:5,detail:f=>'Trailer trending across social platforms. Engagement metrics strongest in the 18-34 demo.'},
                  {type:'festival',sent:'positive',head:f=>`${f.title.split(':')[0]} earns 8-minute standing ovation at premiere`,imp:6,detail:f=>'Early industry buzz is strong. Awards-season chatter beginning.'},
                  {type:'box_office',sent:'neutral',head:f=>`Pre-sales for ${f.title.split(':')[0]} tracking ahead of estimate`,imp:4,detail:f=>'Tracking firms revising opening estimates upward by 10-15%.'},
                  {type:'controversy',sent:'negative',head:f=>`${f.title.split(':')[0]} faces backlash over marketing campaign`,imp:-6,detail:f=>'Social media discourse turning negative. Studio response pending.'},
                  {type:'rt_score',sent:'negative',head:f=>`${f.title.split(':')[0]} disappoints critics with 38% RT score`,imp:-12,detail:f=>'Reviews cite pacing issues and weak third act.'},
                  {type:'casting',sent:'positive',head:f=>`Lead cast doing major press tour for ${f.title.split(':')[0]}`,imp:3,detail:f=>'Late Show, Fallon, podcast circuit all booked.'},
                  {type:'box_office',sent:'positive',head:f=>`Industry analysts upgrade ${f.title.split(':')[0]} to overperform`,imp:7,detail:f=>'Box office tracking now suggests opening weekend could clear estimates by 25%.'},
                ]
                const rows=upcoming.slice(0,8).map((f,i)=>{
                  const s=samples[i%samples.length]
                  return{
                    league_id:league?.id,film_id:f.id,signal_type:s.type,
                    headline:s.head(f),detail:s.detail(f),
                    sentiment:s.sent,price_impact:null,
                    created_by:profile.id,
                    signal_date:new Date(Date.now()-(i*3600000*4)).toISOString(),
                  }
                })
                const{error}=await supabase.from('news_signals').insert(rows)
                if(error)return notify(error.message,T.red)
                notify(`📡 ${rows.length} sample signals published`,T.red)
                loadNews(league?.id)
              }} color={T.red} textColor="#fff" size="sm">🌱 Seed 8 Signals</Btn>
            </div>
            <div style={{fontSize:'11px',color:T.textDim,lineHeight:1.5}}>Inserts a mix of positive/negative news across your upcoming slate. Players see prices move immediately. Run once before launch.</div>
          </div>

          {/* Ingest */}
          <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.green}33`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div><div style={{fontSize:'14px',fontWeight:700,color:T.green}}>📊 Box Office Ingest</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>Pulls from The Numbers · runs auto Monday 23:00 UTC</div></div>
              <Btn onClick={runIngest} color={T.green} textColor="#0D0A08" size="sm">🎬 Run Now</Btn>
            </div>
            {ingestLog&&<div style={{fontSize:'11px',color:T.textSub,fontFamily:T.mono,background:T.surfaceUp,padding:'10px',borderRadius:'8px'}}>{JSON.stringify(ingestLog,null,2)}</div>}
          </div>
        </>}

        {tab==='windows'&&<>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.green}}>Free Trade Window</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'12px'}}>72hr period at phase start where sells have no fees.</div>
            <Btn onClick={async()=>{
              const newState=!win
              await updateLeagueConfig({phase_window_active:newState,phase_window_opened_at:newState?new Date().toISOString():null})
              loadData(league?.id);notify(`Window ${newState?'opened':'closed'}`,newState?T.green:T.red)
            }} color={win?T.red:T.green} textColor={win?'#fff':'#0D0A08'} size="sm">{win?'Close Window':'Open Window'}</Btn>
          </div>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.orange}}>Draft Window</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'12px'}}>Players must pick {DRAFT_MIN}+ films during draft or face {DRAFT_PENALTY}pt penalty each.</div>
            <Btn onClick={async()=>{
              const newState=!draftWindowOpen
              const dl=newState?new Date(Date.now()+72*3600000).toISOString():null
              await updateLeagueConfig({draft_window_open:newState,draft_deadline:dl})
              loadData(league?.id);notify(`Draft ${newState?'opened':'closed'}`,newState?T.green:T.red)
            }} color={draftWindowOpen?T.red:T.orange} textColor="#fff" size="sm">{draftWindowOpen?'Close Draft':'Open Draft'}</Btn>
          </div>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.blue}}>Sealed-bid Window</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'12px'}}>For high-demand films · highest blind bid wins.</div>
            <Btn onClick={async()=>{
              const newState=!sealedWindowOpen
              const dl=newState?new Date(Date.now()+48*3600000).toISOString():null
              await updateLeagueConfig({sealed_bid_window_open:newState,sealed_bid_deadline:dl})
              loadData(league?.id);notify(`Sealed bid ${newState?'opened':'closed'}`,newState?T.green:T.red)
            }} color={sealedWindowOpen?T.red:T.blue} textColor="#fff" size="sm">{sealedWindowOpen?'Close':'Open'} Bid Window</Btn>
          </div>
        </>}

        {tab==='films'&&<>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div style={{fontSize:'14px',fontWeight:700}}>Films · {films.length}</div>
              <Btn onClick={()=>setAddFilm(true)} color={T.gold} size="sm">+ Add Film</Btn>
            </div>
            <div style={{fontSize:'11px',color:T.textSub}}>Tap any film below to edit or delete it · use War Room for bulk weekend results.</div>
          </div>
          {/* ── DATA HEALTH ─────────────────────────────────────────────── */}
          {(()=>{
            const cur=films.filter(f=>f.phase===ph)
            const pendingResults=films.filter(f=>f.week<cfg.current_week&&results[f.id]==null)
            const missingRT=cur.filter(f=>f.rt==null&&results[f.id]==null)
            const missingEst=cur.filter(f=>f.estM==null)
            const missingTrailer=cur.filter(f=>!f.trailer)
            const unpriced=cur.filter(f=>f.basePrice==null)
            const priceLeaks=films.filter(f=>f.phase>ph&&f.basePrice!=null)
            const Stat=({label,items,color,critical})=>(
              <details style={{background:T.surfaceUp,borderRadius:'8px',padding:'8px 10px',border:`1px solid ${items.length===0?T.green+'33':critical?T.red+'55':color+'44'}`}}>
                <summary style={{cursor:'pointer',listStyle:'none',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'11px',color:items.length===0?T.green:critical?T.red:T.text}}>
                  <span>{label}</span>
                  <span style={{fontFamily:T.mono,fontWeight:800,fontSize:'13px'}}>{items.length===0?'✓':items.length}</span>
                </summary>
                {items.length>0&&<div style={{marginTop:'8px',maxHeight:'140px',overflow:'auto'}}>
                  {items.map(f=>(
                    <div key={f.id} onClick={()=>setFilmDetail(f)} style={{fontSize:'10px',color:T.textSub,padding:'3px 0',cursor:'pointer',fontFamily:T.mono}}>· {f.title}</div>
                  ))}
                </div>}
              </details>
            )
            return(
              <div style={{...S.card,marginBottom:'12px',border:`1px solid ${priceLeaks.length>0?T.red+'55':pendingResults.length>0?T.orange+'44':T.green+'33'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:700,color:T.text}}>🩺 Data Health</div>
                    <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>Phase {ph} coverage · tap any stat to see the films</div>
                  </div>
                  {pendingResults.length>0&&<Btn onClick={()=>setPage('warroom')} color={T.orange} textColor="#0D0A08" size="sm">Fix in War Room</Btn>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'8px'}}>
                  <Stat label="⏳ Results overdue" items={pendingResults} color={T.orange} critical={pendingResults.length>0}/>
                  <Stat label="🍅 Missing RT" items={missingRT} color={T.gold}/>
                  <Stat label="📊 Missing estimate" items={missingEst} color={T.gold}/>
                  <Stat label="🎞 Missing trailer" items={missingTrailer} color={T.blue}/>
                  <Stat label="🔒 Unpriced (current)" items={unpriced} color={T.gold}/>
                  <Stat label="🚨 Future price leak" items={priceLeaks} color={T.red} critical={priceLeaks.length>0}/>
                </div>
                {/* Bulk estimate fill — suggests Est for every current-phase film missing one */}
                {missingEst.length>0&&(()=>{
                  const fillable=missingEst.map(f=>({f,sug:estimateOpening(f)})).filter(x=>x.sug)
                  if(fillable.length===0)return(
                    <div style={{marginTop:'10px',fontSize:'10px',color:T.textDim,background:T.surfaceUp,borderRadius:'8px',padding:'8px 10px'}}>
                      📊 {missingEst.length} film{missingEst.length!==1?'s':''} missing an estimate, but no resulted films yet to benchmark against. Estimates can be suggested once a few films have opened.
                    </div>
                  )
                  return(
                    <div style={{marginTop:'10px',display:'flex',gap:'10px',alignItems:'center',background:`${T.blue}10`,borderRadius:'8px',padding:'8px 10px'}}>
                      <div style={{flex:1,fontSize:'10px',color:T.blue,lineHeight:1.5}}>Suggest estimates for {fillable.length} film{fillable.length!==1?'s':''} from comparable resulted titles. You can fine-tune any of them afterwards.</div>
                      <Btn onClick={async()=>{
                        if(!await confirmModal(`Auto-fill estimates for ${fillable.length} film${fillable.length!==1?'s':''}? You can edit them individually afterwards.`))return
                        for(const{f,sug} of fillable)await supabase.from('films').update({est_m:sug.est}).eq('id',f.id)
                        notify(`✓ Filled ${fillable.length} estimate${fillable.length!==1?'s':''}`,T.green);loadData(league?.id)
                      }} color={T.blue} textColor="#fff" size="sm">Fill all</Btn>
                    </div>
                  )
                })()}
                {/* Recalculate IPO prices from current estimates */}
                {(()=>{
                  const calcIPO=calcIPOprice
                  const mismatched=films.filter(f=>f.estM!=null&&calcIPO(f.estM)!==f.basePrice)
                  if(mismatched.length===0)return null
                  return(
                    <div style={{marginTop:'10px',display:'flex',gap:'10px',alignItems:'center',background:`${T.gold}10`,borderRadius:'8px',padding:'8px 10px'}}>
                      <div style={{flex:1,fontSize:'10px',color:T.gold,lineHeight:1.5}}>{mismatched.length} film{mismatched.length!==1?'s':''} have an IPO price that doesn't match their current estimate. Recalculate to sync them.</div>
                      <Btn onClick={async()=>{
                        if(!await confirmModal(`Recalculate IPO prices for ${mismatched.length} film${mismatched.length!==1?'s':''} from their estimates?`))return
                        for(const f of mismatched)await supabase.from('films').update({base_price:calcIPO(f.estM)}).eq('id',f.id)
                        notify(`✓ Recalculated ${mismatched.length} IPO price${mismatched.length!==1?'s':''}`,T.green);loadData(league?.id)
                      }} color={T.gold} size="sm">Recalc IPOs</Btn>
                    </div>
                  )
                })()}
                {/* Source health + manual sync trigger */}
                <div style={{marginTop:'10px',display:'flex',gap:'10px',alignItems:'center',background:T.surfaceUp,borderRadius:'8px',padding:'8px 10px'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'11px',fontWeight:700,color:T.text}}>🔄 Auto-sync · TMDB + OMDb</div>
                    <div style={{fontSize:'10px',color:syncLog?.status==='partial'?T.orange:T.textSub,marginTop:'2px'}}>
                      {syncLog
                        ?`Last run ${new Date(syncLog.run_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · ${syncLog.films_updated}/${syncLog.films_checked} updated${(syncLog.conflicts?.length||0)>0?` · ${syncLog.conflicts.length} title conflict${syncLog.conflicts.length!==1?'s':''}`:''}${(syncLog.errors?.length||0)>0?` · ${syncLog.errors.length} errors`:''}`
                        :'Never run — deploy the sync-metadata Edge Function to enable'}
                    </div>
                  </div>
                  <Btn onClick={async()=>{
                    setSyncBusy(true)
                    try{
                      const res=await fetch(`${SUPABASE_URL}/functions/v1/sync-metadata`,{method:'POST',headers:{Authorization:`Bearer ${SUPABASE_ANON_KEY}`}})
                      const j=await res.json().catch(()=>null)
                      if(!res.ok||!j?.ok)throw new Error(j?.error||`HTTP ${res.status} — is sync-metadata deployed?`)
                      notify(`🔄 Sync done: ${j.updated} of ${j.checked} films updated`,T.green)
                      loadData(league?.id)
                    }catch(e){notify(`Sync failed: ${e.message}`,T.red)}
                    setSyncBusy(false)
                  }} color={T.blue} textColor="#fff" size="sm" disabled={syncBusy}>{syncBusy?'Syncing…':'Sync now'}</Btn>
                </div>
                {priceLeaks.length>0&&(
                  <div style={{marginTop:'10px',display:'flex',gap:'10px',alignItems:'center',background:`${T.red}10`,borderRadius:'8px',padding:'8px 10px'}}>
                    <div style={{flex:1,fontSize:'10px',color:T.red,lineHeight:1.5}}>Future-phase films have visible prices — players could forward-plan. Lock them back to TBC?</div>
                    <Btn onClick={async()=>{
                      if(!await confirmModal(`Set base_price to NULL for ${priceLeaks.length} future-phase film${priceLeaks.length!==1?'s':''}?`,{danger:true}))return
                      for(const f of priceLeaks)await supabase.from('films').update({base_price:null}).eq('id',f.id)
                      notify(`🔒 ${priceLeaks.length} prices locked`,T.green);loadData(league?.id)
                    }} color={T.red} textColor="#fff" size="sm">Lock all</Btn>
                  </div>
                )}
              </div>
            )
          })()}
          {/* ── EDITABLE FILM LIST ──────────────────────────────────────── */}
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px'}}>All films · tap to edit</div>
            <div style={{maxHeight:'520px',overflow:'auto'}}>
              {films.map(f=>(
                <FilmEditorRow key={f.id} film={f} results={results} weeklyG={weeklyG}
                  onSave={async(updates)=>{
                    await supabase.from('films').update(updates).eq('id',f.id)
                    if(updates.actual_m!=null){
                      await dbUpsert('results','film_id',f.id,{actual_m:Number(updates.actual_m)})
                      await resolveChips(f.id,Number(updates.actual_m))
                    }
                    for(const w of [2,3,4,5,6]){if(updates[`week${w}`]!=null)await dbUpsertWeekly(f.id,w,Number(updates[`week${w}`]))}
                    notify(`✓ ${f.title} updated`,T.green);loadData(league?.id)
                  }}
                  onDelete={async()=>{
                    if(!await confirmModal(`Delete "${f.title}"? This also removes results and rosters.`,{danger:true,confirmLabel:"Delete"}))return
                    await supabase.from('rosters').delete().eq('film_id',f.id)
                    await supabase.from('results').delete().eq('film_id',f.id)
                    await supabase.from('weekly_grosses').delete().eq('film_id',f.id)
                    await supabase.from('film_values').delete().eq('film_id',f.id)
                    await supabase.from('films').delete().eq('id',f.id)
                    notify(`🗑 ${f.title} deleted`,T.red);loadData(league?.id)
                  }}
                />
              ))}
            </div>
          </div>
        </>}

        {tab==='bulk'&&<>
          {/* ── ONE-STEP CSV UPLOAD — uploads file, updates everything ──── */}
          <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.gold}33`}}>
            <div style={{fontSize:'15px',fontWeight:700,color:T.gold,marginBottom:'6px'}}>📤 Upload Slate CSV</div>
            <div style={{fontSize:'12px',color:T.textSub,lineHeight:1.6,marginBottom:'12px'}}>
              Upload your CSV file and it will update everything: films, estimates, IPO prices, RT scores, weekly grosses. One step, no copy-pasting.
            </div>
            <div style={{background:T.surfaceUp,borderRadius:'8px',padding:'10px 12px',marginBottom:'14px'}}>
              <div style={{...S.label,marginBottom:'6px'}}>Expected columns</div>
              <div style={{fontSize:'10px',color:T.textSub,fontFamily:T.mono,lineHeight:1.6}}>
                Title, Launch Date, Phase, Distributor, Genre, Production Budget, Est, RT, Star, Trailer, Wk1, Wk2, Wk3, Wk4, Wk5, Wk6
              </div>
              <div style={{fontSize:'10px',color:T.gold,marginTop:'6px',lineHeight:1.5,fontWeight:600}}>
                ⚠️ Wk1–Wk6 must be WEEKEND grosses (Fri–Sun), not full-week totals. Estimates and legs scoring are all weekend-based.
              </div>
              <div style={{fontSize:'10px',color:T.textDim,marginTop:'6px',lineHeight:1.5}}>
                <strong style={{color:T.text}}>Required:</strong> Title + Launch Date (DD/MM/YYYY or YYYY-MM-DD)<br/>
                <strong style={{color:T.text}}>Formats:</strong> CSV (comma or tab separated) · header row auto-detected
              </div>
            </div>
            {bulkBusy?(
              <div style={{textAlign:'center',padding:'20px',color:T.gold}}>
                <div style={{fontSize:'14px',fontWeight:700,marginBottom:'6px'}}>Importing…</div>
                <div style={{fontSize:'11px',color:T.textSub}}>Updating films, prices, and results</div>
              </div>
            ):(
              <label style={{display:'block',background:T.gold,color:'#0D0A08',borderRadius:'12px',padding:'16px',textAlign:'center',cursor:'pointer',fontWeight:700,fontSize:'14px',letterSpacing:'0.5px'}}>
                📁 Choose CSV File & Import
                <input type="file" accept=".csv,.tsv,.txt" onChange={async e=>{
                  const file=e.target.files?.[0];if(!file)return
                  e.target.value=''
                  setBulkBusy(true)
                  try{
                    const text=await file.text()
                    const rawLines=text.split('\n').map(l=>l.replace(/\r$/,'')).filter(l=>l.trim())
                    if(rawLines.length<2)throw new Error('CSV has no data rows')
                    const delim=rawLines[0].includes('\t')?'\t':','
                    const parseRow=(line)=>{
                      if(delim==='\t')return line.split('\t').map(c=>c.trim())
                      const out=[];let cur='',inQ=false
                      for(let i=0;i<line.length;i++){
                        const c=line[i]
                        if(c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++}else inQ=!inQ}
                        else if(c===delim&&!inQ){out.push(cur.trim());cur=''}
                        else cur+=c
                      }
                      out.push(cur.trim())
                      return out
                    }
                    const hdrs=parseRow(rawLines[0]).map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,''))
                    const col=(name)=>hdrs.indexOf(name)
                    const ti=col('title'),di=col('launchdate')===-1?col('date'):col('launchdate')
                    if(ti===-1)throw new Error('No "Title" column found in header')
                    const distI=col('distributor'),genI=col('genre'),estI=col('est'),rtI=col('rt')
                    const starI=col('star'),trailI=col('trailer'),phI=col('phase')
                    const wkIs=[1,2,3,4,5,6].map(w=>[w,col(`wk${w}`)]).filter(([_,i])=>i!==-1)

                    const SEASON_ANCHOR=new Date('2026-05-01')
                    const parseDate=(s)=>{
                      if(!s)return null
                      // DD/MM/YYYY
                      let m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
                      if(m)return new Date(m[3],m[2]-1,m[1])
                      // YYYY-MM-DD
                      m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
                      if(m)return new Date(m[1],m[2]-1,m[3])
                      return null
                    }
                    const dateToWeek=(d)=>Math.max(1,Math.floor((d-SEASON_ANCHOR)/(7*86400000))+1)
                    const dateToPhase=(d)=>{
                      if(d<new Date('2026-06-25'))return 0       // historical archive
                      if(d<=new Date('2026-08-28'))return 1      // Summer
                      if(d<=new Date('2026-11-30'))return 2      // Autumn
                      return 3                                    // Awards & Holiday
                    }
                    const calcIPO=calcIPOprice
                    const GENRE_MAP={action:'Action',horror:'Horror',drama:'Drama',family:'Family','sci-fi':'Sci-Fi',scifi:'Sci-Fi',animation:'Animation',comedy:'Comedy',thriller:'Thriller',adventure:'Adventure',concert:'Concert',documentary:'Drama',biography:'Drama',music:'Comedy',mystery:'Thriller',crime:'Thriller',romance:'Drama',fantasy:'Adventure',history:'Drama',war:'Action'}
                    const slug=(t)=>{const s=t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);return s+'-'+Math.abs([...t].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,0)%9999)}

                    let added=0,updated=0,skipped=0,grossRows=0
                    for(let i=1;i<rawLines.length;i++){
                      const cells=parseRow(rawLines[i])
                      const title=cells[ti]?.trim()
                      if(!title)continue
                      const dateStr=di!==-1?cells[di]?.trim():''
                      const d=parseDate(dateStr)
                      if(!d){skipped++;continue}
                      const wk=dateToWeek(d)
                      const ph=phI!==-1&&cells[phI]?Number(cells[phI]):dateToPhase(d)
                      const est=estI!==-1&&cells[estI]?Number(cells[estI]):null
                      const rt=rtI!==-1&&cells[rtI]?Number(cells[rtI]):null
                      const dist=distI!==-1?cells[distI]||'Independent':'Independent'
                      const genreRaw=genI!==-1?cells[genI]||'Drama':'Drama'
                      const genre=GENRE_MAP[(genreRaw.split(/\s/)[0]||'').toLowerCase()]||'Drama'
                      const star=starI!==-1?cells[starI]||null:null
                      const trailer=trailI!==-1&&(cells[trailI]||'').includes('youtube')?cells[trailI]:null
                      const basePrice=calcIPO(est!=null&&!isNaN(est)?est:null)
                      const fid=slug(title)

                      // Upsert the film
                      const filmData={
                        id:fid,title,dist:dist.trim(),genre,star_actor:star,
                        phase:ph,week:wk,
                        base_price:basePrice,
                        est_m:est!=null&&!isNaN(est)?est:null,
                        rt:rt!=null&&!isNaN(rt)?Math.round(rt):null,
                        trailer,active:true
                      }
                      const existing=films.find(f=>f.title.toLowerCase().trim()===title.toLowerCase().trim())
                      if(existing){
                        // Update existing film — preserve fields not in CSV
                        const patch={}
                        if(filmData.dist)patch.dist=filmData.dist
                        if(filmData.genre)patch.genre=filmData.genre
                        if(filmData.star_actor)patch.star_actor=filmData.star_actor
                        patch.phase=ph;patch.week=wk
                        if(filmData.est_m!=null)patch.est_m=filmData.est_m
                        if(filmData.base_price!=null)patch.base_price=filmData.base_price
                        if(filmData.rt!=null)patch.rt=filmData.rt
                        if(filmData.trailer)patch.trailer=filmData.trailer
                        await supabase.from('films').update(patch).eq('id',existing.id)
                        // Weekly grosses
                        for(const[w,ci] of wkIs){
                          const g=cells[ci]?Number(cells[ci]):null
                          if(g!=null&&!isNaN(g)&&g>0){
                            if(w===1){
                              await supabase.from('results').upsert({film_id:existing.id,actual_m:g},{onConflict:'film_id'})
                              await supabase.from('film_values').upsert({film_id:existing.id,current_value:calcMarketValue({...existing,...patch,basePrice:patch.base_price||existing.basePrice},g,weeklyG[existing.id]||{})},{onConflict:'film_id'})
                            }else{
                              await supabase.from('weekly_grosses').upsert({film_id:existing.id,week_num:w,gross_m:g},{onConflict:'film_id,week_num'})
                            }
                            grossRows++
                          }
                        }
                        updated++
                      }else{
                        // New film
                        await supabase.from('films').upsert(filmData,{onConflict:'id'})
                        for(const[w,ci] of wkIs){
                          const g=cells[ci]?Number(cells[ci]):null
                          if(g!=null&&!isNaN(g)&&g>0){
                            if(w===1){
                              await supabase.from('results').upsert({film_id:fid,actual_m:g},{onConflict:'film_id'})
                            }else{
                              await supabase.from('weekly_grosses').upsert({film_id:fid,week_num:w,gross_m:g},{onConflict:'film_id,week_num'})
                            }
                            grossRows++
                          }
                        }
                        added++
                      }
                    }
                    notify(`✅ Import complete: ${added} added, ${updated} updated, ${grossRows} gross rows, ${skipped} skipped`,T.green)
                    loadData(league?.id)
                  }catch(err){
                    notify(`Import failed: ${err.message}`,T.red)
                  }
                  setBulkBusy(false)
                }} style={{display:'none'}}/>
              </label>
            )}
            <div style={{fontSize:'10px',color:T.textDim,marginTop:'10px',lineHeight:1.5}}>
              This updates existing films by title match and adds any new ones. IPO prices are recalculated from estimates. Weekly grosses (Wk1–Wk6) are written directly.
            </div>
          </div>

          {/* ── EXPORT CURRENT SLATE ─────────────────────────────────────── */}

          {/* ── EXPORT ──────────────────────────────────────────────────── */}
          <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.blue}33`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <div><div style={{fontSize:'14px',fontWeight:700,color:T.blue}}>📥 Export Current Slate</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>Pulls everything from DB · active + inactive · all grosses</div></div>
              <div style={{display:'flex',gap:'6px'}}>
                <Btn onClick={async()=>{
                  // Pull ALL films directly from DB (active + inactive) and ALL grosses, paginated to be safe
                  setBulkBusy(true)
                  const allFilms=[]
                  let from=0,batchSize=1000
                  while(true){
                    const{data,error}=await supabase.from('films').select('*').order('phase').order('week').range(from,from+batchSize-1)
                    if(error){notify(`Export failed: ${error.message}`,T.red);setBulkBusy(false);return}
                    if(!data||data.length===0)break
                    allFilms.push(...data)
                    if(data.length<batchSize)break
                    from+=batchSize
                  }
                  const{data:allWg}=await supabase.from('weekly_grosses').select('*')
                  const{data:allRes}=await supabase.from('results').select('*')
                  setBulkBusy(false)
                  const wgMap={};(allWg||[]).forEach(w=>{if(!wgMap[w.film_id])wgMap[w.film_id]={};wgMap[w.film_id][w.week_num]=w.gross_m})
                  const resMap={};(allRes||[]).forEach(r=>{resMap[r.film_id]=r.actual_m})
                  const allWkNums=[...new Set((allWg||[]).map(w=>w.week_num))]
                  const maxWk=Math.max(1,...allWkNums,1)
                  const wkCount=Math.min(Math.max(maxWk,6),10)
                  const wkHdr=Array.from({length:wkCount},(_,i)=>`Wk${i+1}`).join(',')
                  const header=`Title,Launch Date,Phase,Distributor,Genre,Base,Est,RT,Star,Trailer,${wkHdr}`
                  const seasonAnchor=new Date('2026-01-05')
                  const rows=allFilms.map(f=>{
                    const launchDate=new Date(seasonAnchor.getTime()+(f.week-1)*7*86400000).toISOString().split('T')[0]
                    const wks=Array.from({length:wkCount},(_,i)=>{
                      const wk=i+1
                      if(wk===1)return resMap[f.id]??''
                      return wgMap[f.id]?.[wk]??''
                    })
                    return[
                      f.title,launchDate,f.phase,f.dist,f.genre,f.base_price,f.est_m,
                      f.rt??'',f.star_actor??'',f.trailer??'',
                      ...wks,
                    ].map(v=>{const s=String(v);return s.includes(',')||s.includes('"')||s.includes('\n')?`"${s.replace(/"/g,'""')}"`:s}).join(',')
                  })
                  const csv=[header,...rows].join('\n')
                  navigator.clipboard.writeText(csv)
                  notify(`📋 ${rows.length} films · ${wkCount} weeks copied`,T.blue)
                }} color={T.blue} textColor="#fff" size="sm" disabled={bulkBusy}>{bulkBusy?'…':'Copy CSV'}</Btn>
                <Btn onClick={async()=>{
                  setBulkBusy(true)
                  const allFilms=[]
                  let from=0,batchSize=1000
                  while(true){
                    const{data,error}=await supabase.from('films').select('*').order('phase').order('week').range(from,from+batchSize-1)
                    if(error){notify(`Export failed: ${error.message}`,T.red);setBulkBusy(false);return}
                    if(!data||data.length===0)break
                    allFilms.push(...data)
                    if(data.length<batchSize)break
                    from+=batchSize
                  }
                  const{data:allWg}=await supabase.from('weekly_grosses').select('*')
                  const{data:allRes}=await supabase.from('results').select('*')
                  setBulkBusy(false)
                  const wgMap={};(allWg||[]).forEach(w=>{if(!wgMap[w.film_id])wgMap[w.film_id]={};wgMap[w.film_id][w.week_num]=w.gross_m})
                  const resMap={};(allRes||[]).forEach(r=>{resMap[r.film_id]=r.actual_m})
                  const allWkNums=[...new Set((allWg||[]).map(w=>w.week_num))]
                  const maxWk=Math.max(1,...allWkNums,1)
                  const wkCount=Math.min(Math.max(maxWk,6),10)
                  const wkHdr=Array.from({length:wkCount},(_,i)=>`Wk${i+1}`).join(',')
                  const header=`Title,Launch Date,Phase,Distributor,Genre,Base,Est,RT,Star,Trailer,${wkHdr}`
                  const seasonAnchor=new Date('2026-01-05')
                  const rows=allFilms.map(f=>{
                    const launchDate=new Date(seasonAnchor.getTime()+(f.week-1)*7*86400000).toISOString().split('T')[0]
                    const wks=Array.from({length:wkCount},(_,i)=>{const wk=i+1;return wk===1?(resMap[f.id]??''):(wgMap[f.id]?.[wk]??'')})
                    return[f.title,launchDate,f.phase,f.dist,f.genre,f.base_price,f.est_m,f.rt??'',f.star_actor??'',f.trailer??'',...wks].map(v=>{const s=String(v);return s.includes(',')||s.includes('"')||s.includes('\n')?`"${s.replace(/"/g,'""')}"`:s}).join(',')
                  })
                  const csv=[header,...rows].join('\n')
                  const blob=new Blob([csv],{type:'text/csv'})
                  const url=URL.createObjectURL(blob)
                  const a=document.createElement('a')
                  a.href=url
                  a.download=`boxd-slate-${new Date().toISOString().split('T')[0]}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                  notify(`💾 ${rows.length} films downloaded`,T.blue)
                }} variant="outline" color={T.blue} size="sm" disabled={bulkBusy}>{bulkBusy?'…':'Download'}</Btn>
              </div>
            </div>
            <details style={{marginTop:'8px'}}>
              <summary style={{cursor:'pointer',fontSize:'11px',color:T.textSub}}>Preview as table ({films.length} films in current view)</summary>
              <div style={{maxHeight:'420px',overflow:'auto',marginTop:'8px'}}>
                {films.slice(0,200).map(f=>(
                  <FilmEditorRow key={f.id} film={f} results={results} weeklyG={weeklyG}
                    onSave={async(updates)=>{
                      await supabase.from('films').update(updates).eq('id',f.id)
                      if(updates.actual_m!=null){
                        await dbUpsert('results','film_id',f.id,{actual_m:Number(updates.actual_m)})
                        await resolveChips(f.id,Number(updates.actual_m))
                      }
                      for(const w of [2,3,4,5,6]){if(updates[`week${w}`]!=null)await dbUpsertWeekly(f.id,w,Number(updates[`week${w}`]))}
                      notify(`✓ ${f.title} updated`,T.green);loadData(league?.id)
                    }}
                    onDelete={async()=>{
                      if(!await confirmModal(`Delete "${f.title}"? This also removes results and rosters.`,{danger:true,confirmLabel:"Delete"}))return
                      await supabase.from('rosters').delete().eq('film_id',f.id)
                      await supabase.from('results').delete().eq('film_id',f.id)
                      await supabase.from('weekly_grosses').delete().eq('film_id',f.id)
                      await supabase.from('film_values').delete().eq('film_id',f.id)
                      await supabase.from('films').delete().eq('id',f.id)
                      notify(`🗑 ${f.title} deleted`,T.red);loadData(league?.id)
                    }}
                  />
                ))}
                {films.length>200&&<div style={{fontSize:'10px',color:T.textDim,padding:'8px',textAlign:'center'}}>showing first 200 of {films.length}</div>}
              </div>
            </details>
          </div>

        </>}

        

        {tab==='advanced'&&<>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.red}}>League Settings</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'10px'}}>Invite code: <strong style={{color:T.gold}}>{league?.invite_code}</strong></div>
            <div style={{fontSize:'11px',color:T.textDim,marginBottom:'12px'}}>Share: boxd-league-v2.vercel.app/join/{league?.invite_code}</div>
            <Btn onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/join/${league?.invite_code}`);notify('Invite link copied',T.green)}} variant="outline" color={T.green} size="sm">Copy Invite Link</Btn>
            <div style={{marginTop:'14px',paddingTop:'14px',borderTop:`1px solid ${T.border}`}}>
              <div onClick={async()=>{
                const makePublic=!league?.is_public
                await supabase.from('leagues').update({is_public:makePublic}).eq('id',league.id)
                setLeague({...league,is_public:makePublic})
                notify(makePublic?'🌍 League is now public — anyone can discover and join':'🔒 League is now private',T.green)
              }} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',background:T.surfaceUp,borderRadius:'10px',padding:'12px',border:`1px solid ${league?.is_public?T.green+'44':T.border}`}}>
                <span style={{fontSize:'18px'}}>{league?.is_public?'🌍':'🔒'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:T.text}}>{league?.is_public?'Public league':'Private league'}</div>
                  <div style={{fontSize:'10px',color:T.textSub,marginTop:'1px'}}>{league?.is_public?'Listed in Discover — anyone can join':'Invite-only · tap to make public'}</div>
                </div>
                <span style={{fontSize:'11px',color:league?.is_public?T.green:T.gold,fontWeight:700}}>{league?.is_public?'✓ PUBLIC':'Make public'}</span>
              </div>
            </div>
          </div>
          {/* ── DISTRIBUTOR ACCESS CODES ──────────────────────────────────── */}
          <DistributorAccessManager/>
          {isAdmin&&<ModerationPanel/>}
        </>}
      </div>
    )
  }


  // ── WAR ROOM PAGE — batch results entry + manual film amend ─────────────
  const WarRoomPage=()=>{
    const entries=warEntries,setEntries=setWarEntries
    const filterPhase=warFilterPhase,setFilterPhase=setWarFilterPhase
    const filterStatus=warFilterStatus,setFilterStatus=setWarFilterStatus
    const search=warSearch,setSearch=setWarSearch

    // "pending" = week has passed but no result yet (old logic)
    // "all" = every film in the DB
    const pendingFilms=films.filter(f=>f.week<=cfg.current_week&&results[f.id]==null)
    const allFilms=films.filter(f=>{
      const matchPhase=filterPhase==='all'||f.phase===Number(filterPhase)
      const matchStatus=filterStatus==='pending'?(f.week<=cfg.current_week&&results[f.id]==null):true
      const matchSearch=!search.trim()||f.title.toLowerCase().includes(search.toLowerCase())
      return matchPhase&&matchStatus&&matchSearch
    })

    const saveAll=async()=>{
      const toSave=Object.entries(entries).filter(([_,v])=>v.actual&&!isNaN(Number(v.actual)))
      if(toSave.length===0)return notify('Nothing to save',T.red)
      for(const[filmId,v] of toSave){
        await dbUpsert('results','film_id',filmId,{actual_m:Number(v.actual)})
        const film=films.find(f=>f.id===filmId)
        if(film){await dbUpsert('film_values','film_id',filmId,{current_value:calcMarketValue(film,Number(v.actual),weeklyG[filmId]||{})});resolveChips(filmId,Number(v.actual))}
        for(const w of [2,3,4,5,6]){const wv=v[`week${w}`];if(wv&&!isNaN(Number(wv)))await dbUpsertWeekly(filmId,w,Number(wv))}
        // Also save any film field edits
        const filmEdits={}
        if(v.est_m!==undefined&&v.est_m!==''&&!isNaN(Number(v.est_m)))filmEdits.est_m=Number(v.est_m)
        if(v.rt!==undefined&&v.rt!==''&&!isNaN(Number(v.rt)))filmEdits.rt=Number(v.rt)
        if(v.base_price!==undefined&&v.base_price!=='')filmEdits.base_price=Number(v.base_price)||null
        if(Object.keys(filmEdits).length)await supabase.from('films').update(filmEdits).eq('id',filmId)
      }
      notify(`✓ Saved ${toSave.length} result${toSave.length!==1?'s':''}`,T.green)
      setEntries({});loadData(league?.id)
    }

    const setEntry=(filmId,key,val)=>setEntries(prev=>({...prev,[filmId]:{...prev[filmId],[key]:val}}))

    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>⚡ War Room</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Enter results + manually amend any film in the slate</div>

        {/* Controls */}
        <div style={{display:'flex',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...S.inp,flex:'none',fontSize:'11px',padding:'6px 10px'}}>
            <option value="pending">⏳ Pending results only</option>
            <option value="all">📋 All films</option>
          </select>
          <select value={filterPhase} onChange={e=>setFilterPhase(e.target.value)} style={{...S.inp,flex:'none',fontSize:'11px',padding:'6px 10px'}}>
            <option value="all">All phases</option>
            {ALL_PHASES.map(p=><option key={p} value={p}>Phase {p} — {PHASE_NAMES[p]}</option>)}
          </select>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search film…" style={{...S.inp,flex:1,fontSize:'11px',padding:'6px 10px',minWidth:'120px'}}/>
        </div>

        {allFilms.length===0
          ?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>
            {filterStatus==='pending'?'All caught up — no films awaiting results.':'No films match your filters.'}
            <div style={{fontSize:'11px',color:T.textDim,marginTop:'8px'}}>Switch to "All films" to browse the full slate.</div>
          </div>
          :<>
            {allFilms.map(f=>{
              const actual=results[f.id]
              const e=entries[f.id]||{}
              const hasEdits=Object.values(e).some(v=>v!=='')
              return(
                <div key={f.id} style={{...S.card,marginBottom:'8px',border:`1px solid ${actual!=null?T.green+'33':hasEdits?T.gold+'44':T.border}`}}>
                  {/* Film header */}
                  <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
                    <FilmPoster film={f} width={42} height={63} radius={6}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'13px',fontWeight:600,color:T.text}}>{f.title}</div>
                      <div style={{fontSize:'10px',color:T.textSub,marginTop:'2px'}}>{f.dist} · {dateLabel(f.week)} · P{f.phase}</div>
                      <div style={{display:'flex',gap:'8px',marginTop:'4px',flexWrap:'wrap'}}>
                        {f.estM&&<span style={{fontSize:'10px',color:T.textSub}}>Est ${f.estM}M</span>}
                        {f.basePrice!=null&&<span style={{fontSize:'10px',color:T.gold}}>IPO ${f.basePrice}M</span>}
                        {f.rt!=null&&<span style={{fontSize:'10px',color:f.rt>=75?T.green:T.red}}>RT {f.rt}%</span>}
                        {actual!=null&&<span style={{fontSize:'10px',color:T.green,fontWeight:700}}>✓ Actual ${actual}M</span>}
                      </div>
                    </div>
                  </div>

                  {/* Results row */}
                  <div style={{...S.label,marginBottom:'6px',color:T.green}}>Results</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginBottom:'10px'}}>
                    <input value={e.actual??actual??''} onChange={ev=>setEntry(f.id,'actual',ev.target.value)}
                      placeholder={actual!=null?`Was $${actual}M`:"Opening W/E $M"} style={{...S.inp,fontSize:'11px',padding:'5px 8px',color:actual!=null?T.green:T.text}}/>
                    {[2,3].map(w=>(
                      <input key={w} value={e[`week${w}`]??weeklyG[f.id]?.[w]??''} onChange={ev=>setEntry(f.id,`week${w}`,ev.target.value)}
                        placeholder={weeklyG[f.id]?.[w]?`Was $${weeklyG[f.id][w]}M`:`Wk ${w} weekend $M`} style={{...S.inp,fontSize:'11px',padding:'5px 8px'}}/>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginBottom:'10px'}}>
                    {[4,5,6].map(w=>(
                      <input key={w} value={e[`week${w}`]??weeklyG[f.id]?.[w]??''} onChange={ev=>setEntry(f.id,`week${w}`,ev.target.value)}
                        placeholder={weeklyG[f.id]?.[w]?`Was $${weeklyG[f.id][w]}M`:`Wk ${w} weekend $M`} style={{...S.inp,fontSize:'11px',padding:'5px 8px'}}/>
                    ))}
                  </div>

                  {/* Film details row */}
                  <div style={{...S.label,marginBottom:'6px',color:T.gold}}>Film Details</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
                    <input value={e.est_m??''} onChange={ev=>setEntry(f.id,'est_m',ev.target.value)}
                      placeholder={f.estM?`Est: $${f.estM}M`:"Est $M"} style={{...S.inp,fontSize:'11px',padding:'5px 8px'}}/>
                    <input value={e.rt??''} onChange={ev=>setEntry(f.id,'rt',ev.target.value)}
                      placeholder={f.rt!=null?`RT: ${f.rt}%`:"RT score"} style={{...S.inp,fontSize:'11px',padding:'5px 8px'}}/>
                    <input value={e.base_price??''} onChange={ev=>setEntry(f.id,'base_price',ev.target.value)}
                      placeholder={f.basePrice!=null?`IPO: $${f.basePrice}M`:"IPO price"} style={{...S.inp,fontSize:'11px',padding:'5px 8px'}}/>
                  </div>
                </div>
              )
            })}
            <Btn onClick={saveAll} color={T.green} textColor="#0D0A08" full size="lg" sx={{marginTop:'12px',marginBottom:'60px'}}>
              Save All Changes ({Object.keys(entries).filter(id=>Object.values(entries[id]).some(v=>v!=='')).length} films edited)
            </Btn>
          </>
        }
      </div>
    )
  }

  // ── INTELLIGENCE PAGE ────────────────────────────────────────────────────
  const IntelligencePage=()=>(
    <div style={{animation:'fadeUp .2s ease'}}>
      <div style={S.pageTitle}>📡 Market Intelligence</div>
      <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Cross-league signals · ownership concentration</div>
      {films.filter(f=>results[f.id]==null).map(f=>{
        const owners=rosters.filter(r=>r.film_id===f.id&&r.active)
        const buzz=calcBuzzIndex({...f,hasResult:false},allPicks,news,rosters,players.length,cfg.current_week)
        const pickCount=allPicks.filter(p=>p.film_id===f.id).length
        if(owners.length===0&&pickCount<2)return null
        return(
          <div key={f.id} className="hoverable" onClick={()=>setFilmDetail(f)} style={{...S.card,marginBottom:'8px',cursor:'pointer',display:'flex',gap:'12px',alignItems:'center'}}>
            <FilmPoster film={f} width={42} height={63} radius={6}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'13px',fontWeight:600}}>{f.title}</div>
              <div style={{display:'flex',gap:'10px',marginTop:'4px',fontSize:'11px',color:T.textSub}}>
                <span>{owners.length} owners</span><span>·</span><span>{pickCount} watching</span>
              </div>
            </div>
            {buzz!=null&&<div style={{textAlign:'right'}}>
              <div style={{fontSize:'16px',fontWeight:800,color:buzz>=70?T.red:buzz>=50?T.orange:T.gold,fontFamily:T.mono}}>{buzz}</div>
              <div style={S.label}>buzz</div>
            </div>}
          </div>
        )
      })}
    </div>
  )

  // ── MATCH REPORT PAGE ────────────────────────────────────────────────────
  const MatchReportPage=()=>{
    const lastWeek=cfg.current_week-1
    const scoredFilms=films.filter(f=>f.week===lastWeek&&results[f.id]!=null).map(f=>({f,actual:results[f.id],ratio:results[f.id]/f.estM})).sort((a,b)=>b.ratio-a.ratio)
    if(scoredFilms.length===0)return <div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No results yet for last week.</div>
    const winner=scoredFilms[0]
    const bomb=scoredFilms[scoredFilms.length-1]
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>📰 Match Report · W{lastWeek}</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>This week's box office results</div>
        {winner&&<div style={{...S.card,marginBottom:'10px',background:`linear-gradient(135deg,${T.green}14,${T.surface})`,border:`1px solid ${T.green}44`}}>
          <div style={{...S.label,marginBottom:'10px',color:T.green}}>🏆 Winner of the Week</div>
          <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
            <FilmPoster film={winner.f} width={56} height={84} radius={8}/>
            <div style={{flex:1}}><div style={{fontSize:'16px',fontWeight:700}}>{winner.f.title}</div><div style={{fontSize:'12px',color:T.textSub,marginTop:'2px'}}>${winner.actual}M actual · {winner.ratio.toFixed(2)}× estimate</div></div>
          </div>
        </div>}
        {bomb&&bomb.f.id!==winner?.f.id&&<div style={{...S.card,marginBottom:'10px',background:`linear-gradient(135deg,${T.red}14,${T.surface})`,border:`1px solid ${T.red}44`}}>
          <div style={{...S.label,marginBottom:'10px',color:T.red}}>💀 Underperformer</div>
          <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
            <FilmPoster film={bomb.f} width={56} height={84} radius={8}/>
            <div style={{flex:1}}><div style={{fontSize:'16px',fontWeight:700}}>{bomb.f.title}</div><div style={{fontSize:'12px',color:T.textSub,marginTop:'2px'}}>${bomb.actual}M actual · {bomb.ratio.toFixed(2)}× estimate</div></div>
          </div>
        </div>}
        <div style={{...S.label,marginTop:'18px',marginBottom:'10px'}}>All Results</div>
        {scoredFilms.map(({f,actual,ratio})=>(
          <div key={f.id} onClick={()=>setFilmDetail(f)} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center'}}>
            <FilmPoster film={f} width={36} height={54} radius={5}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:'12px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'10px',color:T.textSub}}>est ${f.estM}M</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:'14px',fontWeight:700,color:T.green,fontFamily:T.mono}}>${actual}M</div><div style={{fontSize:'10px',color:ratio>=1?T.green:T.red,fontFamily:T.mono}}>{ratio.toFixed(2)}×</div></div>
          </div>
        ))}
      </div>
    )
  }

  // ── SLATE MAP PAGE ────────────────────────────────────────────────────────
  const SlatePage=()=>(
    <div style={{animation:'fadeUp .2s ease'}}>
      <div style={S.pageTitle}>🗺 Slate Heatmap</div>
      <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Films by phase and week · color = buzz</div>
      {ALL_PHASES.map(phN=>{
        const phFilms=films.filter(f=>f.phase===phN);if(phFilms.length===0)return null
        return(
          <div key={phN} style={{marginBottom:'18px'}}>
            <div style={{...S.label,marginBottom:'8px',color:phN===ph?T.gold:T.textSub}}>P{phN} · {PHASE_NAMES[phN]}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'6px'}}>
              {phFilms.map(f=>{
                const buzz=calcBuzzIndex({...f,hasResult:results[f.id]!=null},allPicks,news,rosters,players.length,cfg.current_week)||0
                const col=results[f.id]!=null?T.textSub:buzz>=70?T.red:buzz>=50?T.orange:buzz>=30?T.gold:T.textDim
                return(
                  <div key={f.id} onClick={()=>setFilmDetail(f)} style={{background:T.surfaceUp,border:`1px solid ${col}44`,borderRadius:'7px',padding:'8px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',bottom:0,left:0,right:0,height:'3px',background:col,opacity:0.6}}/>
                    <div style={{fontSize:'10px',color:T.textSub,marginBottom:'3px'}}>W{f.week}</div>
                    <div style={{fontSize:'11px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.title}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── SEALED BID PAGE ──────────────────────────────────────────────────────
  const SealedBidPage=()=>{
    const[bidFilm,setBidFilm]=useState('')
    const[bidAmt,setBidAmt]=useState('')
    const submit=async()=>{
      if(!bidFilm||!bidAmt)return notify('Select film + amount',T.red)
      const{error}=await supabase.from('sealed_bids').insert({player_id:profile.id,film_id:bidFilm,bid_amount:Number(bidAmt),league_id:league?.id,phase:ph,status:'pending'})
      if(error)return notify(error.message,T.red)
      notify('🔒 Bid sealed',T.blue);setBidFilm('');setBidAmt('')
    }
    const upcoming=films.filter(f=>f.phase===ph&&results[f.id]==null)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>🔒 Sealed Bid Window</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Blind auction · highest bid wins · {sealedWindowDeadline?`closes ${new Date(sealedWindowDeadline).toLocaleString()}`:''}</div>
        {myPendingBid?<div style={{...S.card,marginBottom:'14px',background:`${T.blue}14`,border:`1px solid ${T.blue}44`}}>
          <div style={{fontSize:'13px',color:T.blue,marginBottom:'4px'}}>🔒 Your bid is in</div>
          <div style={{fontSize:'12px',color:T.textSub}}>{films.find(f=>f.id===myPendingBid.film_id)?.title} · ${myPendingBid.bid_amount}M</div>
        </div>:<div style={{...S.card,marginBottom:'14px'}}>
          <div style={{...S.label,marginBottom:'10px'}}>Submit a sealed bid</div>
          <select value={bidFilm} onChange={e=>setBidFilm(e.target.value)} style={{...S.inp,marginBottom:'10px'}}>
            <option value="">Pick a film…</option>
            {upcoming.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <input type="number" value={bidAmt} onChange={e=>setBidAmt(e.target.value)} placeholder="Bid amount in $M" style={{...S.inp,marginBottom:'10px'}}/>
          <Btn onClick={submit} color={T.blue} textColor="#fff" full>Submit Sealed Bid</Btn>
        </div>}
      </div>
    )
  }

  // ── PROFILE EDIT MODAL ───────────────────────────────────────────────────
  const ProfileEditModal=()=>{
    const[name,setName]=useState(profile?.name||'')
    const[bio,setBio]=useState(profile?.bio||'')
    const[col,setCol]=useState(profile?.color||PLAYER_COLORS[0])
    const[avatarUrl,setAvatarUrl]=useState(profile?.avatar_url||'')
    const[favFilm,setFavFilm]=useState(profile?.favourite_film_id||'')
    const[letterboxd,setLetterboxd]=useState(profile?.letterboxd_url||'')
    const[uploading,setUploading]=useState(false)
    const save=async()=>{
      await supabase.from('profiles').update({name:name.trim(),bio:bio.trim(),color:col,avatar_url:avatarUrl.trim()||null,favourite_film_id:favFilm||null,letterboxd_url:letterboxd.trim()||null}).eq('id',profile.id)
      loadProfile();notify('Profile updated',T.green);setProfileEditOpen(false)
    }
    return(
      <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900,padding:'20px'}} onClick={()=>setProfileEditOpen(false)}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'380px',maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:'18px',fontWeight:700,marginBottom:'16px'}}>Edit profile</div>
          <div style={{...S.label,marginBottom:'6px'}}>Name</div>
          <input value={name} onChange={e=>setName(e.target.value)} style={{...S.inp,marginBottom:'14px'}}/>
          <div style={{...S.label,marginBottom:'6px'}}>Bio</div>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="One-line tagline…" style={{...S.inp,minHeight:'60px',marginBottom:'14px',resize:'vertical',fontFamily:T.mono}}/>
          <div style={{...S.label,marginBottom:'6px'}}>Profile photo</div>
          <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'8px'}}>
            {avatarUrl&&<img src={avatarUrl} alt="" style={{width:'40px',height:'40px',borderRadius:'50%',objectFit:'cover',border:`2px solid ${col}`}} onError={e=>{e.target.style.display='none'}}/>}
            <label style={{...S.btn,background:T.surfaceUp,border:`1px solid ${T.gold}44`,color:T.gold,fontSize:'12px',padding:'9px 14px',cursor:uploading?'wait':'pointer',textTransform:'none',letterSpacing:0,borderRadius:'9px',flex:1,textAlign:'center'}}>
              {uploading?'Uploading…':'📷 Upload from device'}
              <input type="file" accept="image/*" disabled={uploading} onChange={async e=>{
                const file=e.target.files?.[0];if(!file)return
                if(file.size>4*1024*1024)return notify('Image too large — max 4MB',T.red)
                setUploading(true)
                const ext=(file.name.split('.').pop()||'jpg').toLowerCase()
                const path=`${profile.id}.${ext}`
                const{error}=await supabase.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type})
                setUploading(false)
                if(error)return notify(`Upload failed: ${error.message}`,T.red)
                const{data}=supabase.storage.from('avatars').getPublicUrl(path)
                setAvatarUrl(`${data.publicUrl}?v=${Date.now()}`)
                notify('Photo uploaded — hit Save',T.green)
              }} style={{display:'none'}}/>
            </label>
          </div>
          <input value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="…or paste an image URL" style={{...S.inp,marginBottom:'14px',fontSize:'11px'}}/>
          <div style={{...S.label,marginBottom:'6px'}}>Most excited for</div>
          <select value={favFilm} onChange={e=>setFavFilm(e.target.value)} style={{...S.inp,marginBottom:'14px'}}>
            <option value="">None selected</option>
            {films.filter(f=>results[f.id]==null).sort((a,b)=>a.week-b.week).map(f=><option key={f.id} value={f.id}>{f.title} ({dateLabel(f.week)})</option>)}
          </select>
          <div style={{...S.label,marginBottom:'6px'}}>Letterboxd profile</div>
          <input value={letterboxd} onChange={e=>setLetterboxd(e.target.value)} placeholder="https://letterboxd.com/you" style={{...S.inp,marginBottom:'14px'}}/>
          <div style={{...S.label,marginBottom:'10px'}}>Colour</div>
          <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
            {PLAYER_COLORS.map(c=><div key={c} onClick={()=>setCol(c)} style={{width:'30px',height:'30px',borderRadius:'50%',background:c,cursor:'pointer',border:`3px solid ${col===c?'#fff':'transparent'}`,boxSizing:'border-box'}}/>)}
          </div>
          <div style={{...S.label,marginBottom:'10px'}}>Notifications</div>
          <div onClick={notifPerm==='granted'?undefined:requestNotifs} style={{display:'flex',alignItems:'center',gap:'10px',background:T.surfaceUp,borderRadius:'10px',padding:'12px',marginBottom:'20px',cursor:notifPerm==='granted'?'default':'pointer',border:`1px solid ${notifPerm==='granted'?T.green+'44':T.border}`}}>
            <span style={{fontSize:'18px'}}>{notifPerm==='granted'?'🔔':'🔕'}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:'12px',fontWeight:700,color:T.text}}>Results-day alerts</div>
              <div style={{fontSize:'10px',color:T.textSub,marginTop:'1px'}}>
                {notifPerm==='granted'?'On — you\'ll be notified when films score':notifPerm==='denied'?'Blocked — enable in browser settings':'Tap to get notified when your films score'}
              </div>
            </div>
            {notifPerm==='granted'&&<span style={{fontSize:'11px',color:T.green,fontWeight:700}}>✓ ON</span>}
            {notifPerm!=='granted'&&notifPerm!=='denied'&&<span style={{fontSize:'11px',color:T.gold,fontWeight:700}}>Enable</span>}
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <Btn onClick={()=>setProfileEditOpen(false)} variant="outline" color={T.textSub} sx={{flex:1}}>Cancel</Btn>
            <Btn onClick={save} color={T.gold} sx={{flex:2}}>Save</Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── NEW SIGNAL MODAL (commissioner) ──────────────────────────────────────
  const NewSignalModal=()=>{
    const[selFilm,setSelFilm]=useState('')
    const[head,setHead]=useState('')
    const[det,setDet]=useState('')
    const[type,setType]=useState('rt_score')
    const[sent,setSent]=useState('positive')
    const submit=async()=>{
      if(!head.trim())return notify('Need a headline',T.red)
      await supabase.from('news_signals').insert({league_id:league?.id,film_id:selFilm||null,signal_type:type,headline:head.trim(),detail:det.trim()||null,sentiment:sent,price_impact:null,created_by:profile.id})
      notify('📡 Signal published',T.red);loadNews(league?.id);setNewSignalOpen(false)
    }
    return(
      <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900,padding:'20px'}} onClick={()=>setNewSignalOpen(false)}>
        <div style={{background:T.surface,border:`1px solid ${T.red}44`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'420px',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:'18px',fontWeight:700,marginBottom:'4px',color:T.red}}>📡 New Signal</div>
          <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Publish news for context — no price impact</div>
          <select value={selFilm} onChange={e=>setSelFilm(e.target.value)} style={{...S.inp,marginBottom:'10px'}}>
            <option value="">Attached to which film? (optional)</option>
            {films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select value={type} onChange={e=>setType(e.target.value)} style={{...S.inp,marginBottom:'10px'}}>
            <option value="rt_score">RT Score</option><option value="trailer">Trailer</option><option value="festival">Festival</option><option value="box_office">Box Office</option><option value="controversy">Controversy</option><option value="casting">Casting</option>
          </select>
          <input value={head} onChange={e=>setHead(e.target.value)} placeholder="Headline" style={{...S.inp,marginBottom:'10px'}}/>
          <textarea value={det} onChange={e=>setDet(e.target.value)} placeholder="Detail (optional)" style={{...S.inp,minHeight:'60px',marginBottom:'10px',resize:'vertical',fontFamily:T.mono}}/>
          <select value={sent} onChange={e=>setSent(e.target.value)} style={{...S.inp,marginBottom:'14px'}}>
            <option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option>
          </select>
          <div style={{display:'flex',gap:'10px'}}>
            <Btn onClick={()=>setNewSignalOpen(false)} variant="outline" color={T.textSub} sx={{flex:1}}>Cancel</Btn>
            <Btn onClick={submit} color={T.red} textColor="#fff" sx={{flex:2}}>Publish</Btn>
          </div>
        </div>
      </div>
    )
  }


  // ── PAGE RENDERER ─────────────────────────────────────────────────────────
  const ActivityRail=()=>{
    const railItems=feedItems.slice(0,30)
    const fmt=(item)=>{
      const pay=item.payload||{}
      let label='',col=T.textSub,icon='•'
      if(item.type==='buy'){label=`bought ${pay.film_title}`;col=T.gold;icon='🟢'}
      else if(item.type==='sell'){label=`dropped ${pay.film_title}`;col=T.red;icon='🔴'}
      else if(item.type==='trade_proposed'){label=`proposed a trade`;col=T.blue;icon='🔄'}
      else if(item.type==='trade_accepted'){label=`traded ${pay.film_given} → ${pay.film_received}`;col=T.green;icon='🤝'}
      else if(item.type==='chip_recut'){label='used THE RECUT';col=T.purple;icon='🎬'}
      else if(item.type==='chip_short'){label=`shorted ${pay.film_title}`;col=T.red;icon='📉'}
      else if(item.type==='chip_analyst'){label=`Analyst: ${pay.film_title}`;col=T.blue;icon='🎯'}
      else if(item.type==='oscar'){label=`Oscar pick: ${pay.film_title}`;col=T.gold;icon='🏆'}
      else if(item.type==='forecast'){label=`forecast ${pay.film_title}`;col=T.blue;icon='📊'}
      else if(item.type==='screening'){label=`hosting ${pay.film_title||'a screening'}`;col=T.orange;icon='🎟️'}
      else if(item.type==='phase_advance'){label=`Phase ${pay.to_phase} opened`;col=T.gold;icon='⚡'}
      else{label=item.type.replace(/_/g,' ');icon='•'}
      return{label,col,icon}
    }
    return(
      <div style={{width:'340px',flexShrink:0,position:'sticky',top:'76px',height:'fit-content',maxHeight:'calc(100vh - 100px)',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
          <span style={{width:'7px',height:'7px',borderRadius:'50%',background:T.green,boxShadow:`0 0 8px ${T.green}`,animation:'pulse 2s infinite'}}/>
          <div style={{...S.label,color:T.textSub}}>Live Activity</div>
        </div>
        <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:'2px',paddingRight:'4px',scrollbarWidth:'thin',scrollbarColor:`${T.border} transparent`}}>
          {railItems.length===0?(
            <div style={{...S.card,textAlign:'center',padding:'24px 16px',color:T.textDim,fontSize:'12px'}}>No activity yet. Buys, sells and trades will appear here live.</div>
          ):railItems.map(item=>{
            const p=players.find(pl=>pl.id===item.user_id)
            const{label,col,icon}=fmt(item)
            return(
              <div key={item.id} style={{display:'flex',gap:'9px',alignItems:'flex-start',padding:'9px 10px',borderRadius:'9px',background:T.surface,border:`1px solid ${T.border}`,marginBottom:'4px'}}>
                <span style={{fontSize:'13px',flexShrink:0,marginTop:'1px'}}>{icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'12px',lineHeight:1.4}}>
                    <span onClick={()=>p&&goToProfile(p)} style={{color:p?.color||T.gold,fontWeight:700,cursor:'pointer'}}>{p?.name||'Someone'}</span>
                    <span style={{color:col,marginLeft:'4px'}}>{label}</span>
                  </div>
                  <div style={{fontSize:'9px',color:T.textDim,marginTop:'2px'}}>{timeAgo(item.created_at)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  const renderPage=()=>{
    switch(page){
      case 'market':return <MarketPage/>
      case 'roster':return <RosterPage/>
      case 'chips':return <ChipsPage/>
      case 'league':return <LeaguePage/>
      case 'community':return <CommunityPage/>
      case 'feed':return <FeedPage/>
      case 'signals':return <SignalsPage/>
      case 'motw':return <MovieOfWeekPage/>
      case 'polls':return <PollsPage/>
      case 'intent':return <IntentPage/>
      case 'reviews':return <ReviewsPage/>
      case 'forecaster':return <ForecasterPage/>
      case 'oscar':return <OscarPage/>
      case 'results':return <ResultsPage/>
      case 'howto':return <HowToPlayPage/>
      case 'legal':return <LegalPage/>
      case 'archive':return <ArchivePage/>
      case 'slate':return <SlatePage/>
      case 'report':return <MatchReportPage/>
      case 'intelligence':return <IntelligencePage/>
      case 'warroom':return isCommissioner?<WarRoomPage/>:<AccessDenied onBack={()=>setPage('market')}/>
      case 'commissioner':return isCommissioner?<CommissionerPage/>:<AccessDenied onBack={()=>setPage('market')}/>
      case 'distributor':return isCommissioner?<DistributorPage/>:<AccessDenied onBack={()=>setPage('market')}/>
      case 'profile':return profilePlayer?<PlayerProfilePage player={profilePlayer} badges={calcBadges(profilePlayer.id)} reviews={reviews} onOpenFilm={f=>setFilmDetail(f)} films={films} rosters={rosters} results={results} weeklyG={weeklyG} allChips={allChips} oscarPreds={oscarPreds} allPicks={allPicks} calcPoints={calcPoints} calcPhasePoints={calcPhasePoints} budgetLeft={budgetLeft} cur={cur} isEarlyBird={isEarlyBird} analystActive={analystOn} curPhase_ref={curPhase()} onBack={()=>setPage(prevPage)}/>:null
      default:return <MarketPage/>
    }
  }

  const navigate=(p)=>{setPage(p);setMoreOpen(false)}
  const draftBannerVisible=draftWindowOpen&&draftShortfall>0

  // Fresh-results banner state (hooks declared at top of App)
  const dismissKey=`boxd_results_seen_w${cfg.current_week-1}`
  const resultsDismissed=resultsDismissedWk===cfg.current_week-1
  const setResultsDismissed=(v)=>{if(v){localStorage.setItem(dismissKey,'1');setResultsDismissedWk(cfg.current_week-1)}}
  const justScored=films.filter(f=>f.week===cfg.current_week-1&&results[f.id]!=null)
  const myJustScored=justScored.filter(f=>myRoster.find(r=>r.film_id===f.id)||rosters.find(r=>r.player_id===profile.id&&r.film_id===f.id))
  const myJustScoredPts=myJustScored.reduce((s,f)=>{
    const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===f.id);if(!h)return s
    const op=calcOpeningPts(f,results[f.id],isEarlyBird(h),analystOn(profile.id,f.id))
    return s+op
  },0)
  const resultsBannerVisible=!resultsDismissed&&justScored.length>0&&page!=='report'

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:T.mono,display:'flex'}}>
      <div className={`ambient-bg ambient-p${ph}`}/>
      {confettiActive&&<ConfettiBurst active={true}/>}

      {/* DESKTOP SIDEBAR */}
      {!isMobile&&sidebarOpen&&(
        <div style={{width:'240px',background:T.surface,borderRight:`1px solid ${T.border}`,padding:'20px 0',position:'sticky',top:0,height:'100vh',overflowY:'auto',flexShrink:0,zIndex:10}}>
          <div style={{padding:'0 20px 20px',borderBottom:`1px solid ${T.border}`,marginBottom:'14px'}}>
            <div style={{fontSize:'24px',fontWeight:900,color:T.gold,letterSpacing:'-1px',lineHeight:1}}>BOXD</div>
            <div style={{fontSize:'10px',color:T.textDim,letterSpacing:'2px',marginTop:'4px'}}>{league?.name}</div>
          </div>
          <div style={{padding:'0 12px'}}>
            {[
              {id:'market',icon:'🎬',label:'Market'},
              {id:'roster',icon:'📁',label:'Roster'},
              {id:'chips',icon:'⚡',label:'Chips'},
              {id:'league',icon:'🥇',label:'League'},
              {id:'community',icon:'👥',label:'Community'},
              ...(hasNews?[{id:'signals',icon:'⚡',label:'Signals'}]:[]),
              ...(movieOfWeek?[{id:'motw',icon:'🎬',label:'Movie of Week'}]:[]),
              ...(polls.length>0?[{id:'polls',icon:'🗳',label:'Polls'}]:[]),
              {id:'feed',icon:'📡',label:'Feed'},
            ].map(nav=>(
              <button key={nav.id} onClick={()=>navigate(nav.id)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',background:page===nav.id?T.surfaceUp:'transparent',border:'none',borderRadius:'8px',cursor:'pointer',width:'100%',fontFamily:T.mono,fontSize:'13px',color:page===nav.id?T.gold:T.textSub,fontWeight:page===nav.id?700:400,marginBottom:'2px'}}>
                <span style={{fontSize:'16px'}}>{nav.icon}</span><span>{nav.label}</span>
              </button>
            ))}
          </div>
          <div style={{padding:'18px 20px 6px',marginTop:'14px',borderTop:`1px solid ${T.border}`}}>
            <div style={{...S.label,marginBottom:'10px'}}>More</div>
          </div>
          <div style={{padding:'0 12px'}}>
            {[
              {id:'intent',icon:'👁️',label:'Watchlist'},
              {id:'reviews',icon:'⭐',label:'Reviews'},
              {id:'forecaster',icon:'📊',label:'Forecaster'},
              {id:'oscar',icon:'🏆',label:'Oscars'},
              {id:'results',icon:'📋',label:'Results'},
              {id:'archive',icon:'🏛️',label:'Archive'},
              {id:'howto',icon:'❓',label:'How to Play'},
              {id:'legal',icon:'📜',label:'Legal'},
              ...(hasPicks&&films.length>0?[{id:'slate',icon:'🗺',label:'Slate Map'}]:[]),
              ...(hasResults?[{id:'report',icon:'📰',label:'Match Report'}]:[]),
              ...(hasPicks?[{id:'intelligence',icon:'📡',label:'Intelligence'}]:[]),
            ].map(nav=>(
              <button key={nav.id} onClick={()=>navigate(nav.id)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'9px 12px',background:page===nav.id?T.surfaceUp:'transparent',border:'none',borderRadius:'8px',cursor:'pointer',width:'100%',fontFamily:T.mono,fontSize:'12px',color:page===nav.id?T.gold:T.textSub,fontWeight:page===nav.id?700:400,marginBottom:'2px'}}>
                <span style={{fontSize:'14px'}}>{nav.icon}</span><span style={{flex:1,textAlign:'left'}}>{nav.label}</span>
                {nav.badge&&<span style={{background:T.gold,color:'#000',borderRadius:'10px',padding:'1px 6px',fontSize:'10px',fontWeight:800}}>{nav.badge}</span>}
              </button>
            ))}
            {isCommissioner&&<>
              <Divider my={10}/>
              {[{id:'warroom',icon:'⚡',label:'War Room'},{id:'commissioner',icon:'⚙️',label:'Panel'},{id:'distributor',icon:'📈',label:'Insights'}].map(nav=>(
                <button key={nav.id} onClick={()=>navigate(nav.id)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'9px 12px',background:page===nav.id?T.surfaceUp:'transparent',border:'none',borderRadius:'8px',cursor:'pointer',width:'100%',fontFamily:T.mono,fontSize:'12px',color:page===nav.id?T.gold:T.textSub,fontWeight:page===nav.id?700:400,marginBottom:'2px'}}>
                  <span style={{fontSize:'14px'}}>{nav.icon}</span><span>{nav.label}</span>
                </button>
              ))}
            </>}
          </div>
          <div style={{padding:'20px',marginTop:'auto',borderTop:`1px solid ${T.border}`}}>
            <div onClick={()=>setProfileEditOpen(true)} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:profile.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'13px'}}>{profile.name?.[0]||'?'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'12px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{profile.name}</div>
                <div style={{fontSize:'10px',color:T.textDim}}>Edit profile</div>
              </div>
            </div>
            <button onClick={leaveLeague} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontFamily:T.mono,fontSize:'11px',marginTop:'10px'}}>Leave league</button>
          </div>
        </div>
      )}

      <div style={{flex:1,minWidth:0,position:'relative',zIndex:1,paddingBottom:isMobile?'80px':'20px'}}>
        {/* TOP BAR */}
        <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:'14px',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(10px)'}}>
          {isMobile&&<div style={{fontSize:'20px',fontWeight:900,color:T.gold,letterSpacing:'-1px'}}>BOXD</div>}
          <div style={{flex:1,fontSize:'12px',color:T.textSub}}>
            <span style={{color:T.gold,fontWeight:700}}>W{cfg.current_week}</span> · P{ph} {PHASE_NAMES[ph]} {win&&<span style={{color:T.green,marginLeft:'4px'}}>· WINDOW OPEN</span>}
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'10px',color:T.textDim,letterSpacing:'1px'}}>BUDGET</div>
            <div style={{fontSize:'15px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>{cur}{myBudget}M</div>
          </div>
        </div>

        {/* DRAFT BANNER */}
        {draftBannerVisible&&(
          <div style={{background:`${T.orange}18`,borderBottom:`1px solid ${T.orange}44`,padding:'10px 20px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
            <span style={{fontSize:'14px',color:T.orange,fontWeight:600}}>⚠️ Draft window open</span>
            <span style={{fontSize:'13px',color:T.textSub}}>Pick {draftShortfall} more film{draftShortfall!==1?'s':''} or face {cur}{draftPenalty}M penalty</span>
            <Btn onClick={()=>navigate('market')} color={T.orange} textColor="#0D0A08" size="sm">Go to Market →</Btn>
          </div>
        )}

        {/* FRESH RESULTS BANNER */}
        {resultsBannerVisible&&(
          <div style={{background:`linear-gradient(90deg,${T.green}22,${T.gold}18)`,borderBottom:`1px solid ${T.green}55`,padding:'10px 20px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
            <span style={{fontSize:'16px'}}>📰</span>
            <span style={{fontSize:'13px',fontWeight:600,color:T.green}}>W{cfg.current_week-1} Results in</span>
            {myJustScoredPts>0?<span style={{fontSize:'13px',color:T.text}}>You earned <strong style={{color:T.green}}>+{myJustScoredPts}pts</strong> across {myJustScored.length} film{myJustScored.length!==1?'s':''}</span>:<span style={{fontSize:'13px',color:T.textSub}}>{justScored.length} film{justScored.length!==1?'s':''} just scored</span>}
            <Btn onClick={()=>navigate('report')} color={T.green} textColor="#0D0A08" size="sm">Read Match Report →</Btn>
            <button onClick={()=>{localStorage.setItem(dismissKey,'1');setResultsDismissed(true)}} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontSize:'14px',marginLeft:'auto',padding:'4px 8px'}}>✕</button>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div style={{padding:isMobile?'20px':'24px 40px',width:'100%',display:'flex',gap:isMobile?0:'28px',alignItems:'flex-start'}}>
          <div style={{flex:1,minWidth:0}}>
          {!isStandalone&&!installHidden&&(installEvt||isIOS)&&profile&&(
            <div style={{background:`linear-gradient(135deg,${T.gold}14,${T.surface})`,border:`1px solid ${T.gold}44`,borderRadius:'12px',padding:'12px 14px',marginBottom:'14px',display:'flex',gap:'12px',alignItems:'center'}}>
              <span style={{fontSize:'20px'}}>📲</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'13px',fontWeight:700,color:T.gold}}>Get the BOXD app</div>
                <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{installEvt?'One tap — home-screen icon, full screen, no browser.':'Tap Share, then "Add to Home Screen".'}</div>
              </div>
              {installEvt&&<Btn onClick={async()=>{installEvt.prompt();try{await installEvt.userChoice}catch{};setInstallEvt(null)}} color={T.gold} size="sm">Install</Btn>}
              <button onClick={()=>{setInstallHidden(true);try{localStorage.setItem('boxd_install_hidden','1')}catch{}}} aria-label="Dismiss install prompt" style={{background:'none',border:'none',color:T.textDim,fontSize:'16px',cursor:'pointer',padding:'4px 8px'}}>×</button>
            </div>
          )}
          {loadError&&(
            <div style={{background:`${T.red}14`,border:`1px solid ${T.red}55`,borderRadius:'12px',padding:'14px 16px',marginBottom:'14px',display:'flex',gap:'12px',alignItems:'center'}}>
              <span style={{fontSize:'18px'}}>⚠️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:'13px',fontWeight:700,color:T.red}}>Couldn't load league data</div>
                <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{loadError}</div>
              </div>
              <Btn onClick={()=>loadData(league?.id)} color={T.red} textColor="#fff" size="sm">Retry</Btn>
            </div>
          )}
          {dataLoading?<PageSkeleton/>:renderPage()}
          </div>
          {!isMobile&&<ActivityRail/>}
        </div>
      </div>

      {/* MOBILE BOTTOM TABS */}
      {isMobile&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,background:T.surface,borderTop:`1px solid ${T.border}`,display:'flex',padding:'8px 4px',paddingBottom:'calc(8px + env(safe-area-inset-bottom))',zIndex:60}}>
          {BOTTOM_TABS.map(tab=>(
            <button key={tab.id} onClick={()=>navigate(tab.id)} style={{flex:1,background:'transparent',border:'none',padding:'8px 4px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',color:page===tab.id?T.gold:T.textDim,fontFamily:T.mono,fontSize:'10px'}}>
              <span style={{fontSize:'20px'}}>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
          <button onClick={()=>setMoreOpen(true)} style={{flex:1,background:'transparent',border:'none',padding:'8px 4px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',color:T.textDim,fontFamily:T.mono,fontSize:'10px'}}>
            <span style={{fontSize:'20px'}}>···</span><span>More</span>
          </button>
        </div>
      )}

      {/* MOBILE MORE DRAWER */}
      {moreOpen&&isMobile&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',zIndex:200,display:'flex',alignItems:'flex-end'}} onClick={()=>setMoreOpen(false)}>
          <div style={{background:T.surface,width:'100%',maxHeight:'80vh',overflowY:'auto',borderRadius:'20px 20px 0 0',padding:'20px',paddingBottom:'calc(20px + env(safe-area-inset-bottom))',animation:'slideUp .25s ease'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 16px'}}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {ALL_PAGES.filter(p=>!BOTTOM_TABS.find(t=>t.id===p.id)).map(p=>(
                <button key={p.id} onClick={()=>navigate(p.id)} style={{background:T.surfaceUp,border:`1px solid ${page===p.id?T.gold+'66':T.border}`,borderRadius:'10px',padding:'14px 6px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',color:page===p.id?T.gold:T.textSub,fontFamily:T.mono,fontSize:'11px'}}>
                  <span style={{fontSize:'20px'}}>{p.icon}</span><span style={{lineHeight:1.2,textAlign:'center'}}>{p.label}</span>
                </button>
              ))}
            </div>
            <Btn onClick={()=>{setProfileEditOpen(true);setMoreOpen(false)}} variant="outline" color={T.textSub} full sx={{marginTop:'16px'}}>Edit Profile</Btn>
            <button onClick={leaveLeague} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontFamily:T.mono,fontSize:'11px',width:'100%',marginTop:'10px',padding:'8px'}}>Leave league</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {notif&&<div style={{position:'fixed',bottom:isMobile?'90px':'24px',left:'50%',transform:'translateX(-50%)',background:T.surface,border:`1px solid ${notif.color}66`,borderRadius:'12px',padding:'12px 20px',fontSize:'13px',color:notif.color,fontFamily:T.mono,fontWeight:600,zIndex:1000,animation:'fadeUp .2s ease',boxShadow:'0 8px 24px #00000088',maxWidth:'90vw'}}>{notif.msg}</div>}

      {/* MODALS */}
      {/* GLOBAL SEARCH */}
      {!searchOpen&&profile&&(
        <button onClick={()=>setSearchOpen(true)} aria-label="Search films, players and pages"
          style={{position:'fixed',bottom:isMobile?'calc(84px + env(safe-area-inset-bottom))':'24px',right:'16px',zIndex:64,width:'40px',height:'40px',borderRadius:'50%',background:T.surface,border:`1px solid ${T.gold}44`,color:T.gold,fontSize:'16px',cursor:'pointer',boxShadow:'0 4px 16px #00000066',display:'flex',alignItems:'center',justifyContent:'center'}}>🔍</button>
      )}
      {searchOpen&&<GlobalSearchOverlay/>}

      {filmDetail&&<FilmDetailModal film={filmDetail} profile={profile} players={players} results={results} allPicks={allPicks} marketingEvents={marketingEvents} news={news} rosters={rosters} filmValues={filmValues} weeklyG={weeklyG} reviews={reviews} reviewComments={reviewComments} onAddReviewComment={addReviewComment} bookingClicks={bookingClicks} onSaveReview={saveReview} onDeleteReview={deleteReview} currentWeek={cfg.current_week} phase={ph} onTogglePick={togglePick} onBookingClick={trackBookingClick} onShowtimes={(f)=>{setShowtimesFilm(f);setFilmDetail(null)}} onClose={()=>setFilmDetail(null)} league={league} isAdmin={isAdmin} onBuy={buyFilm} onSell={sellFilm} onLiveVal={filmVal}/>}
      {showtimesFilm&&<ShowtimesModal film={showtimesFilm} onClose={()=>setShowtimesFilm(null)} onBookingClick={trackBookingClick} supabaseUrl={SUPABASE_URL} anonKey={SUPABASE_ANON_KEY}/>}
      {scoreModal&&<ScoreBreakdownModal film={scoreModal.film} holding={scoreModal.holding} results={results} weeklyGrosses={weeklyG} allChips={allChips} isEarlyBird={isEarlyBird} onClose={()=>setScoreModal(null)}/>}
      {profileEditOpen&&<ProfileEditModal/>}
      {confirmState&&(
        <div style={{position:'fixed',inset:0,background:'#000000DD',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}} onClick={()=>{confirmState.resolve(false);setConfirmState(null)}}>
          <div onClick={e=>e.stopPropagation()} style={{background:T.surface,border:`1px solid ${confirmState.danger?T.red+'44':T.border}`,borderRadius:'18px',padding:'24px',maxWidth:'340px',width:'100%'}}>
            <div style={{fontSize:'15px',color:T.text,lineHeight:1.6,marginBottom:'20px',textAlign:'center'}}>{confirmState.message}</div>
            <div style={{display:'flex',gap:'10px'}}>
              <Btn onClick={()=>{confirmState.resolve(false);setConfirmState(null)}} variant="outline" color={T.textSub} sx={{flex:1}}>{confirmState.cancelLabel}</Btn>
              <Btn onClick={()=>{confirmState.resolve(true);setConfirmState(null)}} color={confirmState.danger?T.red:T.gold} textColor={confirmState.danger?'#fff':'#0D0A08'} sx={{flex:1}}>{confirmState.confirmLabel}</Btn>
            </div>
          </div>
        </div>
      )}
      {onboardOpen&&(()=>{
        const budget=PHASE_BUDGETS[curPhase()]||150
        const recommend=films
          .filter(f=>f.phase===curPhase()&&results[f.id]==null&&filmVal(f)!=null&&filmVal(f)<=budget*0.4)
          .sort((a,b)=>{const ae=a.estM!=null?1:0,be=b.estM!=null?1:0;return be-ae||filmVal(a)-filmVal(b)})[0]
        const iOwnSomething=rosters.some(r=>r.player_id===profile.id&&r.active)
        const STEPS=[
          {type:'card',icon:'🎬',title:'Welcome to BOXD',body:'You are about to draft 2026 films like stocks. Their value moves on real box office numbers. The player who reads the market best wins. Takes 60 seconds to learn.'},
          {type:'card',icon:'💰',title:`You have ${cur}${budget}M to invest`,body:'Every film has an IPO price set by its expected opening weekend. Cheap films are cheap because the market expects little. If they overperform, they soar. That is where you win.'},
          {type:'card',icon:'📈',title:'How you score',body:'When a film opens, you earn points based on how it did versus its estimate. A film that doubles its estimate scores big. Strong word-of-mouth (small weekly drops) pushes value even higher.'},
          {type:'card',icon:'🎯',title:'The whole game in one line',body:'Buy films you think the market is underrating. Sell before they disappoint. Watch the box office prove you right. Ready to make your first pick?'},
          {type:'action',icon:'🗺️',title:'Take the tour',body:'Let me show you around — a quick walk through each screen so you know where everything is. Takes 30 seconds.'},
        ]
        const step=STEPS[onboardStep]
        const last=onboardStep===STEPS.length-1
        const finish=()=>{localStorage.setItem('boxd_onboard_done','1');setOnboardOpen(false);setPage('market')}
        const startTour=()=>{setOnboardOpen(false);setTourStep(0)}
        return(
          <div style={{position:'fixed',inset:0,background:'#000000EE',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
            <div style={{background:T.surface,border:`1px solid ${T.gold}33`,borderRadius:'20px',padding:'32px 24px',maxWidth:'380px',width:'100%',textAlign:'center'}}>
              <div style={{fontSize:'48px',marginBottom:'16px'}}>{step.icon}</div>
              <div style={{fontSize:'20px',fontWeight:800,color:T.gold,marginBottom:'12px'}}>{step.title}</div>
              <div style={{fontSize:'14px',color:T.text,lineHeight:1.6,marginBottom:'20px'}}>{step.body}</div>
              <div style={{display:'flex',gap:'6px',justifyContent:'center',marginBottom:'20px'}}>
                {STEPS.map((_,i)=><div key={i} style={{width:i===onboardStep?'20px':'6px',height:'6px',borderRadius:'3px',background:i===onboardStep?T.gold:T.border,transition:'all .2s'}}/>)}
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                {!last&&<Btn onClick={finish} variant="outline" color={T.textSub} sx={{flex:1}}>Skip tour</Btn>}
                {last
                  ?<><Btn onClick={finish} variant="outline" color={T.textSub} sx={{flex:1}}>Skip</Btn><Btn onClick={startTour} color={T.gold} sx={{flex:2}}>Take the tour →</Btn></>
                  :<Btn onClick={()=>setOnboardStep(s=>s+1)} color={T.gold} sx={{flex:2}}>Next</Btn>}
              </div>
            </div>
          </div>
        )
      })()}
      {tourStep>=0&&(()=>{
        const TOUR=[
          {page:'market',icon:'🎬',title:'The Market',body:'This is your trading floor. Every film has a live price. Tap any film to see its details, watchlist it, or buy. Prices rise as release nears and as more players buy in.'},
          {page:'roster',icon:'🎞️',title:'Your Roster',body:'Films you own live here. You\'ll see what you paid, what they\'re worth now, and your points. Sell anytime — but watch the transaction fee outside trading windows.'},
          {page:'league',icon:'🏆',title:'Standings',body:'Where you rank against your league. Points come from how your films perform versus their estimates. The gap to the player above you is shown so you always know the chase.'},
          {page:'intent',icon:'👁️',title:'Watchlist',body:'Films you\'re tracking but haven\'t bought. Great for keeping an eye on prices before you commit. Your watchlist also feeds the buzz data.'},
          {page:'community',icon:'👥',title:'Community',body:'The social hub — reviews, comments, screenings you can join, and the league buzz feed. React, discuss, and organise cinema trips with your league.'},
          {page:'forecaster',icon:'📊',title:'Forecaster',body:'Predict opening weekends and track your accuracy against the league. Pure bragging rights — sharpen your instincts here before you bet your budget.'},
          {page:'market',icon:'✅',title:'You\'re all set!',body:'That\'s the tour. Head to the Market, find a film you believe in, and make your first pick. Good luck — may the box office be in your favour.'},
        ]
        const t=TOUR[tourStep]
        const last=tourStep===TOUR.length-1
        const end=()=>{localStorage.setItem('boxd_onboard_done','1');setTourStep(-1);setPage('market')}
        return(
          <div style={{position:'fixed',inset:0,background:'#000000CC',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 100px',pointerEvents:'none'}}>
            <div style={{background:T.surface,border:`1px solid ${T.gold}44`,borderRadius:'18px',padding:'20px',maxWidth:'360px',width:'calc(100% - 32px)',boxShadow:'0 12px 48px #000000',pointerEvents:'auto'}}>
              <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
                <span style={{fontSize:'24px'}}>{t.icon}</span>
                <div style={{fontSize:'16px',fontWeight:800,color:T.gold}}>{t.title}</div>
              </div>
              <div style={{fontSize:'13px',color:T.text,lineHeight:1.6,marginBottom:'16px'}}>{t.body}</div>
              <div style={{display:'flex',gap:'5px',justifyContent:'center',marginBottom:'14px'}}>
                {TOUR.map((_,i)=><div key={i} style={{width:i===tourStep?'18px':'5px',height:'5px',borderRadius:'3px',background:i===tourStep?T.gold:T.border}}/>)}
              </div>
              <div style={{display:'flex',gap:'10px'}}>
                <Btn onClick={end} variant="outline" color={T.textSub} sx={{flex:1}}>{last?'Done':'Skip'}</Btn>
                {!last&&<Btn onClick={()=>setTourStep(s=>s+1)} color={T.gold} sx={{flex:2}}>Next ({tourStep+1}/{TOUR.length})</Btn>}
                {last&&<Btn onClick={end} color={T.green} textColor="#0D0A08" sx={{flex:2}}>Start playing →</Btn>}
              </div>
            </div>
          </div>
        )
      })()}
      {newSignalOpen&&<NewSignalModal/>}

      {/* ANALYST CHIP MODAL */}
      {chipModal==='analyst'&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'20px'}} onClick={()=>setChipModal(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.blue}44`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'400px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'18px',fontWeight:700,color:T.blue,marginBottom:'6px'}}>🎯 ANALYST</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Pick a film you own + predict its opening weekend. Within 10% of actual = +60pts.</div>
            {myRoster.map(h=>{
              const f=films.find(fl=>fl.id===h.film_id);if(!f)return null
              return(
                <div key={h.id} onClick={()=>{const pred=prompt(`Predict opening for ${f.title} ($M)`);if(pred&&!isNaN(Number(pred)))activateAnalyst(f.id,Number(pred))}} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center'}}>
                  <FilmPoster film={f} width={36} height={54} radius={5}/>
                  <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'10px',color:T.textSub}}>{f.estM?`est $${f.estM}M`:'—'}</div></div>
                  <div style={{color:T.blue,fontSize:'16px'}}>›</div>
                </div>
              )
            })}
            <Btn onClick={()=>setChipModal(null)} variant="outline" color={T.textSub} full sx={{marginTop:'10px'}}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* ADD FILM MODAL */}
      {addFilm&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'20px'}} onClick={()=>setAddFilm(false)}>
          <div style={{background:T.surface,border:`1px solid ${T.gold}44`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'440px',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'18px',fontWeight:700,color:T.gold,marginBottom:'14px'}}>+ Add Film</div>
            <input value={newFilm.title} onChange={e=>setNewFilm({...newFilm,title:e.target.value})} placeholder="Title" style={{...S.inp,marginBottom:'8px'}}/>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <input value={newFilm.dist} onChange={e=>setNewFilm({...newFilm,dist:e.target.value})} placeholder="Distributor" style={{...S.inp,flex:1}}/>
              <select value={newFilm.genre} onChange={e=>setNewFilm({...newFilm,genre:e.target.value})} style={{...S.inp,flex:1}}>
                {Object.keys(GENRE_COL).map(g=><option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <input type="number" value={newFilm.basePrice} onChange={e=>setNewFilm({...newFilm,basePrice:Number(e.target.value)})} placeholder="IPO $M" style={{...S.inp,flex:1}}/>
              <input type="number" value={newFilm.estM} onChange={e=>setNewFilm({...newFilm,estM:Number(e.target.value)})} placeholder="Est $M" style={{...S.inp,flex:1}}/>
              <input type="number" value={newFilm.rt} onChange={e=>setNewFilm({...newFilm,rt:e.target.value})} placeholder="RT %" style={{...S.inp,flex:1}}/>
            </div>
            <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
              <input type="number" value={newFilm.week} onChange={e=>setNewFilm({...newFilm,week:Number(e.target.value)})} placeholder="Week" style={{...S.inp,flex:1}}/>
              <input type="number" value={newFilm.phase} onChange={e=>setNewFilm({...newFilm,phase:Number(e.target.value)})} placeholder="Phase" style={{...S.inp,flex:1}}/>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <Btn onClick={()=>setAddFilm(false)} variant="outline" color={T.textSub} sx={{flex:1}}>Cancel</Btn>
              <Btn onClick={async()=>{
                if(!newFilm.title.trim())return notify('Title required',T.red)
                const id=newFilm.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+'-'+Date.now().toString(36)
                const{error}=await supabase.from('films').insert({id,title:newFilm.title.trim(),dist:newFilm.dist.trim(),genre:newFilm.genre,base_price:newFilm.basePrice||null,est_m:newFilm.estM||null,rt:newFilm.rt?Number(newFilm.rt):null,week:newFilm.week,phase:newFilm.phase,star_actor:newFilm.starActor||null,trailer:newFilm.trailer||null,active:true})
                if(error)return notify(error.message,T.red)
                notify('Film added',T.green);setAddFilm(false);setNewFilm({...newFilm,title:'',dist:''});loadData(league?.id)
              }} color={T.gold} sx={{flex:2}}>Add</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App(){
  return <ErrorBoundary><AppInner/></ErrorBoundary>
}
