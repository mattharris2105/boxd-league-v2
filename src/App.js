import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const SUPABASE_URL = 'https://yxluqkfanhzktinayvex.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

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
const PHASE_BUDGETS      = {1:80,2:150,3:80,4:100,5:120}
const PHASE_NAMES        = {1:'Dead Zone',2:'Summer Slate',3:'Horror Window',4:'Awards Season',5:'Oscar Sprint'}
const TMDB_TOKEN         = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZjA0OTBiOGU0OWQxNjFmYmIzMjBmYjg5NGJhOTQ1MyIsIm5iZiI6MTc3NTA4Mjg0Mi4xNzcsInN1YiI6IjY5Y2Q5ZDVhZGE4ZjEwZmZmNTJmNmE3MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.fxBTZG1YMdHkUUgz55l2TUWGa7YKsDUz8JbuFgr84q0'
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
  {id:'chips',icon:'⚡',label:'Chips'},
  {id:'league',icon:'🥇',label:'League'},
  {id:'trades',icon:'🔄',label:'Trades'},
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

  /* Hoverable cards */
  .hoverable{transition:border-color .2s,transform .15s,background .2s,box-shadow .2s;}
  .hoverable:hover{border-color:#382E28 !important;box-shadow:0 8px 28px #00000066;transform:translateY(-2px);}
  .hoverable:active{transform:scale(0.985) translateY(0);opacity:0.95;}
  .pressable{transition:transform .1s ease, opacity .1s ease;}
  .pressable:active{transform:scale(0.94);opacity:0.85;}

  /* Film card tilt on desktop */
  @media(hover:hover){
    .film-card-tilt{transition:transform .25s cubic-bezier(.2,.9,.3,1.2), box-shadow .25s ease;transform-style:preserve-3d;will-change:transform;}
    .film-card-tilt:hover{transform:translateY(-6px) scale(1.02);box-shadow:0 20px 40px #00000088, 0 0 0 1px #E8A02022;}
    .film-card-tilt:hover .poster-shine{opacity:1;}
    .film-card-tilt:hover .film-card-info{transform:translateY(-4px);}
  }
  .film-card-tilt{transform:translateZ(0);}
  .film-card-info{transition:transform .3s ease;}

  /* Poster shine effect (owned films) */
  .poster-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg, transparent 30%, #E8A02020 48%, #E8A02040 50%, #E8A02020 52%, transparent 70%);transform:translateX(-100%);animation:shine 3s ease-in-out infinite;opacity:0.7;}
  @keyframes shine{0%{transform:translateX(-100%);}60%,100%{transform:translateX(100%);}}

  /* Glassmorphism */
  .glass{backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5);background:rgba(22,18,16,0.65);border:1px solid rgba(255,255,255,0.06);}

  /* Bloom on score updates */
  .bloom{animation:bloom .6s ease-out;}
  .gold-glow{animation:goldGlow 2s ease-in-out infinite;}
  .breathe{animation:breathe 3.5s ease-in-out infinite;}
  .bounce-in{animation:bounceIn .4s cubic-bezier(.2,.9,.3,1.3);}

  /* Skeleton shimmer */
  .skeleton{background:linear-gradient(90deg, #1E1916 0%, #2A2420 50%, #1E1916 100%);background-size:200% 100%;animation:shimmer 1.6s ease-in-out infinite;border-radius:8px;}

  button:focus-visible{outline:2px solid #E8A02066;outline-offset:2px;}
  @media(min-width:768px){
    .film-grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))!important;}
  }

  /* Respect reduced motion */
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
    // Haptic on mobile
    if(navigator.vibrate)navigator.vibrate(8)
    onClick(e)
  }
  return <button onClick={handleClick} disabled={disabled} className="pressable" style={{...S.btn,padding:pad,fontSize:fs,background:variant==='solid'?color:'transparent',color:variant==='solid'?textColor:color,border:variant==='outline'?`1px solid ${color}55`:'none',opacity:disabled?0.35:1,cursor:disabled?'not-allowed':'pointer',width:full?'100%':undefined,...sx}}>{children}</button>
}
function Badge({children,color=T.gold}){return <span style={{fontSize:'10px',fontWeight:500,color,background:`${color}20`,padding:'2px 8px',borderRadius:'20px',display:'inline-flex',alignItems:'center',gap:'3px',lineHeight:1.5}}>{children}</span>}
function Pill({children,color=T.textSub}){return <span style={{fontSize:'11px',color,background:`${color}18`,padding:'3px 9px',borderRadius:'20px',display:'inline-block',lineHeight:1.4,whiteSpace:'nowrap'}}>{children}</span>}
function Divider({my=12}){return <div style={{height:'1px',background:T.border,margin:`${my}px 0`}}/>}
function StatBox({label,value,color=T.text,sub}){return <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'12px 14px',flex:1,minWidth:0}}><div style={{...S.label,marginBottom:'5px'}}>{label}</div><div style={{fontSize:'22px',fontWeight:700,color,lineHeight:1,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:'11px',color:T.textSub,marginTop:'3px'}}>{sub}</div>}</div>}

// ── ANIMATED COUNTUP ──────────────────────────────────────────────────────────
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
      // ease-out cubic
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

// ── CONFETTI BURST ───────────────────────────────────────────────────────────
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

// ── SKELETON LOADER ──────────────────────────────────────────────────────────
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

// ── HAPTIC HELPER ───────────────────────────────────────────────────────────
const haptic={
  tap:()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch{}},
  success:()=>{try{navigator.vibrate&&navigator.vibrate([15,30,15])}catch{}},
  warn:()=>{try{navigator.vibrate&&navigator.vibrate([30,50,30])}catch{}},
}

// ── TMDB POSTER ────────────────────────────────────────────────────────────────
const posterCache = {}
async function fetchTMDBPoster(title,tmdbId){
  const key = tmdbId?`id:${tmdbId}`:title
  if(posterCache[key]!==undefined) return posterCache[key]
  posterCache[key]=null
  // If we have a tmdb_id, fetch directly
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
  const [url,setUrl]=useState(posterCache[key]!==undefined?posterCache[key]:undefined)
  const gc=GENRE_COL[film?.genre]||T.textSub
  const containerRef=useRef(null)
  useEffect(()=>{
    if(!film?.title){setUrl(null);return}
    if(posterCache[key]!==undefined) return
    let cancelled=false
    fetchTMDBPoster(film.title,film.tmdbId).then(u=>{if(!cancelled)setUrl(u)})
    return()=>{cancelled=true}
  },[film?.title,film?.tmdbId])
  // Tilt handlers for desktop
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
      {url===undefined&&<div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,${T.surfaceUp} 25%,${T.border} 50%,${T.surfaceUp} 75%)`,backgroundSize:'200% 100%',animation:'shimmer 1.6s ease-in-out infinite'}}/>}
      {url===null&&<div style={{position:'absolute',inset:0,background:`linear-gradient(145deg,${gc}28 0%,${T.surfaceUp} 100%)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5}}><div style={{fontSize:typeof width==='number'?Math.max(16,width*0.28):20,lineHeight:1}}>🎬</div><div style={{fontSize:'9px',color:gc,textAlign:'center',padding:'0 6px',lineHeight:1.2}}>{film?.genre}</div></div>}
      {url&&<img src={url} alt={film?.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',display:'block',...imgStyle}} onError={()=>setUrl(null)}/>}
      {/* Gold shine for owned films */}
      {owned&&url&&<div className="poster-shine"/>}
      {/* Green tint for scored films */}
      {scored&&url&&<div style={{position:'absolute',inset:0,background:`linear-gradient(to top, ${T.green}44, transparent 60%)`,pointerEvents:'none'}}/>}
    </div>
  )
}

// ── SCORING ────────────────────────────────────────────────────────────────────
function calcMarketValue(film,actualM){
  if(actualM==null) return film.basePrice
  const r=actualM/film.estM
  const perf=r>=2?2:r>=1.5?1.6:r>=1.3?1.35:r>=1.1?1.15:r>=0.95?1:r>=0.8?0.85:r>=0.6?0.65:r>=0.4?0.45:0.25
  const rt=film.rt!=null?(film.rt>=90?1.15:film.rt>=75?1.08:film.rt<50?0.9:1):1
  return Math.round(Math.max(film.basePrice*0.15,Math.min(film.basePrice*3,film.basePrice*perf*rt)))
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
function calcDemandMult(film,rosters,phase,totalPlayers){
  // Ownership demand only — watchlist intentionally excluded (gameable)
  if(!totalPlayers) return 1
  const owners=rosters.filter(r=>r.film_id===film.id&&r.phase===phase&&r.active).length
  const pct=owners/totalPlayers
  // Scale: 0.8 (undiscovered) → 1.3 (hot)
  // Curve is deliberately gentle — ownership is one signal, performance is the main price driver
  const demandMult=
    pct>=0.7?1.30:
    pct>=0.55?1.22:
    pct>=0.40?1.15:
    pct>=0.25?1.08:
    pct>=0.10?1.00:
    pct>=0.02?0.92:
    0.80 // truly undiscovered — meaningful discount to reward early movers
  // Pre-result RT nudge — if RT score is known before opening weekend,
  // nudge price slightly so critics consensus is priced in
  const rtNudge=film.rt!=null&&!film.hasResult
    ?(film.rt>=90?1.08:film.rt>=75?1.04:film.rt<40?0.92:film.rt<55?0.96:1.0)
    :1.0
  return Math.round(demandMult*rtNudge*100)/100
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

// ── DB HELPERS ─────────────────────────────────────────────────────────────────
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

// ── TIMERS ─────────────────────────────────────────────────────────────────────
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


// ── SCORE BREAKDOWN MODAL ──────────────────────────────────────────────────────
function ScoreBreakdownModal({film,holding,results,weeklyGrosses,allChips,auteurDeclarations,weekendWinners,isEarlyBird,onClose}){
  const actual=results[film.id],weeks=weeklyGrosses[film.id]||{},pid=holding.player_id
  const chip=allChips.find(c=>c.player_id===pid)
  const analystWin=chip?.analyst_film_id===film.id&&chip?.analyst_result==='win'
  const shortResult=chip?.short_film_id===film.id?chip?.short_result:null
  const eb=isEarlyBird(holding)
  const auteur=auteurDeclarations.find(a=>a.player_id===pid)?.film_ids?.includes(film.id)
  const isWW=Object.values(weekendWinners).includes(film.id)
  const gc=GENRE_COL[film.genre]||T.textSub
  const baseOpen=actual!=null?calcOpeningPts(film,actual,false,false):0
  const ebBonus=(eb&&actual!=null&&actual/film.estM>=1.1)?Math.round(baseOpen*0.1):0
  const analystBon=analystWin?60:0
  const auteurBon=auteur?Math.round((baseOpen+ebBonus)*0.1):0
  const openPts=baseOpen+ebBonus+analystBon+auteurBon
  const wkPts=Math.round(calcWeeklyPts(weeks))
  const lb=calcLegsBonus(actual,weeks[2])
  const ww=isWW?15:0
  const sb=shortResult==='win'?100:shortResult==='lose'?-30:0
  const total=openPts+wkPts+lb+ww+sb
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
              <div style={{fontSize:'12px',color:T.textSub,marginTop:'4px'}}>{film.dist} · Week {film.week} · Phase {film.phase}</div>
              {actual!=null&&<div style={{display:'flex',gap:'14px',marginTop:'12px',flexWrap:'wrap'}}>
                {[['ACTUAL',`$${actual}M`,T.green],['EST',`$${film.estM}M`,T.text],['RATIO',`${(actual/film.estM).toFixed(2)}×`,actual/film.estM>=1?T.green:T.red],...(film.rt!=null?[['RT',`${film.rt}%`,film.rt>=90?T.green:film.rt>=75?T.gold:T.red]]:[])].map(([l,v,c])=>(
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
              <Row label="Base opening pts" value={`+${baseOpen}`} sub={`$${actual}M actual · ${(actual/film.estM).toFixed(2)}× performance`}/>
              {eb&&ebBonus>0&&<Row label="🐦 Early Bird +10%" value={`+${ebBonus}`} color={T.green}/>}
              {analystWin&&<Row label="🎯 Analyst bonus" value="+60" color={T.blue}/>}
              {auteur&&auteurBon>0&&<Row label="🎭 Auteur +10%" value={`+${auteurBon}`} color={T.orange}/>}
              {wkPts>0&&<Row label="📅 Weekly grosses" value={`+${wkPts}`} color={T.blue} sub="W1–3: 1pt/$1M · W4+: 1.1pts/$1M"/>}
              {lb>0&&<Row label="🦵 Legs (W2 drop <30%)" value="+25" color={T.green}/>}
              {isWW&&<Row label="🥇 Weekend #1" value="+15" color={T.gold}/>}
              {sb!==0&&<Row label={sb>0?'📉 Short WIN':'📉 Short LOSE'} value={sb>0?'+100':'-30'} color={sb>0?T.green:T.red}/>}
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

// ── FILM DETAIL MODAL ──────────────────────────────────────────────────────────
function FilmDetailModal({film,profile,players,results,allPicks=[],marketingEvents=[],onTogglePick,onBookingClick,onShowtimes,onClose,league}){
  const[comments,setComments]=useState([])
  const[reactions,setReactions]=useState([])
  const[text,setText]=useState('')
  const[tab,setTab]=useState('info')
  const actual=results[film.id],gc=GENRE_COL[film.genre]||T.textSub
  const pickCount=allPicks.filter(p=>p.film_id===film.id).length
  const vel7=pickVelocity(film.id,allPicks,7),vel1=pickVelocity(film.id,allPicks,1)
  const eventsForFilm=(marketingEvents||[]).filter(e=>e.film_id===film.id).sort((a,b)=>new Date(a.event_date)-new Date(b.event_date))
  useEffect(()=>{
    loadComments();loadReactions()
    const ch=supabase.channel(`film-detail-${film.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'film_comments',filter:`film_id=eq.${film.id}`},loadComments)
      .on('postgres_changes',{event:'*',schema:'public',table:'reactions',filter:`target_id=eq.${film.id}`},loadReactions)
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[])
  const loadComments=async()=>{const{data}=await supabase.from('film_comments').select('*').eq('film_id',film.id).order('created_at',{ascending:true});if(data)setComments(data)}
  const loadReactions=async()=>{const{data}=await supabase.from('reactions').select('*').eq('target_type','film').eq('target_id',film.id);if(data)setReactions(data)}
  const post=async()=>{if(!text.trim())return;await supabase.from('film_comments').insert({user_id:profile.id,film_id:film.id,comment:text.trim(),league_id:league?.id});setText('');loadComments()}
  const toggleReaction=async(emoji)=>{
    const mine=reactions.find(r=>r.user_id===profile.id&&r.emoji===emoji)
    if(mine)await supabase.from('reactions').delete().eq('id',mine.id)
    else await supabase.from('reactions').insert({user_id:profile.id,target_type:'film',target_id:film.id,emoji})
    loadReactions()
  }
  const counts=EMOJI_OPTIONS.reduce((a,e)=>({...a,[e]:reactions.filter(r=>r.emoji===e).length}),{})
  const myEmojis=reactions.filter(r=>r.user_id===profile.id).map(r=>r.emoji)
  const TabBtn=({id,label})=><button onClick={()=>setTab(id)} style={{...S.btn,background:'none',border:'none',fontSize:'13px',fontWeight:tab===id?700:400,color:tab===id?T.gold:T.textSub,padding:'10px 16px',borderBottom:`2px solid ${tab===id?T.gold:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0}}>{label}</button>
  return(
    <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:800,padding:'12px'}} onClick={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px',width:'100%',maxWidth:'700px',height:'min(92vh,860px)',display:'flex',flexDirection:'column',animation:'fadeUp .2s ease'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'24px 24px 0',flexShrink:0}}>
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
                <div><div style={S.label}>Est</div><div style={{fontSize:'15px',fontWeight:700,marginTop:'2px'}}>${film.estM}M</div></div>
                <div><div style={S.label}>IPO</div><div style={{fontSize:'15px',fontWeight:700,marginTop:'2px'}}>${film.basePrice}M</div></div>
                {actual!=null&&<div><div style={S.label}>Actual</div><div style={{fontSize:'15px',fontWeight:700,color:T.green,marginTop:'2px'}}>${actual}M</div></div>}
                {film.rt!=null&&<div><div style={S.label}>RT</div><div style={{fontSize:'15px',fontWeight:700,color:film.rt>=75?T.green:T.red,marginTop:'2px'}}>{film.rt}%</div></div>}
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'10px',alignItems:'center',flexWrap:'wrap'}}>
                {onTogglePick&&<PickButton filmId={film.id} userId={profile.id} allPicks={allPicks} onToggle={onTogglePick} size="sm"/>}
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
            <div style={{...S.label,marginBottom:'10px'}}>Reactions</div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'20px'}}>
              {EMOJI_OPTIONS.map(emoji=>{const count=counts[emoji],ismine=myEmojis.includes(emoji);return(
                <button key={emoji} onClick={()=>toggleReaction(emoji)} style={{background:ismine?`${T.gold}22`:T.surfaceUp,border:`1px solid ${ismine?T.gold+'66':T.border}`,borderRadius:'20px',padding:'6px 12px',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',gap:'5px',fontFamily:T.mono,color:count>0?(ismine?T.gold:T.text):T.textSub,transition:'all .15s'}}>
                  {emoji}{count>0&&<span style={{fontSize:'11px'}}>{count}</span>}
                </button>
              )})}
            </div>
            {onShowtimes&&<button onClick={()=>onShowtimes(film)} style={{...S.btn,background:`${T.green}18`,border:`1px solid ${T.green}44`,color:T.green,padding:'10px 18px',fontSize:'13px',width:'100%',marginBottom:'12px',textTransform:'none',letterSpacing:0,borderRadius:'10px'}}>🎟 Find Showtimes Near Me</button>}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
              {BOOKING_CHAINS.map(chain=>(
                <a key={chain.id} href={`${chain.url}${encodeURIComponent(film.title.toLowerCase().replace(/\s+/g,'-'))}`} target="_blank" rel="noopener noreferrer" onClick={()=>onBookingClick&&onBookingClick(film.id,chain.id)} style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'9px',padding:'8px 14px',textDecoration:'none',fontSize:'12px',color:T.text,fontFamily:T.mono,display:'flex',alignItems:'center',gap:'6px'}}>
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
              {comments.length===0&&<div style={{fontSize:'14px',color:T.textSub,padding:'20px 0'}}>No comments yet — be first!</div>}
              {comments.map(c=>{
                const p=players.find(pl=>pl.id===c.user_id)
                return(
                  <div key={c.id} style={{display:'flex',gap:'12px',marginBottom:'18px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:p?.color||T.gold,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#0D0A08'}}>{p?.name?.[0]||'?'}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:'8px',alignItems:'baseline',marginBottom:'4px'}}><span style={{fontSize:'13px',fontWeight:600,color:p?.color||T.gold}}>{p?.name}</span><span style={{fontSize:'11px',color:T.textDim}}>{timeAgo(c.created_at)}</span></div>
                      <div style={{fontSize:'14px',color:T.text,lineHeight:1.55}}>
                        {c.comment.split(/(@\w+)/g).map((part,i)=>{if(part.startsWith('@')){const mentioned=players.find(p=>`@${p.name}`===part);return<span key={i} style={{color:mentioned?.color||T.gold,fontWeight:600}}>{part}</span>}return part})}
                      </div>
                    </div>
                    {c.user_id===profile.id&&<button onClick={()=>supabase.from('film_comments').delete().eq('id',c.id).then(loadComments)} style={{background:'none',border:'none',color:T.textDim,cursor:'pointer',fontSize:'13px',padding:'2px 8px'}}>✕</button>}
                  </div>
                )
              })}
            </div>
            <div style={{padding:'16px 24px 24px',borderTop:`1px solid ${T.border}`,flexShrink:0}}>
              {text.includes('@')&&(()=>{
                const atPart=text.split('@').pop().toLowerCase()
                const matches=players.filter(p=>p.id!==profile.id&&p.name?.toLowerCase().startsWith(atPart)&&atPart.length>0)
                if(!matches.length) return null
                return<div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'8px'}}>{matches.slice(0,4).map(p=><button key={p.id} onClick={()=>setText(prev=>prev.replace(/@\w*$/,`@${p.name} `))} style={{...S.btn,background:T.surfaceUp,border:`1px solid ${T.border}`,color:p.color||T.gold,fontSize:'12px',padding:'5px 12px',textTransform:'none',letterSpacing:0}}>@{p.name}</button>)}</div>
              })()}
              <div style={{display:'flex',gap:'12px'}}>
                <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&post()} placeholder="Add a comment… use @ to mention" style={{...S.inp,flex:1,fontSize:'15px',padding:'13px 16px'}}/>
                <Btn onClick={post} color={T.blue} textColor="#fff" size="lg">Post</Btn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── TRADE MODAL ────────────────────────────────────────────────────────────────
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
    const{error}=await supabase.from('trades').insert({proposer_id:profile.id,receiver_id:target,proposer_film_id:myFilm,receiver_film_id:theirFilm,status:'pending',phase:ph,league_id:league?.id})
    if(error) return notify(error.message,T.red)
    await logActivity(profile.id,'trade_proposed',{player_name:profile.name,my_film:mf?.title,their_film:tf?.title},league?.id)
    await sendNotification('trade_proposed',{trade_id:data?.id,proposer_name:profile.name,receiver_id:target,proposer_film:mf?.title,receiver_film:tf?.title})
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

// ── SHOWTIMES MODAL ────────────────────────────────────────────────────────────
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
            {state==='error'&&<div style={{fontSize:'13px',color:T.red,marginTop:'10px',padding:'10px 14px',background:`${T.red}12`,borderRadius:'9px'}}>⚠️ {error}</div>}
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
            <div style={{marginTop:'16px',textAlign:'center'}}><button onClick={()=>{setState('idle');setCinemas([]);setCoords(null)}} style={{background:'none',border:'none',color:T.textSub,cursor:'pointer',fontFamily:T.mono,fontSize:'12px',textDecoration:'underline'}}>Change location</button></div>
          </>}
        </div>
      </div>
    </div>
  )
}


// ── PLAYER PROFILE PAGE ────────────────────────────────────────────────────────
function PlayerProfilePage({player,films,rosters,results,weeklyG,allChips,auteurDecl,wwWinners,oscarPreds,calcPoints,calcPhasePoints,budgetLeft,cur,isEarlyBird,analystActive,auteurBonus,shortBonus,wwBonus,curPhase_ref,onBack}){
  const[activePhase,setActivePhase]=useState(null)
  const totalPts=calcPoints(player.id)
  const chip=allChips.find(c=>c.player_id===player.id)
  const auteur=auteurDecl.find(a=>a.player_id===player.id)
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
          const eb=isEarlyBird(h),aa=analystActive(player.id,film.id),au=auteurBonus(player.id,film.id),sb=shortBonus(player.id,film.id),wb=wwBonus(film.id)
          let op=calcOpeningPts(film,actual,eb,aa);if(au)op=Math.round(op*1.1)
          const wp=Math.round(calcWeeklyPts(weeklyG[film.id]||{})),lb=calcLegsBonus(actual,weeklyG[film.id]?.[2])
          const filmTotal=op+wp+lb+wb+sb
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
                      {wb>0&&<div><div style={S.label}>W/E #1 🥇</div><div style={{fontSize:'13px',fontWeight:600,color:T.gold,marginTop:'2px'}}>+15</div></div>}
                      {sb!==0&&<div><div style={S.label}>Short 📉</div><div style={{fontSize:'13px',fontWeight:600,color:sb>0?T.green:T.red,marginTop:'2px'}}>{sb>0?'+':''}{sb}</div></div>}
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
    const phaseScores=[1,2,3,4,5].map(p=>({ph:p,pts:calcPhasePoints(player.id,p)}))
    const maxPts=Math.max(1,...phaseScores.map(s=>s.pts))
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={{background:T.surfaceUp,borderRadius:'16px',padding:'24px',marginBottom:'16px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'4px',background:pc}}/>
          <div style={{display:'flex',alignItems:'center',gap:'18px'}}>
            <div style={{width:'68px',height:'68px',borderRadius:'50%',background:pc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'30px',fontWeight:900,color:'#000',flexShrink:0}}>{player.name?.[0]||'?'}</div>
            <div style={{flex:1}}><div style={{fontSize:'26px',fontWeight:900,color:pc,letterSpacing:'-0.5px'}}>{player.name}</div><div style={{fontSize:'13px',color:T.textSub,marginTop:'6px'}}>{activeNow.length} films active · {budgetLeft(player.id)}M left</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:'48px',fontWeight:900,color:T.gold,lineHeight:1,letterSpacing:'-2px'}}>{totalPts}</div><div style={S.label}>grand pts</div></div>
          </div>
        </div>
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
          {[1,2,3,4,5].map(ph=>{
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

// ── LOGIN & CREATE PROFILE ─────────────────────────────────────────────────────
function Login(){
  const[email,setEmail]=useState('')
  const[sent,setSent]=useState(false)
  const[busy,setBusy]=useState(false)
  const go=async e=>{e.preventDefault();setBusy(true);const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'https://boxd-league-v2.vercel.app'}});if(error)alert(error.message);else setSent(true);setBusy(false)}
  return(
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono,padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'320px'}}>
        <div style={{fontSize:'56px',fontWeight:900,color:T.gold,letterSpacing:'-3px',marginBottom:'6px',lineHeight:1}}>BOXD</div>
        <div style={{fontSize:'11px',color:T.textDim,letterSpacing:'3px',marginBottom:'44px'}}>FANTASY BOX OFFICE</div>
        {sent?<div style={{textAlign:'center'}}><div style={{fontSize:'16px',color:T.text,marginBottom:'8px'}}>Check your email ✉️</div><div style={{fontSize:'13px',color:T.textSub}}>{email}</div></div>:<form onSubmit={go}>
          <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required style={{...S.inp,marginBottom:'12px',fontSize:'14px',padding:'14px 16px'}}/>
          <button type="submit" disabled={busy} style={{width:'100%',background:T.gold,color:'#0D0A08',border:'none',borderRadius:'10px',padding:'14px',fontSize:'13px',fontWeight:700,cursor:'pointer',letterSpacing:'1px',fontFamily:T.mono}}>{busy?'SENDING…':'SEND MAGIC LINK'}</button>
        </form>}
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


// ── APP ROOT ───────────────────────────────────────────────────────────────────
export default function App(){
  const[session,setSession]=useState(null)
  const[loading,setLoading]=useState(true)
  const[dataLoading,setDataLoading]=useState(false)
  const[profile,setProfile]=useState(null)
  const[page,setPage]=useState('market')
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
  const[marketSearch,setMarketSearch]=useState('')
  const[marketGenre,setMarketGenre]=useState('All')
  const[allPicks,setAllPicks]=useState([])
  const[marketingEvents,setMarketingEvents]=useState([])
  const[bookingClicks,setBookingClicks]=useState([])
  const[showtimesFilm,setShowtimesFilm]=useState(null)
  const[sealedBids,setSealedBids]=useState([])
  const[league,setLeague]=useState(null)
  const[myLeagues,setMyLeagues]=useState([])
  const[leaguePage,setLeaguePage]=useState('lobby')
  const[inviteCode,setInviteCode]=useState('')
  const[newLeagueName,setNewLeagueName]=useState('')
  const[ingestLog,setIngestLog]=useState(null)
  const[phaseTransitioning,setPhaseTransitioning]=useState(false)
  const[phaseCeremony,setPhaseCeremony]=useState(null) // {phase, winner, mvp, bestChip}
  const[shareCardFilm,setShareCardFilm]=useState(null)
  const[confettiActive,setConfettiActive]=useState(false)
  const triggerConfetti=()=>{
    setConfettiActive(true)
    setTimeout(()=>setConfettiActive(false),3000)
    haptic.success()
  }
  const nowRef=useRef(Date.now())
  const isMobile=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

  useEffect(()=>{
    const el=document.createElement('style');el.textContent=GLOBAL_CSS;document.head.appendChild(el)
    // PWA / mobile meta
    const setMeta=(name,content,prop='name')=>{let m=document.querySelector(`meta[${prop}="${name}"]`);if(!m){m=document.createElement('meta');m.setAttribute(prop,name);document.head.appendChild(m)}m.setAttribute('content',content)}
    setMeta('theme-color','#0D0A08')
    setMeta('apple-mobile-web-app-capable','yes')
    setMeta('apple-mobile-web-app-status-bar-style','black-translucent')
    setMeta('apple-mobile-web-app-title','BOXD')
    setMeta('viewport','width=device-width,initial-scale=1,viewport-fit=cover')
    document.title='BOXD · Fantasy Box Office'
    // Inject manifest link
    if(!document.querySelector('link[rel="manifest"]')){
      const lnk=document.createElement('link');lnk.rel='manifest';lnk.href='/manifest.json';document.head.appendChild(lnk)
    }
    // Register service worker
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{})
    }
    return()=>document.head.removeChild(el)
  },[])
  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false)});supabase.auth.onAuthStateChange((_,s)=>setSession(s))},[])
  useEffect(()=>{if(session){loadProfile();loadLeagues();loadPicks();loadMarketingEvents();loadBookingClicks()}},[session])
  useEffect(()=>{const t=setInterval(()=>{nowRef.current=Date.now()},1000);return()=>clearInterval(t)},[])
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
  const goToProfile=(player)=>{setPrevPage(page);setProfilePlayer(player);setPage('profile')}
  const isCommissioner=session?.user?.email===COMMISSIONER_EMAIL||league?.commissioner_id===session?.user?.id

  // ── LEAGUE ──────────────────────────────────────────────────────────────────
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
    // Auto-create league_config row to prevent 406
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
  const leaveLeague=async()=>{
    if(!league||!confirm(`Leave ${league.name}?`)) return
    await supabase.from('league_members').delete().eq('league_id',league.id).eq('user_id',session.user.id)
    await supabase.from('profiles').update({active_league_id:null}).eq('id',session.user.id)
    setLeague(null);loadLeagues()
  }
  const loadFeed=async(leagueId)=>{const lid=leagueId||league?.id;if(!lid)return;const{data}=await supabase.from('activity_feed').select('*').eq('league_id',lid).order('created_at',{ascending:false}).limit(80);if(data)setFeedItems(data)}
  const loadTrades=async(leagueId)=>{const lid=leagueId||league?.id;if(!lid)return;const{data}=await supabase.from('trades').select('*').eq('league_id',lid).order('created_at',{ascending:false});if(data)setTrades(data)}
  const loadPicks=async()=>{const{data}=await supabase.from('film_picks').select('*');if(data)setAllPicks(data)}
  const loadMarketingEvents=async()=>{const{data}=await supabase.from('marketing_events').select('*').order('event_date');if(data)setMarketingEvents(data)}
  const loadBookingClicks=async()=>{const{data}=await supabase.from('booking_clicks').select('*');if(data)setBookingClicks(data)}

  const togglePick=async(filmId,isPicked)=>{
    if(!profile) return notify('Sign in to pick films',T.red)
    if(isPicked)await supabase.from('film_picks').delete().eq('user_id',profile.id).eq('film_id',filmId)
    else await supabase.from('film_picks').insert({user_id:profile.id,film_id:filmId})
    loadPicks()
  }
  const trackBookingClick=async(filmId,chain)=>{await supabase.from('booking_clicks').insert({user_id:profile?.id,film_id:filmId,chain});loadBookingClicks()}

  const loadData=async(leagueId)=>{
    const lid=leagueId||league?.id;if(!lid)return
    setDataLoading(true)
    const memberIds=(await supabase.from('league_members').select('user_id').eq('league_id',lid)).data?.map(m=>m.user_id)||[]
    const[{data:ps},{data:rs},{data:res},{data:fv},{data:cf},{data:wg},{data:ch},{data:fc},{data:op},{data:ad},{data:ww},{data:pb},{data:fl}]=await Promise.all([
      supabase.from('profiles').select('*').in('id',memberIds.length?memberIds:['none']),
      supabase.from('rosters').select('*').eq('league_id',lid),
      supabase.from('results').select('*'),
      supabase.from('film_values').select('*'),
      // maybeSingle() prevents 406 when no config row exists yet
      supabase.from('league_config').select('*').eq('league_id',lid).maybeSingle(),
      supabase.from('weekly_grosses').select('*'),
      // chips table might not exist yet — catch gracefully
      supabase.from('chips').select('*').eq('league_id',lid),
      supabase.from('forecasts').select('*').eq('league_id',lid),
      supabase.from('oscar_predictions').select('*').eq('league_id',lid),
      supabase.from('auteur_declarations').select('*').eq('league_id',lid),
      supabase.from('weekend_winners').select('*').eq('league_id',lid),
      supabase.from('phase_budgets').select('*').eq('league_id',lid),
      supabase.from('films').select('*').eq('active',true).order('phase').order('week'),
    ])
    if(ps)setPlayers(ps)
    if(rs)setRosters(rs)
    if(res){const m={};res.forEach(r=>m[r.film_id]=r.actual_m);setResults(m)}
    if(fv){const m={};fv.forEach(v=>m[v.film_id]=v.current_value);setFilmValues(m)}
    // cf may be null if no config row — use defaults
    setCfg(cf||{current_week:1,current_phase:1,currency:'$',tx_fee:5,phase_window_active:false,phase_window_opened_at:null,draft_window_open:false,draft_deadline:null,sealed_bid_window_open:false,sealed_bid_deadline:null})
    if(wg){const m={};wg.forEach(w=>{if(!m[w.film_id])m[w.film_id]={};m[w.film_id][w.week_num]=w.gross_m});setWeeklyG(m)}
    if(ch){setAllChips(ch);setChips(ch.find(c=>c.player_id===session?.user?.id)||null)}
    if(fc){setAllForecasts(fc);const m={};fc.filter(f=>f.player_id===session?.user?.id).forEach(f=>m[f.film_id]=f.predicted_m);setForecasts(m)}
    if(op){setOscarPreds(op);setMyOscar(op.find(o=>o.player_id===session?.user?.id)||null)}
    if(ad)setAuteurDecl(ad)
    if(ww){const m={};ww.forEach(w=>m[w.week]=w.film_id);setWwWinners(m)}
    if(pb)setPhaseBudgets(pb)
    if(fl)setFilms(fl.map(f=>({
      id:f.id,title:f.title,dist:f.dist,genre:f.genre,
      franchise:f.franchise,starActor:f.star_actor,
      phase:f.phase,week:f.week,basePrice:f.base_price,
      estM:f.est_m,rt:f.rt,sleeper:f.sleeper,
      trailer:f.trailer||'',affiliateUrl:f.affiliate_url||'',
      tmdbId:f.tmdb_id||null,
    })))
    loadTrades(lid)
    setDataLoading(false)
  }

  // ── BUDGET ──────────────────────────────────────────────────────────────────
  const curPhase=()=>cfg.current_phase||1
  const isWindow=()=>cfg.phase_window_active||false
  const phaseBanked=(pid,ph)=>ph<=1?0:phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph-1)?.budget_banked||0
  const phaseAlloc=(pid,ph)=>{const s=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph);return s?s.budget_allocated:(PHASE_BUDGETS[ph]||100)+phaseBanked(pid,ph)}
  const phaseSpent=(pid,ph)=>rosters.filter(r=>r.player_id===pid&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).reduce((s,r)=>s+r.bought_price,0)
  const budgetLeft=(pid)=>Math.max(0,phaseAlloc(pid,curPhase())-phaseSpent(pid,curPhase()))
  const bankBudget=async(pid,ph)=>{
    const alloc=phaseAlloc(pid,ph),spent=phaseSpent(pid,ph),banked=Math.max(0,alloc-spent)
    const ex=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph)
    if(ex)await supabase.from('phase_budgets').update({budget_allocated:alloc,budget_spent:spent,budget_banked:banked}).eq('id',ex.id)
    else await supabase.from('phase_budgets').insert({player_id:pid,phase:ph,budget_allocated:alloc,budget_spent:spent,budget_banked:banked,league_id:league?.id})
  }

  // ── AUTOMATED PHASE TRANSITION ─────────────────────────────────────────────
  const advancePhase=async()=>{
    if(!confirm(`Advance to Phase ${curPhase()+1}? This will bank budgets for all players.`)) return
    setPhaseTransitioning(true)
    try{
      const completedPhase=curPhase()
      // 1. Build ceremony data before advancing
      const phaseScores=[...players].map(p=>({p,pts:calcPhasePoints(p.id,completedPhase)})).sort((a,b)=>b.pts-a.pts)
      const phaseWinner=phaseScores[0]
      const mvpHolding=rosters.filter(r=>r.phase===completedPhase&&results[r.film_id]!=null).map(r=>({r,film:films.find(f=>f.id===r.film_id),pts:calcOpeningPts(films.find(f=>f.id===r.film_id)||{},results[r.film_id]||0)})).sort((a,b)=>b.pts-a.pts)[0]
      const chipWin=allChips.find(c=>c.short_result==='win'||c.analyst_result==='win')
      const chipWinner=chipWin?players.find(p=>p.id===chipWin.player_id):null
      // 2. Bank remaining budgets for all players in current phase
      for(const p of players) await bankBudget(p.id,completedPhase)
      // 3. Advance phase, close windows
      const nextPhase=completedPhase+1
      await supabase.from('league_config').update({
        current_phase:nextPhase,
        phase_window_active:false,
        phase_window_opened_at:null,
        draft_window_open:false,
        draft_deadline:null,
      }).eq('league_id',league?.id)
      // 4. Log it
      await logActivity(session.user.id,'phase_advance',{from_phase:completedPhase,to_phase:nextPhase,league:league?.name},league?.id)
      await sendNotification('phase_advance',{league_id:league?.id,from_phase:completedPhase,to_phase:nextPhase,players:players.map(p=>({id:p.id}))})
      // 5. Show ceremony
      setPhaseCeremony({phase:completedPhase,scores:phaseScores,winner:phaseWinner,mvp:mvpHolding,chipWinner,chipWin})
      if(phaseWinner?.pts>0)triggerConfetti()
      loadData(league?.id)
    }catch(e){notify(`Phase transition failed: ${e.message}`,T.red)}
    setPhaseTransitioning(false)
  }

  // ── SCORING ──────────────────────────────────────────────────────────────────
  const filmVal=(film)=>Math.round((filmValues[film.id]??film.basePrice)*calcDemandMult(film,rosters,curPhase(),players.length))
  const isEarlyBird=(h)=>{const f=films.find(fl=>fl.id===h.film_id);return f?f.week-(h.acquired_week||h.bought_week||0)>=EARLY_BIRD_WEEKS:false}
  const auteurOn=(pid,fid)=>auteurDecl.find(a=>a.player_id===pid&&a.phase===curPhase())?.film_ids?.includes(fid)||false
  const shortBonus=(pid,fid)=>{const c=allChips.find(c=>c.player_id===pid);if(!c?.short_film_id||c.short_film_id!==fid)return 0;return c.short_result==='win'?100:c.short_result==='lose'?-30:0}
  const analystOn=(pid,fid)=>{const c=allChips.find(c=>c.player_id===pid);return c?.analyst_film_id===fid&&c?.analyst_result==='win'}
  const wwBonus=(fid)=>Object.values(wwWinners).includes(fid)?15:0
  const forecasterPhaseScore=(pid,ph)=>{
    const phFilms=films.filter(f=>f.phase===ph&&results[f.id]!=null);if(!phFilms.length)return null
    const pfc=allForecasts.filter(f=>f.player_id===pid&&phFilms.find(pf=>pf.id===f.film_id));if(!pfc.length)return null
    return pfc.reduce((s,fc)=>s+Math.abs(fc.predicted_m-results[fc.film_id])/results[fc.film_id],0)/pfc.length
  }
  const forecasterBonus=(pid,ph)=>{const sc=players.map(p=>({id:p.id,s:forecasterPhaseScore(p.id,ph)})).filter(x=>x.s!=null);if(!sc.length)return 0;return sc.reduce((a,b)=>a.s<b.s?a:b).id===pid?15:0}
  const seasonForecasterBonus=(pid)=>{const ss=players.map(p=>{const sc=[1,2,3,4,5].map(ph=>forecasterPhaseScore(p.id,ph)).filter(s=>s!=null);return{id:p.id,s:sc.length?sc.reduce((a,b)=>a+b,0)/sc.length:null}}).filter(x=>x.s!=null);if(!ss.length)return 0;return ss.reduce((a,b)=>a.s<b.s?a:b).id===pid?50:0}
  const calcPhasePoints=(pid,ph)=>{
    let t=0
    rosters.filter(r=>r.player_id===pid&&r.phase===ph&&films.find(f=>f.id===r.film_id)).forEach(h=>{
      const film=films.find(f=>f.id===h.film_id);if(!film)return
      const actual=results[film.id];if(actual==null)return
      let op=calcOpeningPts(film,actual,isEarlyBird(h),analystOn(pid,film.id))
      if(auteurOn(pid,film.id))op=Math.round(op*1.1)
      t+=op+Math.round(calcWeeklyPts(weeklyG[film.id]||{}))+calcLegsBonus(actual,weeklyG[film.id]?.[2])+wwBonus(film.id)+shortBonus(pid,film.id)
    })
    return t
  }
  const calcPoints=(pid)=>{let t=[1,2,3,4,5].reduce((s,ph)=>s+calcPhasePoints(pid,ph),0);if(oscarPreds.find(o=>o.player_id===pid)?.correct)t+=75;return t}

  // ── BUY / SELL ──────────────────────────────────────────────────────────────
  const buyFilm=async(film)=>{
    if(!profile)return notify('Create a profile first',T.red)
    const ph=curPhase()
    if(film.phase!==ph){haptic.warn();return notify(`Film is Phase ${film.phase} — you are in Phase ${ph}`,T.red)}
    if(rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active)){haptic.warn();return notify('Already in your roster',T.red)}
    if(rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length>=MAX_ROSTER){haptic.warn();return notify(`Phase roster full (${MAX_ROSTER} max)`,T.red)}
    const price=filmVal(film),left=budgetLeft(profile.id)
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
    const win=isWindow(),val=filmVal(film),fee=win?0:cfg.tx_fee,proceeds=Math.max(0,val-fee)
    await supabase.from('rosters').update({active:false,sold_price:proceeds,sold_week:cfg.current_week}).eq('id',h.id)
    await supabase.from('transactions').insert([{player_id:profile.id,film_id:film.id,type:'sell',price:proceeds,week:cfg.current_week},...(fee>0?[{player_id:profile.id,film_id:film.id,type:'fee',price:fee,week:cfg.current_week}]:[])])
    await logActivity(profile.id,'sell',{film_id:film.id,film_title:film.title,proceeds,player_name:profile.name},league?.id)
    haptic.tap()
    notify(`Dropped ${film.title} · $${proceeds}M${win?' (free)':''}`,T.gold);loadData(league?.id)
  }

  // ── TRADES ──────────────────────────────────────────────────────────────────
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

  // ── CHIPS ────────────────────────────────────────────────────────────────────
  const activateRecut=async()=>{
    if(chips?.recut_used)return notify('Recut already used',T.red)
    if(!confirm('Activate THE RECUT? Your roster clears — zero fees.'))return
    for(const h of rosters.filter(r=>r.player_id===profile.id&&r.active))
      await supabase.from('rosters').update({active:false,sold_price:filmVal(films.find(f=>f.id===h.film_id)||{}),sold_week:cfg.current_week}).eq('id',h.id)
    if(chips)await supabase.from('chips').update({recut_used:true}).eq('player_id',profile.id).eq('league_id',league?.id)
    else await supabase.from('chips').insert({player_id:profile.id,recut_used:true,league_id:league?.id})
    await logActivity(profile.id,'chip_recut',{player_name:profile.name},league?.id)
    notify('🎬 RECUT activated',T.purple);triggerConfetti();setChipModal(null);loadData(league?.id)
  }
  const activateShort=async(filmId,pred)=>{
    if(chips?.short_film_id)return notify('Short already used',T.red)
    if(allChips.find(c=>c.short_film_id===filmId))return notify('Film already shorted',T.red)
    if(chips)await supabase.from('chips').update({short_film_id:filmId,short_phase:curPhase(),short_prediction:pred}).eq('player_id',profile.id).eq('league_id',league?.id)
    else await supabase.from('chips').insert({player_id:profile.id,short_film_id:filmId,short_phase:curPhase(),short_prediction:pred,league_id:league?.id})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_short',{film_title:ft,prediction:pred,player_name:profile.name},league?.id)
    notify(`📉 SHORT on ${ft}`,T.red);triggerConfetti();setChipModal(null);loadData(league?.id)
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
  const resolveChips=async(filmId,actualM)=>{
    const film=films.find(f=>f.id===filmId);if(!film)return
    for(const c of allChips){
      if(c.short_film_id===filmId&&!c.short_result)await supabase.from('chips').update({short_result:(actualM/film.estM)<0.6?'win':'lose'}).eq('player_id',c.player_id)
      if(c.analyst_film_id===filmId&&!c.analyst_result){const within=c.analyst_prediction&&Math.abs(actualM-c.analyst_prediction)/c.analyst_prediction<=0.1;await supabase.from('chips').update({analyst_result:within?'win':'lose'}).eq('player_id',c.player_id)}
    }
  }
  const submitOscarPick=async(filmId)=>{
    if(myOscar)return notify('Already submitted',T.red)
    await supabase.from('oscar_predictions').insert({player_id:profile.id,best_picture_film_id:filmId,league_id:league?.id})
    await logActivity(profile.id,'oscar',{film_title:films.find(f=>f.id===filmId)?.title,player_name:profile.name},league?.id)
    notify(`🏆 Locked — ${films.find(f=>f.id===filmId)?.title}`,T.gold);loadData(league?.id)
  }
  const submitAuteur=async(actor,filmIds)=>{
    if(filmIds.length<2)return notify('Select at least 2 films',T.red)
    const ph=curPhase(),ex=auteurDecl.find(a=>a.player_id===profile.id&&a.phase===ph)
    if(ex)await supabase.from('auteur_declarations').update({star_actor:actor,film_ids:filmIds}).eq('id',ex.id)
    else await supabase.from('auteur_declarations').insert({player_id:profile.id,phase:ph,star_actor:actor,film_ids:filmIds,league_id:league?.id})
    await logActivity(profile.id,'auteur',{actor,film_count:filmIds.length,player_name:profile.name},league?.id)
    notify(`🎭 Auteur — ${actor} · ${filmIds.length} films`,T.orange)
    setChipModal(null);setAuteurActor('');setAuteurFilms([]);loadData(league?.id)
  }
  const saveForecast=async(filmId,predicted)=>{
    const ex=allForecasts.find(f=>f.player_id===profile.id&&f.film_id===filmId)
    if(ex)await supabase.from('forecasts').update({predicted_m:predicted}).eq('id',ex.id)
    else await supabase.from('forecasts').insert({player_id:profile.id,film_id:filmId,phase:curPhase(),predicted_m:predicted,league_id:league?.id})
    await logActivity(profile.id,'forecast',{film_title:films.find(f=>f.id===filmId)?.title,predicted_m:predicted,player_name:profile.name},league?.id)
    notify(`Forecast saved — $${predicted}M`,T.blue);loadData(league?.id)
  }

  // ── AUTH SCREENS ─────────────────────────────────────────────────────────────
  if(loading)return(<div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono}}><div style={{textAlign:'center'}}><div style={{fontSize:'52px',fontWeight:900,color:T.gold,letterSpacing:'-2px',marginBottom:'16px'}}>BOXD</div><div style={{width:'40px',height:'3px',background:T.gold,borderRadius:'2px',margin:'0 auto',animation:'pulse 1.2s ease-in-out infinite'}}/></div></div>)
  if(!session)return<Login/>
  if(!profile)return<CreateProfile session={session} onCreated={()=>{loadProfile();loadLeagues()}} notify={notify}/>

  // ── LEAGUE LOBBY ─────────────────────────────────────────────────────────────
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
          <button onClick={()=>setLeaguePage('create')} style={{...S.btn,flex:1,background:leaguePage==='create'?T.gold:T.surfaceUp,color:leaguePage==='create'?'#0D0A08':T.textSub,border:`1px solid ${leaguePage==='create'?T.gold:T.border}`,padding:'10px',fontSize:'13px',textTransform:'none',letterSpacing:0}}>+ Create League</button>
          <button onClick={()=>setLeaguePage('join')} style={{...S.btn,flex:1,background:leaguePage==='join'?T.blue:T.surfaceUp,color:leaguePage==='join'?'#fff':T.textSub,border:`1px solid ${leaguePage==='join'?T.blue:T.border}`,padding:'10px',fontSize:'13px',textTransform:'none',letterSpacing:0}}>Join League</button>
        </div>
        {leaguePage==='create'&&<div style={{animation:'fadeUp .2s ease'}}>
          <div style={{...S.label,marginBottom:'8px'}}>League Name</div>
          <input value={newLeagueName} onChange={e=>setNewLeagueName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createLeague()} placeholder="e.g. The Box Office Boyz" style={{...S.inp,marginBottom:'12px',fontSize:'15px',padding:'14px 16px'}}/>
          <Btn onClick={createLeague} color={T.gold} full size="lg">Create League</Btn>
          <div style={{fontSize:'12px',color:T.textSub,marginTop:'10px',textAlign:'center'}}>You'll get a unique invite code to share with players</div>
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

  // ── DERIVED STATE — myRoster FIRST to avoid TDZ ───────────────────────────
  const ph=curPhase()
  const win=isWindow()
  const cur=cfg.currency||'$'
  const phaseFilms=films.filter(f=>f.phase===ph)
  const myRoster=rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id))
  const myBudget=budgetLeft(profile.id)
  const pendingForMe=trades.filter(t=>t.receiver_id===profile.id&&t.status==='pending')
  const myPicks=allPicks.filter(p=>p.user_id===profile.id)
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

  const ALL_PAGES=[
    {id:'market',icon:'🎬',label:'Market'},
    {id:'roster',icon:'📁',label:'Roster'},
    {id:'chips',icon:'⚡',label:'Chips'},
    {id:'league',icon:'🥇',label:'League'},
    {id:'feed',icon:'📡',label:'Feed'},
    {id:'intent',icon:'👁️',label:'Watchlist'},
    {id:'trades',icon:'🔄',label:'Trades'},
    ...(sealedWindowOpen?[{id:'sealed',icon:'🔒',label:'Sealed Bid'}]:[]),
    {id:'forecaster',icon:'📊',label:'Forecaster'},
    {id:'oscar',icon:'🏆',label:'Oscars'},
    {id:'results',icon:'📋',label:'Results'},
    ...(isCommissioner?[{id:'commissioner',icon:'⚙️',label:'Panel'},{id:'distributor',icon:'📈',label:'Insights'}]:[])
  ]


  // ── PAGE COMPONENTS ──────────────────────────────────────────────────────────

  const MarketPage=()=>{
    const genres=['All',...Object.keys(GENRE_COL)]
    const visible=phaseFilms.filter(f=>{
      const ms=!marketSearch||f.title.toLowerCase().includes(marketSearch.toLowerCase())||f.dist.toLowerCase().includes(marketSearch.toLowerCase())
      return ms&&(marketGenre==='All'||f.genre===marketGenre)
    })

    // This Weekend — new results since last week
    const newResults=phaseFilms.filter(f=>results[f.id]!=null)
    const myNewResults=newResults.filter(f=>myRoster.find(r=>r.film_id===f.id))
    const myNewPts=myNewResults.reduce((s,f)=>{
      const h=myRoster.find(r=>r.film_id===f.id)
      if(!h)return s
      let op=calcOpeningPts(f,results[f.id],isEarlyBird(h),analystOn(profile.id,f.id))
      if(auteurOn(profile.id,f.id))op=Math.round(op*1.1)
      return s+op+Math.round(calcWeeklyPts(weeklyG[f.id]||{}))+calcLegsBonus(results[f.id],weeklyG[f.id]?.[2])+wwBonus(f.id)+shortBonus(profile.id,f.id)
    },0)
    const sorted=[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id))
    const myRank=sorted.findIndex(p=>p.id===profile.id)+1

    // Onboarding — show if player has never bought a film
    const hasEverBought=rosters.some(r=>r.player_id===profile.id)
    const [onboardingDismissed,setOnboardingDismissed]=useState(()=>localStorage.getItem('boxd_onboarded')==='1')
    const dismissOnboarding=()=>{localStorage.setItem('boxd_onboarded','1');setOnboardingDismissed(true)}

    return(
      <div>
        {/* ── ONBOARDING WELCOME ──────────────────────────────────────────── */}
        {!hasEverBought&&!onboardingDismissed&&(
          <div style={{background:`linear-gradient(135deg,${T.gold}14,${T.surface})`,border:`1px solid ${T.gold}44`,borderRadius:'16px',padding:'20px',marginBottom:'20px',position:'relative',animation:'fadeUp .3s ease'}}>
            <button onClick={dismissOnboarding} style={{position:'absolute',top:'12px',right:'12px',background:'none',border:'none',color:T.textDim,cursor:'pointer',fontSize:'16px',padding:'4px 8px'}}>✕</button>
            <div style={{fontSize:'24px',marginBottom:'8px'}}>👋</div>
            <div style={{fontSize:'16px',fontWeight:700,color:T.gold,marginBottom:'8px'}}>Welcome to BOXD</div>
            <div style={{fontSize:'13px',color:T.textSub,lineHeight:1.7,marginBottom:'14px'}}>Fantasy box office — pick films, score points, beat your league.</div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
              {[
                ['🎬','Acquire films from the current phase using your budget'],
                ['📅','Earn points based on opening weekend performance vs estimate'],
                ['⚡','Use chips — The Short, Analyst, Auteur — for big bonus pts'],
                ['🐦','Buy early (4+ weeks before release) for an Early Bird bonus'],
              ].map(([icon,text])=>(
                <div key={text} style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                  <span style={{fontSize:'14px',flexShrink:0,marginTop:'1px'}}>{icon}</span>
                  <span style={{fontSize:'12px',color:T.text,lineHeight:1.5}}>{text}</span>
                </div>
              ))}
            </div>
            <Btn onClick={dismissOnboarding} color={T.gold} full>Got it — let's play</Btn>
          </div>
        )}

        {/* ── THIS WEEKEND ────────────────────────────────────────────────── */}
        {myNewResults.length>0&&(
          <div style={{background:`linear-gradient(135deg,${T.green}10,${T.surface})`,border:`1px solid ${T.green}33`,borderRadius:'16px',padding:'18px 20px',marginBottom:'20px',animation:'fadeUp .25s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
              <div>
                <div style={{fontSize:'12px',color:T.green,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'3px'}}>Latest Results</div>
                <div style={{fontSize:'22px',fontWeight:900,color:T.green,fontFamily:T.mono,lineHeight:1}}>+<CountUp value={myNewPts}/> pts</div>
                <div style={{fontSize:'12px',color:T.textSub,marginTop:'3px'}}>from {myNewResults.length} film{myNewResults.length!==1?'s':''} · #{myRank} of {players.length}</div>
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {myNewResults.map(f=>{
                  const actual=results[f.id]
                  const ratio=actual/f.estM
                  const col=ratio>=1.1?T.green:ratio>=0.9?T.gold:T.red
                  return(
                    <div key={f.id} style={{background:T.surfaceUp,borderRadius:'10px',padding:'8px 12px',minWidth:'80px',textAlign:'center'}}>
                      <div style={{fontSize:'11px',color:T.textSub,marginBottom:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'100px'}}>{f.title.split(':')[0]}</div>
                      <div style={{fontSize:'15px',fontWeight:800,color:col,fontFamily:T.mono}}>${actual}M</div>
                      <div style={{fontSize:'10px',color:col,marginTop:'1px'}}>{ratio>=1.1?'▲':ratio>=0.9?'—':'▼'} {(ratio*100).toFixed(0)}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── RELEASE CALENDAR ────────────────────────────────────────────── */}
        {(()=>{
          // Group ALL films by week across all phases
          const allWeeks=[...new Set(films.map(f=>f.week))].sort((a,b)=>a-b)
          const calRef=React.useRef(null)
          // Auto-scroll to current week on mount
          React.useEffect(()=>{
            if(!calRef.current)return
            const el=calRef.current.querySelector(`[data-week="${cfg.current_week}"]`)
            if(el)el.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})
          },[cfg.current_week])
          if(!allWeeks.length)return null
          const minW=allWeeks[0],maxW=allWeeks[allWeeks.length-1]
          const weekRange=Array.from({length:maxW-minW+1},(_,i)=>minW+i)
          return(
            <div style={{marginBottom:'20px'}}>
              <div style={{...S.label,marginBottom:'10px',display:'flex',alignItems:'center',gap:'8px'}}>
                Release Calendar
                <span style={{color:T.textDim,fontWeight:400,fontSize:'10px',textTransform:'none',letterSpacing:0}}>· W{cfg.current_week} now</span>
              </div>
              <div ref={calRef} style={{display:'flex',gap:'0',overflowX:'auto',paddingBottom:'8px',scrollSnapType:'x mandatory',WebkitOverflowScrolling:'touch',margin:'0 -16px',padding:'0 16px 8px'}}>
                {weekRange.map(wk=>{
                  const weekFilms=films.filter(f=>f.week===wk)
                  const isPast=wk<cfg.current_week
                  const isCurrent=wk===cfg.current_week
                  const isNear=wk===cfg.current_week+1
                  return(
                    <div key={wk} data-week={wk} style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0,scrollSnapAlign:'start',position:'relative',marginRight:'2px'}}>
                      {/* Timeline track */}
                      <div style={{display:'flex',alignItems:'center',width:'100%',marginBottom:'8px',minWidth:weekFilms.length?`${weekFilms.length*72+24}px`:'52px'}}>
                        <div style={{flex:1,height:'2px',background:isPast?T.gold:isCurrent?T.green:T.border}}/>
                        <div style={{width:isCurrent?'12px':'8px',height:isCurrent?'12px':'8px',borderRadius:'50%',background:isPast?T.gold:isCurrent?T.green:isNear?T.blue:T.border,flexShrink:0,boxShadow:isCurrent?`0 0 0 3px ${T.green}33`:isNear?`0 0 0 3px ${T.blue}22`:'none',transition:'all .2s'}}/>
                        <div style={{flex:1,height:'2px',background:isPast?T.gold:T.border}}/>
                      </div>
                      {/* Week label */}
                      <div style={{fontSize:'10px',fontWeight:isCurrent?700:500,color:isCurrent?T.green:isNear?T.blue:isPast?T.gold:T.textDim,letterSpacing:'0.5px',marginBottom:'6px',background:isCurrent?`${T.green}18`:isNear?`${T.blue}12`:'transparent',padding:'2px 6px',borderRadius:'6px',whiteSpace:'nowrap'}}>
                        {isCurrent?'▶ NOW':'W'+wk}
                      </div>
                      {/* Film pills for this week */}
                      {weekFilms.length>0?(
                        <div style={{display:'flex',gap:'6px',paddingBottom:'4px'}}>
                          {weekFilms.map(f=>{
                            const owned=myRoster.find(r=>r.film_id===f.id)
                            const hasResult=results[f.id]!=null
                            const gc=GENRE_COL[f.genre]||T.textSub
                            const eb=!hasResult&&(f.week-cfg.current_week)>=EARLY_BIRD_WEEKS
                            return(
                              <div key={f.id} onClick={()=>setFilmDetail(f)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',cursor:'pointer',opacity:isPast&&!hasResult?0.5:1,transition:'opacity .15s'}}>
                                <div style={{position:'relative'}}>
                                  <FilmPoster film={f} width={56} height={84} radius={8}/>
                                  {/* Genre colour border */}
                                  <div style={{position:'absolute',inset:0,borderRadius:'8px',border:`2px solid ${owned?T.gold:hasResult?T.green:eb?T.green+'88':gc+'44'}`,pointerEvents:'none'}}/>
                                  {/* Status dot */}
                                  {hasResult&&<div style={{position:'absolute',top:'4px',right:'4px',width:'8px',height:'8px',borderRadius:'50%',background:T.green,border:`2px solid ${T.surface}`}}/>}
                                  {owned&&!hasResult&&<div style={{position:'absolute',top:'4px',right:'4px',width:'8px',height:'8px',borderRadius:'50%',background:T.gold,border:`2px solid ${T.surface}`}}/>}
                                  {eb&&!owned&&<div style={{position:'absolute',top:'4px',left:'4px'}}><span style={{fontSize:'9px'}}>🐦</span></div>}
                                </div>
                                <div style={{fontSize:'9px',color:owned?T.gold:hasResult?T.green:T.textSub,fontWeight:owned||hasResult?600:400,maxWidth:'56px',textAlign:'center',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.title.split(':')[0].split(' ').slice(0,2).join(' ')}</div>
                                {hasResult&&<div style={{fontSize:'9px',color:T.green,fontWeight:700}}>${results[f.id]}M</div>}
                                {!hasResult&&<div style={{fontSize:'9px',color:T.textDim}}>Est ${f.estM}M</div>}
                              </div>
                            )
                          })}
                        </div>
                      ):(
                        <div style={{width:'40px',height:'60px',borderRadius:'8px',border:`1px dashed ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <div style={{fontSize:'10px',color:T.textDim}}>—</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'4px'}}>
                {[['gold border','Owned'],['green dot','Scored'],['🐦','Early Bird window']].map(([icon,label])=>(
                  <div key={label} style={{display:'flex',gap:'5px',alignItems:'center',fontSize:'10px',color:T.textDim}}>
                    <span>{icon.includes('border')?<div style={{width:'10px',height:'10px',borderRadius:'2px',border:`2px solid ${T.gold}`}}/>:icon.includes('dot')?<div style={{width:'8px',height:'8px',borderRadius:'50%',background:T.green}}/>:<span style={{fontSize:'11px'}}>{icon}</span>}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{marginBottom:'20px'}}>
          <div style={{display:'flex',alignItems:'baseline',gap:'10px',marginBottom:'3px'}}>
            <div style={S.pageTitle}>Phase {ph}</div>
            <div style={{fontSize:'14px',color:T.gold,fontWeight:500}}>{PHASE_NAMES[ph]}</div>
          </div>
          <div style={{display:'flex',gap:'16px',alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:'13px',color:T.textSub}}>{cur}{myBudget}M budget · {myRoster.length}/{MAX_ROSTER} slots</span>
            {win&&<Pill color={T.orange}>🔓 Free drops · <WindowTimer openedAt={cfg.phase_window_opened_at} short/></Pill>}
          </div>
        </div>

        <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
          <input value={marketSearch} onChange={e=>setMarketSearch(e.target.value)} placeholder="Search films…" style={{...S.inp,flex:1}}/>
          <select value={marketGenre} onChange={e=>setMarketGenre(e.target.value)} style={{...S.inp,flex:'0 0 auto',width:'100px',fontSize:'12px'}}>
            {genres.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* ── FILM GRID ────────────────────────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(auto-fill,minmax(220px,1fr))',gap:'14px'}}>
          {visible.map(film=>{
            const owned=myRoster.find(r=>r.film_id===film.id)
            const val=filmVal(film),actual=results[film.id]
            const gc=GENRE_COL[film.genre]||T.textSub
            const ipo=film.basePrice,diff=(filmValues[film.id]??ipo)-ipo
            const op=actual!=null?calcOpeningPts(film,actual,owned?isEarlyBird(owned):false,analystOn(profile.id,film.id)):0
            const wp=actual!=null?Math.round(calcWeeklyPts(weeklyG[film.id]||{})):0
            const ownCount=rosters.filter(r=>r.film_id===film.id&&r.phase===ph&&r.active).length
            const demandPct=players.length?Math.round(ownCount/players.length*100):0
            const vel7=pickVelocity(film.id,allPicks,7)
            const eb=owned&&isEarlyBird(owned)
            return(
              <div key={film.id} className="hoverable film-card-tilt" style={{background:owned?`linear-gradient(155deg,${T.gold}14 0%,${T.surface} 55%)`:T.surface,border:`1px solid ${owned?T.gold+'55':T.border}`,borderRadius:'14px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
                <div style={{height:'3px',background:gc,flexShrink:0}}/>
                {/* Poster */}
                <div style={{position:'relative',cursor:'pointer',flexShrink:0}} onClick={()=>setFilmDetail(film)}>
                  <FilmPoster film={film} width="100%" height={isMobile?160:210} radius={0} imgStyle={{width:'100%'}} tilt={false} owned={!!owned} scored={actual!=null}/>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(13,10,8,0.96) 100%)'}}/>
                  {/* Price overlay */}
                  <div style={{position:'absolute',bottom:'10px',left:'12px'}}>
                    <div style={{fontSize:'20px',fontWeight:800,color:owned?T.gold:T.text,lineHeight:1,fontFamily:T.mono}}>{cur}{val}M</div>
                    {actual!=null
                      ?<div style={{fontSize:'11px',color:T.green,marginTop:'2px',fontWeight:600}}>${actual}M actual · {op+(wp||0)}pts</div>
                      :(()=>{
                        // Early bird countdown — show if within 5 weeks of cutoff
                        const weeksLeft=film.week-cfg.current_week
                        const ebCutoff=EARLY_BIRD_WEEKS
                        const isEbEligible=weeksLeft>=ebCutoff
                        const almostExpired=weeksLeft===ebCutoff
                        if(isEbEligible){
                          return <div style={{fontSize:'11px',color:almostExpired?T.orange:T.green,marginTop:'2px',fontWeight:600}}>
                            🐦 Early Bird{almostExpired?' — last week!':` · ${weeksLeft-ebCutoff+1}wk window`}
                          </div>
                        }
                        return <div style={{fontSize:'11px',color:diff>0?T.green:diff<0?T.red:T.textSub,marginTop:'2px'}}>
                          {diff===0?'—':diff>0?`▲ ${cur}${diff}`:`▼ ${cur}${Math.abs(diff)}`} IPO
                        </div>
                      })()
                    }
                  </div>
                  {/* Top badges — only the most important ones */}
                  <div style={{position:'absolute',top:'8px',right:'8px',display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-end'}}>
                    {eb&&<Badge color={T.green}>🐦 early</Badge>}
                    {film.sleeper&&!eb&&<Badge color={T.blue}>💤 sleeper</Badge>}
                    {chips?.short_film_id===film.id&&<Badge color={T.red}>📉</Badge>}
                    {chips?.analyst_film_id===film.id&&<Badge color={T.blue}>🎯</Badge>}
                  </div>
                  {/* Demand badge — bottom right */}
                  {demandPct>=25&&<div style={{position:'absolute',bottom:'10px',right:'10px'}}><Badge color={demandPct>=55?T.red:demandPct>=40?T.orange:T.gold}>{demandPct>=55?'🔥':demandPct>=40?'📈':''} {demandPct}%</Badge></div>}
                </div>

                {/* Card body */}
                <div style={{padding:'10px 12px 12px',flex:1,display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:600,lineHeight:1.3,color:T.text}}>{film.title}</div>
                    <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px',display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                      <span>{film.dist}</span>
                      {film.rt!=null&&<><span style={{color:T.textDim}}>·</span><span style={{color:film.rt>=75?T.green:film.rt>=55?T.gold:T.red}}>RT {film.rt}%</span></>}
                    </div>
                  </div>

                  {/* Estimate vs price — the key gameplay decision */}
                  <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                    <div style={{background:T.surfaceUp,borderRadius:'8px',padding:'5px 10px',flex:1,textAlign:'center'}}>
                      <div style={{fontSize:'9px',color:T.textDim,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'2px'}}>Est</div>
                      <div style={{fontSize:'13px',fontWeight:700,color:T.text,fontFamily:T.mono}}>${film.estM}M</div>
                    </div>
                    <div style={{fontSize:'16px',color:T.textDim}}>→</div>
                    <div style={{background:T.surfaceUp,borderRadius:'8px',padding:'5px 10px',flex:1,textAlign:'center'}}>
                      <div style={{fontSize:'9px',color:T.textDim,letterSpacing:'1px',textTransform:'uppercase',marginBottom:'2px'}}>Price</div>
                      <div style={{fontSize:'13px',fontWeight:700,color:owned?T.gold:T.text,fontFamily:T.mono}}>${val}M</div>
                    </div>
                    {/* Value ratio pill — green if cheap vs estimate, red if expensive */}
                    {(()=>{
                      const ratio=val/film.estM
                      const col=ratio<0.6?T.green:ratio<0.85?T.gold:ratio>1.2?T.red:T.textSub
                      const label=ratio<0.6?'cheap':ratio<0.85?'fair':ratio>1.2?'pricey':'—'
                      return <div style={{fontSize:'10px',color:col,background:`${col}18`,padding:'3px 8px',borderRadius:'8px',fontWeight:600,whiteSpace:'nowrap'}}>{label}</div>
                    })()}
                  </div>

                  {/* Single action row */}
                  <div style={{display:'flex',gap:'6px',marginTop:'auto'}}>
                    <button onClick={()=>setFilmDetail(film)} style={{...S.btn,background:T.surfaceUp,color:T.textSub,fontSize:'12px',padding:'8px 10px',flex:'0 0 auto',textTransform:'none',letterSpacing:0,gap:'4px'}}>
                      {actual!=null?'📊':'💬'}
                    </button>
                    {film.trailer?.length>5&&<button onClick={e=>{e.stopPropagation();setTrailerFilm(film)}} style={{...S.btn,background:T.surfaceUp,color:T.textSub,fontSize:'13px',padding:'8px 10px',flex:'0 0 auto'}}>▶</button>}
                    {owned
                      ?<Btn onClick={()=>sellFilm(film)} variant="outline" color={T.red} sx={{flex:1}} size="sm">Drop{win?' FREE':''}</Btn>
                      :<Btn onClick={()=>buyFilm(film)} color={T.gold} sx={{flex:1}} size="sm">Buy · {cur}{val}M</Btn>
                    }
                  </div>
                </div>
              </div>
            )
          })}
          {visible.length===0&&<div style={{gridColumn:'1/-1',...S.card,textAlign:'center',padding:'48px',color:T.textSub}}>No films match your search.</div>}
        </div>
      </div>
    )
  }

  const RosterPage=()=>{
    const totalPts=calcPhasePoints(profile.id,ph)
    const projectedPts=myRoster.reduce((s,h)=>{
      const film=films.find(f=>f.id===h.film_id);if(!film)return s
      // rough projection: estM as actual
      const proj=calcOpeningPts(film,film.estM,isEarlyBird(h),analystOn(profile.id,film.id))
      return s+proj
    },0)
    return(
    <div>
      <div style={S.pageTitle}>My Roster</div>
      <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'16px'}}>Phase {ph} · {PHASE_NAMES[ph]}</div>

      {/* Phase summary bar */}
      <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
        <div style={{flex:1,background:T.surfaceUp,borderRadius:'12px',padding:'12px 14px'}}>
          <div style={S.label}>Budget left</div>
          <div style={{fontSize:'22px',fontWeight:900,color:myBudget<20?T.red:T.green,fontFamily:T.mono,marginTop:'3px'}}>{cur}{myBudget}M</div>
          <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{myRoster.length}/{MAX_ROSTER} slots used</div>
        </div>
        <div style={{flex:1,background:T.surfaceUp,borderRadius:'12px',padding:'12px 14px'}}>
          <div style={S.label}>Phase pts</div>
          <div style={{fontSize:'22px',fontWeight:900,color:T.gold,fontFamily:T.mono,marginTop:'3px'}}><CountUp value={totalPts}/></div>
          {myRoster.filter(h=>!results[h.film_id]).length>0&&<div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>~{projectedPts} projected</div>}
        </div>
        {phaseBanked(profile.id,ph)>0&&(
          <div style={{flex:1,background:T.surfaceUp,borderRadius:'12px',padding:'12px 14px'}}>
            <div style={S.label}>Banked</div>
            <div style={{fontSize:'22px',fontWeight:900,color:T.orange,fontFamily:T.mono,marginTop:'3px'}}>{cur}{phaseBanked(profile.id,ph)}M</div>
            <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>from last phase</div>
          </div>
        )}
      </div>

      {/* Phase tabs */}
      <div style={{display:'flex',gap:'6px',marginBottom:'20px',overflowX:'auto',paddingBottom:'2px'}}>
        {[1,2,3,4,5].map(p=>{
          const pts=calcPhasePoints(profile.id,p)
          const nr=rosters.filter(r=>r.player_id===profile.id&&r.phase===p&&films.find(f=>f.id===r.film_id)).length
          return(
            <div key={p} style={{background:p===ph?`${T.gold}18`:T.surfaceUp,border:`1px solid ${p===ph?T.gold+'55':T.border}`,borderRadius:'10px',padding:'10px 14px',textAlign:'center',flexShrink:0,minWidth:'60px'}}>
              <div style={{...S.label,color:p===ph?T.gold:T.textDim,marginBottom:'4px'}}>PH{p}</div>
              <div style={{fontSize:'16px',fontWeight:700,color:p===ph?T.gold:pts>0?T.text:T.textDim}}>{pts||'—'}</div>
              <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{nr} films</div>
            </div>
          )
        })}
      </div>

      {myRoster.length===0
        ?<div style={{...S.card,textAlign:'center',padding:'48px 24px'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>🎬</div>
          <div style={{fontSize:'14px',color:T.textSub}}>No films this phase.</div>
          <div style={{fontSize:'12px',color:T.textDim,marginTop:'6px'}}>Head to Market to acquire.</div>
        </div>
        :<div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fill,minmax(340px,1fr))',gap:'10px'}}>
          {myRoster.map(h=>{
            const film=films.find(f=>f.id===h.film_id);if(!film)return null
            const val=filmVal(film),actual=results[film.id],pnl=val-h.bought_price
            const gc=GENRE_COL[film.genre]||T.textSub
            const wp=actual!=null?Math.round(calcWeeklyPts(weeklyG[film.id]||{})):0
            const eb=isEarlyBird(h),ao=analystOn(profile.id,film.id),au=auteurOn(profile.id,film.id)
            let op=actual!=null?calcOpeningPts(film,actual,eb,ao):0;if(au&&actual!=null)op=Math.round(op*1.1)
            const lb=calcLegsBonus(actual,weeklyG[film.id]?.[2]),wb=wwBonus(film.id),sb=shortBonus(profile.id,film.id)
            const total=op+wp+lb+wb+sb
            // Weeks until release
            const weeksToRelease=film.week-cfg.current_week
            const hasResult=actual!=null
            const sellProceeds=Math.max(0,val-(win?0:cfg.tx_fee))
            const sellLoss=sellProceeds-h.bought_price
            return(
              <div key={h.id} className="hoverable" style={{...S.card,display:'flex',gap:'14px',alignItems:'flex-start',cursor:hasResult?'pointer':'default',padding:'14px'}} onClick={()=>hasResult&&setScoreModal({film,holding:h})}>
                <div style={{position:'relative',flexShrink:0}}>
                  <FilmPoster film={film} width={60} height={90} radius={9}/>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:gc,borderRadius:'9px 9px 0 0'}}/>
                  {/* Week countdown badge */}
                  {!hasResult&&weeksToRelease>0&&(
                    <div style={{position:'absolute',bottom:'-6px',left:'50%',transform:'translateX(-50%)',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'2px 6px',fontSize:'9px',color:T.textSub,whiteSpace:'nowrap',fontWeight:600}}>W{film.week}</div>
                  )}
                  {hasResult&&(
                    <div style={{position:'absolute',bottom:'-6px',left:'50%',transform:'translateX(-50%)',background:T.green,borderRadius:'8px',padding:'2px 6px',fontSize:'9px',color:'#0D0A08',whiteSpace:'nowrap',fontWeight:700}}>SCORED</div>
                  )}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'14px',fontWeight:700,marginBottom:'2px',lineHeight:1.3}}>{film.title}</div>
                  <div style={{fontSize:'11px',color:T.textSub,marginBottom:'10px'}}>{film.dist} · Est ${film.estM}M</div>

                  {hasResult?(
                    // Post-result: show pts breakdown
                    <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'8px'}}>
                      <div><div style={S.label}>Actual</div><div style={{fontSize:'14px',fontWeight:700,color:T.green,marginTop:'2px'}}>${actual}M</div></div>
                      <div><div style={S.label}>Ratio</div><div style={{fontSize:'14px',fontWeight:700,color:actual/film.estM>=1?T.green:T.red,marginTop:'2px'}}>{(actual/film.estM).toFixed(2)}×</div></div>
                      <div><div style={S.label}>Points</div><div style={{fontSize:'18px',fontWeight:900,color:T.gold,marginTop:'2px',fontFamily:T.mono}}>{total}</div></div>
                    </div>
                  ):(
                    // Pre-result: show paid vs current value + sell info
                    <div style={{marginBottom:'8px'}}>
                      <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'6px'}}>
                        <div><div style={S.label}>Paid</div><div style={{fontSize:'14px',fontWeight:600,marginTop:'2px'}}>{cur}{h.bought_price}M</div></div>
                        <div><div style={S.label}>Now</div><div style={{fontSize:'14px',fontWeight:600,color:pnl>=0?T.green:T.red,marginTop:'2px'}}>{cur}{val}M</div></div>
                        <div><div style={S.label}>P&L</div><div style={{fontSize:'14px',fontWeight:700,color:pnl>=0?T.green:T.red,marginTop:'2px'}}>{pnl>=0?'+':''}{pnl}M</div></div>
                        {weeksToRelease>0&&<div><div style={S.label}>Opens</div><div style={{fontSize:'14px',fontWeight:600,color:eb?T.green:T.textSub,marginTop:'2px'}}>Wk {film.week}</div></div>}
                      </div>
                      {/* Sell warning — show if selling at a loss */}
                      {sellLoss<0&&!win&&(
                        <div style={{fontSize:'11px',color:T.red,background:`${T.red}10`,border:`1px solid ${T.red}22`,borderRadius:'7px',padding:'5px 9px'}}>
                          ⚠️ Selling now returns {cur}{sellProceeds}M — {cur}{Math.abs(sellLoss)}M loss
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap',alignItems:'center'}}>
                    {eb&&<Badge color={T.green}>🐦 early bird</Badge>}
                    {ao&&<Badge color={T.blue}>🎯 +60</Badge>}
                    {au&&<Badge color={T.orange}>🎭 +10%</Badge>}
                    {hasResult&&<span style={{fontSize:'11px',color:T.textDim}}>tap for breakdown →</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      }
    </div>
  )}

  const ChipsPage=()=>{
    const myAuteur=auteurDecl.find(a=>a.player_id===profile.id&&a.phase===ph)
    const CHIP_DEFS=[
      {
        key:'recut',icon:'🎬',label:'THE RECUT',
        tagline:'Nuclear option',
        desc:'Wipe your entire roster instantly — zero fees, full refund at market value. Use when you need to start over.',
        stakes:'Clears all films · Fees waived · Cannot be undone',
        used:recutUsed,col:T.purple,
        usedLabel:'Used this season',
        action:activateRecut
      },
      {
        key:'short',icon:'📉',label:'THE SHORT',
        tagline:'Call the bomb',
        desc:'Bet against a film. If it opens below 60% of estimate you pocket +100pts. If it overperforms, you lose 30pts.',
        stakes:'+100pts if correct · −30pts if wrong · One per season',
        used:shortUsed,col:T.red,
        usedLabel:chips?.short_result==='win'?'✅ Won +100pts':chips?.short_result==='lose'?'❌ Lost −30pts':`Active · ${films.find(f=>f.id===chips?.short_film_id)?.title||''}`,
        action:()=>setChipModal('short')
      },
      {
        key:'analyst',icon:'🎯',label:'THE ANALYST',
        tagline:'Precision prediction',
        desc:'Predict a film you own opens within ±10% of your number. Nail it and earn a flat +60pts bonus on top of everything else.',
        stakes:'+60pts if within 10% · Must own the film · One per season',
        used:analystUsed,col:T.blue,
        usedLabel:chips?.analyst_result==='win'?'✅ Won +60pts':chips?.analyst_result==='lose'?'❌ Missed':`Active · ${films.find(f=>f.id===chips?.analyst_film_id)?.title||''}`,
        action:()=>setChipModal('analyst')
      },
    ]
    const chipsUsed=[recutUsed,shortUsed,analystUsed,!!myAuteur].filter(Boolean).length
    return(
      <div>
        <div style={{marginBottom:'28px'}}>
          <div style={S.pageTitle}>⚡ Chips</div>
          <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px'}}>One of each per season · use wisely</div>
          <div style={{display:'flex',gap:'6px',marginTop:'14px'}}>
            {[recutUsed,shortUsed,analystUsed,!!myAuteur].map((used,i)=>(
              <div key={i} style={{width:'44px',height:'5px',borderRadius:'3px',background:used?[T.purple,T.red,T.blue,T.orange][i]:T.border,transition:'background .3s'}}/>
            ))}
            <div style={{fontSize:'11px',color:T.textDim,alignSelf:'center',marginLeft:'6px'}}>{chipsUsed}/4 used</div>
          </div>
        </div>

        {CHIP_DEFS.map(({key,icon,label,tagline,desc,stakes,used,col,usedLabel,action})=>(
          <div key={key} style={{marginBottom:'16px',position:'relative',overflow:'hidden',borderRadius:'16px',border:`1px solid ${used?T.border:col+'55'}`,background:used?T.surface:`linear-gradient(135deg,${col}08 0%,${T.surface} 60%)`,transition:'all .2s'}}>
            {!used&&<div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:`linear-gradient(90deg,${col},${col}44)`}}/>}
            <div style={{padding:'20px 20px 16px'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'16px',marginBottom:'14px'}}>
                <div style={{fontSize:'36px',lineHeight:1,flexShrink:0,filter:used?'grayscale(1) opacity(0.4)':'none'}}>{icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px',flexWrap:'wrap'}}>
                    <div style={{fontSize:'17px',fontWeight:800,color:used?T.textSub:col,letterSpacing:'0.5px'}}>{label}</div>
                    <div style={{fontSize:'10px',color:used?T.textDim:col,background:used?T.surfaceUp:`${col}18`,padding:'2px 8px',borderRadius:'20px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>{used?'USED':tagline}</div>
                  </div>
                  <div style={{fontSize:'13px',color:used?T.textDim:T.textSub,lineHeight:1.6,marginBottom:'10px'}}>{desc}</div>
                  <div style={{fontSize:'11px',color:used?T.textDim:col,fontWeight:500,opacity:0.8}}>{used?usedLabel:stakes}</div>
                </div>
              </div>
              {!used&&<Btn onClick={action} color={col} textColor={col===T.gold?'#0D0A08':'#fff'} full size="lg">
                Activate {label} →
              </Btn>}
            </div>
          </div>
        ))}

        {/* Auteur — special card */}
        <div style={{marginBottom:'24px',position:'relative',overflow:'hidden',borderRadius:'16px',border:`1px solid ${myAuteur?T.border:T.orange+'55'}`,background:myAuteur?T.surface:`linear-gradient(135deg,${T.orange}08 0%,${T.surface} 60%)`}}>
          {!myAuteur&&<div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:`linear-gradient(90deg,${T.orange},${T.orange}44)`}}/>}
          <div style={{padding:'20px 20px 16px'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'16px',marginBottom:'14px'}}>
              <div style={{fontSize:'36px',lineHeight:1,flexShrink:0,filter:myAuteur?'grayscale(0.3)':'none'}}>🎭</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px',flexWrap:'wrap'}}>
                  <div style={{fontSize:'17px',fontWeight:800,color:myAuteur?T.gold:T.orange,letterSpacing:'0.5px'}}>THE AUTEUR</div>
                  <div style={{fontSize:'10px',color:myAuteur?T.gold:T.orange,background:myAuteur?`${T.gold}18`:`${T.orange}18`,padding:'2px 8px',borderRadius:'20px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>{myAuteur?'ACTIVE':'Star power'}</div>
                </div>
                <div style={{fontSize:'13px',color:T.textSub,lineHeight:1.6,marginBottom:'10px'}}>Declare 2+ films sharing the same star actor. Each film earns +10% on top of its opening points — the more films the bigger the multiplier.</div>
                {myAuteur
                  ?<div style={{background:`${T.orange}12`,border:`1px solid ${T.orange}33`,borderRadius:'10px',padding:'10px 14px'}}>
                    <div style={{fontSize:'12px',color:T.orange,fontWeight:600,marginBottom:'4px'}}>⭐ {myAuteur.star_actor}</div>
                    <div style={{fontSize:'11px',color:T.textSub}}>{myAuteur.film_ids.length} films declared · +10% opening pts each</div>
                  </div>
                  :<div style={{fontSize:'11px',color:T.orange,fontWeight:500,opacity:0.8}}>+10% opening pts per film · 2+ films required · Updatable anytime</div>
                }
              </div>
            </div>
            <Btn onClick={()=>setChipModal('auteur')} color={myAuteur?T.surfaceUp:T.orange} textColor={myAuteur?T.textSub:'#0D0A08'} variant={myAuteur?'outline':'solid'} full size="lg">
              {myAuteur?'Update Auteur Declaration →':'Declare Auteur →'}
            </Btn>
          </div>
        </div>

        {/* League chip activity */}
        {allChips.filter(c=>c.player_id!==profile.id&&(c.short_film_id||c.analyst_film_id)).length>0&&(
          <div>
            <div style={{...S.label,marginBottom:'12px'}}>League Chip Activity</div>
            {allChips.filter(c=>c.player_id!==profile.id).map(c=>{
              const p=players.find(pl=>pl.id===c.player_id)
              return(
                <div key={c.id} style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
                  {c.short_film_id&&<div style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'8px 14px',fontSize:'12px',display:'flex',gap:'8px',alignItems:'center'}}>
                    <span style={{color:T.red}}>📉</span>
                    <span style={{color:p?.color||T.gold,fontWeight:600}}>{p?.name}</span>
                    <span style={{color:T.textSub}}>shorted {films.find(f=>f.id===c.short_film_id)?.title}</span>
                    {c.short_result&&<span style={{color:c.short_result==='win'?T.green:T.red,fontWeight:700}}>{c.short_result==='win'?'✅ +100':'-30'}</span>}
                  </div>}
                  {c.analyst_film_id&&<div style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'8px 14px',fontSize:'12px',display:'flex',gap:'8px',alignItems:'center'}}>
                    <span style={{color:T.blue}}>🎯</span>
                    <span style={{color:p?.color||T.gold,fontWeight:600}}>{p?.name}</span>
                    <span style={{color:T.textSub}}>analyst on {films.find(f=>f.id===c.analyst_film_id)?.title}</span>
                    {c.analyst_result&&<span style={{color:c.analyst_result==='win'?T.green:T.red,fontWeight:700}}>{c.analyst_result==='win'?'✅ +60':'❌'}</span>}
                  </div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const LeaguePage=()=>{
    const sorted=[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id))
    const leader=sorted[0],leaderPts=leader?calcPoints(leader.id):0
    const top3=sorted.slice(0,3),rest=sorted.slice(3)
    return(
      <div>
        {/* Header with share */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <div>
            <div style={S.pageTitle}>{league?.name}</div>
            <div style={{fontSize:'13px',color:T.textSub,marginTop:'3px'}}>W{cfg.current_week} · Phase {ph} · {players.length} players</div>
          </div>
          <Btn onClick={()=>setShareCardFilm('share')} color={T.surfaceUp} variant="outline" size="sm" sx={{border:`1px solid ${T.border}`,color:T.textSub}}>📤 Share</Btn>
        </div>
        {/* Podium — top 3 */}
        {sorted.length>=2&&(
          <div style={{marginBottom:'28px'}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:'10px',marginBottom:'20px',padding:'0 4px'}}>
              {/* 2nd place */}
              {top3[1]&&(()=>{const p=top3[1],pts=calcPoints(p.id),gap=leaderPts-pts;return(
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                  <div style={{fontSize:'11px',color:T.textSub,fontWeight:600}}>−{gap}pts</div>
                  <div style={{width:'44px',height:'44px',borderRadius:'50%',background:p.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:900,color:'#0D0A08',boxShadow:`0 0 0 3px ${T.surface},0 0 0 5px ${p.color||T.gold}44`}}>{p.name?.[0]}</div>
                  <div style={{fontSize:'12px',fontWeight:600,color:p.color||T.gold,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{p.name}</div>
                  <div style={{width:'100%',background:`${p.color||T.gold}22`,border:`1px solid ${p.color||T.gold}44`,borderRadius:'10px 10px 0 0',padding:'14px 8px',textAlign:'center',height:'100px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <div style={{fontSize:'28px',fontWeight:900,color:p.color||T.gold,fontFamily:T.mono,lineHeight:1}}><CountUp value={pts}/></div>
                    <div style={{...S.label,marginTop:'4px'}}>🥈</div>
                  </div>
                </div>
              )})()}
              {/* 1st place */}
              {top3[0]&&(()=>{const p=top3[0],pts=calcPoints(p.id);return(
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                  <div style={{fontSize:'22px'}}>👑</div>
                  <div style={{width:'52px',height:'52px',borderRadius:'50%',background:p.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:900,color:'#0D0A08',boxShadow:`0 0 0 3px ${T.surface},0 0 0 5px ${T.gold},0 8px 24px ${T.gold}44`}}>{p.name?.[0]}</div>
                  <div style={{fontSize:'13px',fontWeight:700,color:T.gold,textAlign:'center'}}>{p.name}</div>
                  <div style={{width:'100%',background:`${T.gold}22`,border:`1px solid ${T.gold}55`,borderRadius:'10px 10px 0 0',padding:'14px 8px',textAlign:'center',height:'130px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <div style={{fontSize:'38px',fontWeight:900,color:T.gold,fontFamily:T.mono,lineHeight:1,letterSpacing:'-1px'}}><CountUp value={pts}/></div>
                    <div style={{...S.label,color:T.gold,marginTop:'4px'}}>🥇 pts</div>
                  </div>
                </div>
              )})()}
              {/* 3rd place */}
              {top3[2]&&(()=>{const p=top3[2],pts=calcPoints(p.id),gap=leaderPts-pts;return(
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                  <div style={{fontSize:'11px',color:T.textSub,fontWeight:600}}>−{gap}pts</div>
                  <div style={{width:'40px',height:'40px',borderRadius:'50%',background:p.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:900,color:'#0D0A08',boxShadow:`0 0 0 3px ${T.surface},0 0 0 5px ${p.color||T.gold}44`}}>{p.name?.[0]}</div>
                  <div style={{fontSize:'12px',fontWeight:600,color:p.color||T.gold,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'100%'}}>{p.name}</div>
                  <div style={{width:'100%',background:`${p.color||T.gold}22`,border:`1px solid ${p.color||T.gold}44`,borderRadius:'10px 10px 0 0',padding:'14px 8px',textAlign:'center',height:'80px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <div style={{fontSize:'24px',fontWeight:900,color:p.color||T.gold,fontFamily:T.mono,lineHeight:1}}><CountUp value={pts}/></div>
                    <div style={{...S.label,marginTop:'4px'}}>🥉</div>
                  </div>
                </div>
              )})()}
            </div>
          </div>
        )}

        {/* Phase trophy strip */}
        <div style={{...S.card,marginBottom:'20px',padding:'14px 16px'}}>
          <div style={{...S.label,marginBottom:'12px'}}>Phase Leaders</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>
            {[1,2,3,4,5].map(p=>{
              const sc=[...players].map(pl=>({pl,pts:calcPhasePoints(pl.id,p)})).sort((a,b)=>b.pts-a.pts)
              const leader_=sc[0],isCur=p===ph
              return(
                <div key={p} style={{background:isCur?`${T.gold}12`:T.surfaceUp,border:`1px solid ${isCur?T.gold+'55':T.border}`,borderRadius:'10px',padding:'8px 4px',textAlign:'center',position:'relative'}}>
                  {isCur&&<div style={{position:'absolute',top:'-1px',left:'50%',transform:'translateX(-50%)',fontSize:'8px',background:T.gold,color:'#0D0A08',padding:'1px 6px',borderRadius:'0 0 5px 5px',fontWeight:700,letterSpacing:'0.5px'}}>NOW</div>}
                  <div style={{...S.label,color:isCur?T.gold:T.textDim,marginBottom:'6px',marginTop:isCur?'6px':'0'}}>PH{p}</div>
                  {leader_?.pts>0
                    ?<><div style={{fontSize:'10px',fontWeight:700,color:players.find(pl=>pl.id===leader_.pl.id)?.color||T.gold,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'0 4px'}}>{leader_.pl.name.split(' ')[0]}</div>
                    <div style={{fontSize:'15px',fontWeight:800,color:isCur?T.gold:T.text,marginTop:'2px',fontFamily:T.mono}}>{leader_.pts}</div></>
                    :<div style={{fontSize:'12px',color:T.textDim,padding:'6px 0'}}>—</div>
                  }
                </div>
              )
            })}
          </div>
        </div>

        {/* Full standings — rest of players */}
        {rest.length>0&&(
          <div style={{marginBottom:'8px'}}>
            <div style={{...S.label,marginBottom:'10px'}}>Full Standings</div>
            {sorted.map((player,i)=>{
              const pts=calcPoints(player.id)
              const gap=leaderPts-pts
              const pc=allChips.find(c=>c.player_id===player.id)
              const pa=auteurDecl.find(a=>a.player_id===player.id&&a.phase===ph)
              const barW=leaderPts>0?Math.round((pts/leaderPts)*100):0
              return(
                <div key={player.id} className="hoverable" style={{...S.card,marginBottom:'8px',cursor:'pointer',padding:'14px 16px'}} onClick={()=>goToProfile(player)}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
                    <div style={{fontSize:'18px',minWidth:'24px',textAlign:'center'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:player.color||T.gold,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:900,color:'#0D0A08'}}>{player.name?.[0]||'?'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'14px',fontWeight:600,color:player.color||T.gold,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.name}</div>
                      <div style={{display:'flex',gap:'6px',marginTop:'2px',flexWrap:'wrap',alignItems:'center'}}>
                        <span style={{fontSize:'11px',color:T.textSub}}>Ph{ph}: {calcPhasePoints(player.id,ph)}pts</span>
                        <span style={{fontSize:'10px',color:T.textDim}}>·</span>
                        <span style={{fontSize:'11px',color:T.textSub}}>{cur}{budgetLeft(player.id)} left</span>
                        {pc?.recut_used&&<span style={{fontSize:'10px',background:`${T.purple}22`,color:T.purple,padding:'1px 6px',borderRadius:'8px'}}>🎬</span>}
                        {pc?.short_film_id&&<span style={{fontSize:'10px',background:`${T.red}22`,color:T.red,padding:'1px 6px',borderRadius:'8px'}}>📉</span>}
                        {pc?.analyst_film_id&&<span style={{fontSize:'10px',background:`${T.blue}22`,color:T.blue,padding:'1px 6px',borderRadius:'8px'}}>🎯</span>}
                        {pa&&<span style={{fontSize:'10px',background:`${T.orange}22`,color:T.orange,padding:'1px 6px',borderRadius:'8px'}}>🎭</span>}
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:'26px',fontWeight:900,color:i===0?T.gold:T.text,lineHeight:1,fontFamily:T.mono}}><CountUp value={pts}/></div>
                      {i>0&&<div style={{fontSize:'10px',color:T.textDim,marginTop:'1px'}}>−{gap}</div>}
                    </div>
                  </div>
                  {/* Score bar */}
                  <div style={{height:'3px',background:T.border,borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${barW}%`,background:`linear-gradient(90deg,${player.color||T.gold},${player.color||T.gold}88)`,borderRadius:'2px',transition:'width .6s ease'}}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {sorted.length===0&&<div style={{...S.card,textAlign:'center',padding:'48px',color:T.textSub}}>No players yet — invite your league!</div>}
      </div>
    )
  }

  const FeedPage=()=>{
    const getItem=item=>{
      const p=item.payload||{},pl=players.find(pl=>pl.id===item.user_id)
      const pCol=pl?.color||T.gold
      const film=films.find(f=>f.id===p.film_id)
      switch(item.type){
        case 'buy':return{icon:'🎬',col:T.green,film,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> acquired</>,
          sub:<><b style={{color:T.text}}>{p.film_title}</b> · <span style={{color:T.green,fontWeight:600}}>${p.price}M</span></>}
        case 'sell':return{icon:'💸',col:T.gold,film,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> dropped</>,
          sub:<b style={{color:T.text}}>{p.film_title}</b>}
        case 'chip_recut':return{icon:'🎬',col:T.purple,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> activated</>,
          sub:<span style={{color:T.purple,fontWeight:700}}>THE RECUT — full roster cleared</span>}
        case 'chip_short':return{icon:'📉',col:T.red,film,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> shorted</>,
          sub:<><b style={{color:T.text}}>{p.film_title}</b> · calling under ${p.prediction}M</>}
        case 'chip_analyst':return{icon:'🎯',col:T.blue,film,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> went Analyst</>,
          sub:<><b style={{color:T.text}}>{p.film_title}</b> · predicting ${p.prediction}M</>}
        case 'auteur':return{icon:'🎭',col:T.orange,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> declared Auteur</>,
          sub:<>⭐ <span style={{color:T.orange,fontWeight:600}}>{p.actor}</span> · {p.film_count} films</>}
        case 'forecast':return{icon:'📊',col:T.blue,film,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> forecast</>,
          sub:<><b style={{color:T.text}}>{p.film_title}</b> · ${p.predicted_m}M</>}
        case 'oscar':return{icon:'🏆',col:T.gold,film,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> locked Best Picture</>,
          sub:<span style={{color:T.gold,fontWeight:600}}>{p.film_title}</span>}
        case 'result':return{icon:'📋',col:T.green,film,
          title:<span style={{color:T.green,fontWeight:700}}>Results in</span>,
          sub:<><b style={{color:T.text}}>{p.film_title}</b> · <span style={{color:T.green}}>${p.actual_m}M</span> opening</>}
        case 'trade_proposed':return{icon:'🔄',col:T.blue,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> proposed a trade</>,
          sub:<span style={{color:T.textSub}}>waiting for response…</span>}
        case 'trade_accepted':return{icon:'🤝',col:T.green,
          title:<><span style={{color:pCol,fontWeight:700}}>{pl?.name}</span> accepted a trade</>,
          sub:<><span style={{color:T.green}}>{p.film_received}</span> → roster</>}
        default:return{icon:'📡',col:T.textSub,
          title:<span style={{color:pCol,fontWeight:700}}>{pl?.name||'League'}</span>,sub:null}
      }
    }
    const grouped=feedItems.reduce((acc,item)=>{
      const day=new Date(item.created_at).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})
      if(!acc[day])acc[day]=[]
      acc[day].push(item)
      return acc
    },{})
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
          <div>
            <div style={S.pageTitle}>📡 Feed</div>
            <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px'}}>Live · {feedItems.length} events</div>
          </div>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:T.green,marginTop:'8px',boxShadow:`0 0 0 3px ${T.green}33`,animation:'pulse 2s ease-in-out infinite'}}/>
        </div>
        {feedItems.length===0&&(
          <div style={{...S.card,textAlign:'center',padding:'48px 24px'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>📡</div>
            <div style={{fontSize:'14px',color:T.textSub}}>No activity yet — be the first to make a move</div>
          </div>
        )}
        {Object.entries(grouped).map(([day,items])=>(
          <div key={day}>
            <div style={{...S.label,margin:'20px 0 10px',display:'flex',alignItems:'center',gap:'8px'}}>
              {day}
              <div style={{flex:1,height:'1px',background:T.border}}/>
            </div>
            {items.map(item=>{
              const{icon,title,sub,col,film}=getItem(item)
              return(
                <div key={item.id} style={{...S.card,padding:'12px 14px',marginBottom:'8px',borderLeft:`3px solid ${col}55`,display:'flex',gap:'12px',alignItems:'center'}}>
                  {film
                    ?<div style={{flexShrink:0,cursor:'pointer'}} onClick={()=>setFilmDetail(film)}>
                      <FilmPoster film={film} width={36} height={54} radius={6}/>
                    </div>
                    :<div style={{width:'36px',height:'54px',borderRadius:'6px',background:`${col}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>{icon}</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',lineHeight:1.5,color:T.text}}>{title}</div>
                    {sub&&<div style={{fontSize:'12px',color:T.textSub,marginTop:'2px',lineHeight:1.4}}>{sub}</div>}
                    <div style={{fontSize:'10px',color:T.textDim,marginTop:'4px'}}>{timeAgo(item.created_at)} ago</div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const IntentPage=()=>{
    const myPickedFilms=myPicks.map(p=>films.find(f=>f.id===p.film_id)).filter(Boolean)
    const sorted=[...myPickedFilms].sort((a,b)=>pickVelocity(b.id,allPicks,7)-pickVelocity(a.id,allPicks,7))
    return(
      <div>
        <div style={S.pageTitle}>👁️ My Watchlist</div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Films you want to see · {myPicks.length} picked</div>
        {sorted.length===0&&<div style={{...S.card,textAlign:'center',padding:'48px 24px'}}><div style={{fontSize:'40px',marginBottom:'12px'}}>👁</div><div style={{fontSize:'15px',fontWeight:600,marginBottom:'8px'}}>Your watchlist is empty</div><div style={{fontSize:'13px',color:T.textSub}}>Tap 👁 on any film card to add it here</div></div>}
        {sorted.map(film=>{
          const vel7=pickVelocity(film.id,allPicks,7),vel1=pickVelocity(film.id,allPicks,1)
          const total=allPicks.filter(p=>p.film_id===film.id).length,actual=results[film.id]
          const gc=GENRE_COL[film.genre]||T.textSub
          return(
            <div key={film.id} style={{...S.card,marginBottom:'12px'}}>
              <div style={{display:'flex',gap:'14px',alignItems:'flex-start',marginBottom:'14px'}}>
                <div style={{position:'relative',flexShrink:0,cursor:'pointer'}} onClick={()=>setFilmDetail(film)}>
                  <FilmPoster film={film} width={64} height={96} radius={9}/>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:gc,borderRadius:'9px 9px 0 0'}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'15px',fontWeight:700,lineHeight:1.3,marginBottom:'3px'}}>{film.title}</div>
                  <div style={{fontSize:'12px',color:T.textSub,marginBottom:'10px'}}>{film.dist} · {film.genre} · W{film.week}</div>
                  <div style={{display:'flex',gap:'6px',marginBottom:'10px',flexWrap:'wrap'}}>
                    <StatBox label="Picks" value={total} color={T.gold}/>
                    <StatBox label="7d" value={vel7} color={vel7>=5?T.red:vel7>=2?T.orange:T.text}/>
                    {vel1>0&&<StatBox label="Today" value={vel1} color={T.green}/>}
                  </div>
                  {actual!=null&&<div style={{fontSize:'13px',color:T.green,fontWeight:600,marginBottom:'6px'}}>${actual}M actual · {calcOpeningPts(film,actual)}pts</div>}
                </div>
                <PickButton filmId={film.id} userId={profile.id} allPicks={allPicks} onToggle={togglePick}/>
              </div>
              <button onClick={()=>setShowtimesFilm(film)} style={{...S.btn,background:`${T.green}18`,border:`1px solid ${T.green}44`,color:T.green,padding:'9px 16px',fontSize:'12px',width:'100%',marginBottom:'10px',textTransform:'none',letterSpacing:0,borderRadius:'9px'}}>🎟 Find Showtimes Near Me</button>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {BOOKING_CHAINS.map(chain=><a key={chain.id} href={`${chain.url}${encodeURIComponent(film.title.toLowerCase().replace(/\s+/g,'-'))}`} target="_blank" rel="noopener noreferrer" onClick={()=>trackBookingClick(film.id,chain.id)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'7px 12px',textDecoration:'none',fontSize:'11px',color:T.text,fontFamily:T.mono,display:'flex',alignItems:'center',gap:'5px'}}><span style={{width:'6px',height:'6px',borderRadius:'50%',background:chain.color,flexShrink:0}}/>{chain.label}</a>)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const TradesPage=()=>{
    const myProposed=trades.filter(t=>t.proposer_id===profile.id)
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
          <div><div style={S.pageTitle}>Trades</div><div style={{fontSize:'13px',color:T.textSub,marginTop:'4px'}}>Phase {ph} films · instant on acceptance</div></div>
          <Btn onClick={()=>setTradeModal(true)} color={T.blue} textColor="#fff">+ Propose</Btn>
        </div>
        {pendingForMe.length>0&&<div style={{...S.card,border:`1px solid ${T.blue}44`,marginBottom:'20px'}}>
          <div style={{fontSize:'13px',color:T.blue,fontWeight:600,marginBottom:'14px'}}>📬 Incoming ({pendingForMe.length})</div>
          {pendingForMe.map(t=>{
            const proposer=players.find(p=>p.id===t.proposer_id),theirFilm=films.find(f=>f.id===t.proposer_film_id),myFilm_=films.find(f=>f.id===t.receiver_film_id)
            return(
              <div key={t.id} style={{background:T.surfaceUp,borderRadius:'12px',padding:'14px',marginBottom:'10px'}}>
                <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'12px'}}>
                  <FilmPoster film={theirFilm} width={40} height={60} radius={6}/>
                  <div style={{flex:1,fontSize:'13px',lineHeight:1.6}}><span style={{color:proposer?.color||T.gold,fontWeight:600}}>{proposer?.name}</span><span style={{color:T.textSub}}> offers </span><span style={{color:T.blue,fontWeight:500}}>{theirFilm?.title}</span><span style={{color:T.textSub}}> for your </span><span style={{color:T.gold,fontWeight:500}}>{myFilm_?.title}</span></div>
                  <FilmPoster film={myFilm_} width={40} height={60} radius={6}/>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <Btn onClick={()=>acceptTrade(t)} color={T.green} textColor="#0D0A08" sx={{flex:1}}>Accept</Btn>
                  <Btn onClick={()=>rejectTrade(t)} variant="outline" color={T.red} sx={{flex:1}}>Decline</Btn>
                </div>
              </div>
            )
          })}
        </div>}
        {myProposed.length>0&&<div>
          <div style={{...S.sectionTitle,marginBottom:'12px'}}>My Proposals</div>
          {myProposed.map(t=>{
            const receiver=players.find(p=>p.id===t.receiver_id),mf=films.find(f=>f.id===t.proposer_film_id),tf=films.find(f=>f.id===t.receiver_film_id)
            const sc={accepted:T.green,rejected:T.red,cancelled:T.textDim,pending:T.blue}[t.status]||T.textSub
            return(
              <div key={t.id} style={{...S.card,marginBottom:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}><span style={{fontSize:'13px',color:receiver?.color||T.gold,fontWeight:600}}>{receiver?.name}</span><Pill color={sc}>{t.status}</Pill></div>
                <div style={{fontSize:'13px',color:T.textSub}}>Give <span style={{color:T.text}}>{mf?.title}</span> · Get <span style={{color:T.text}}>{tf?.title}</span></div>
                <div style={{fontSize:'11px',color:T.textDim,marginTop:'5px'}}>{timeAgo(t.created_at)} ago</div>
                {t.status==='pending'&&<Btn onClick={()=>cancelTrade(t)} variant="outline" color={T.textSub} size="sm" sx={{marginTop:'10px'}}>Cancel</Btn>}
              </div>
            )
          })}
        </div>}
        {myProposed.length===0&&pendingForMe.length===0&&<div style={{...S.card,textAlign:'center',padding:'48px 24px'}}><div style={{fontSize:'32px',marginBottom:'12px'}}>🔄</div><div style={{fontSize:'14px',color:T.textSub}}>No trades yet — propose one above!</div></div>}
      </div>
    )
  }

  const ForecasterPage=()=>{
    const[fcTab,setFcTab]=useState('predict')
    // Standalone accuracy score — lower is better (mean absolute % error)
    const fcScore=(pid)=>{
      const scored=films.filter(f=>results[f.id]!=null)
      const preds=allForecasts.filter(f=>f.player_id===pid&&scored.find(sf=>sf.id===f.film_id))
      if(!preds.length)return null
      return Math.round(preds.reduce((s,fc)=>s+Math.abs(fc.predicted_m-results[fc.film_id])/results[fc.film_id]*100,0)/preds.length)
    }
    const leaderboard=[...players].map(p=>({p,score:fcScore(p.id),count:allForecasts.filter(f=>f.player_id===p.id).length})).filter(x=>x.score!=null).sort((a,b)=>a.score-b.score)
    const myScore=fcScore(profile.id)
    const myRank=leaderboard.findIndex(x=>x.p.id===profile.id)+1
    const upcomingFilms=films.filter(f=>!results[f.id])
    const resultedFilms=films.filter(f=>results[f.id]!=null)
    return(
      <div>
        <div style={{display:'flex',alignItems:'baseline',gap:'10px',marginBottom:'3px'}}>
          <div style={S.pageTitle}>📊 Forecaster</div>
          <Badge color={T.blue}>Side Game</Badge>
        </div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'4px'}}>Predict opening weekends · separate from main league standings</div>
        <div style={{fontSize:'12px',color:T.textDim,marginBottom:'20px'}}>Accuracy scored as mean absolute % error — lower is better</div>

        {/* My score card */}
        {myScore!=null&&<div style={{...S.card,border:`1px solid ${T.blue}44`,marginBottom:'20px',display:'flex',gap:'20px',alignItems:'center'}}>
          <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:'48px',fontWeight:900,color:myScore<=10?T.green:myScore<=25?T.gold:T.red,lineHeight:1,fontFamily:T.mono}}>{myScore}%</div>
            <div style={{...S.label,marginTop:'4px'}}>avg error</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:700,marginBottom:'6px'}}>Your Forecasting Record</div>
            <div style={{fontSize:'13px',color:T.textSub,marginBottom:'4px'}}>{allForecasts.filter(f=>f.player_id===profile.id).length} predictions made · {allForecasts.filter(f=>f.player_id===profile.id&&results[f.film_id]!=null&&Math.abs(f.predicted_m-results[f.film_id])/results[f.film_id]<=0.1).length} within 10%</div>
            {myRank>0&&<div style={{fontSize:'13px',color:myRank===1?T.gold:T.textSub}}>#{myRank} of {leaderboard.length} forecasters</div>}
          </div>
        </div>}

        {/* Tab bar */}
        <div style={{display:'flex',borderBottom:`1px solid ${T.border}`,marginBottom:'20px'}}>
          {[['predict','🎯 Make Picks'],['results','📋 Results'],['board','🏆 Leaderboard']].map(([id,label])=>(
            <button key={id} onClick={()=>setFcTab(id)} style={{...S.btn,background:'none',border:'none',fontSize:'13px',fontWeight:fcTab===id?700:400,color:fcTab===id?T.blue:T.textSub,padding:'10px 16px',borderBottom:`2px solid ${fcTab===id?T.blue:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0}}>{label}</button>
          ))}
        </div>

        {fcTab==='predict'&&<div>
          {upcomingFilms.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>All films have results — nothing left to predict.</div>}
          {upcomingFilms.map(film=>{
            const fc=forecasts[film.id]
            const gc=GENRE_COL[film.genre]||T.textSub
            return(
              <div key={film.id} style={{...S.card,display:'flex',gap:'14px',alignItems:'center',marginBottom:'10px',flexWrap:'wrap'}}>
                <FilmPoster film={film} width={44} height={66} radius={7}/>
                <div style={{flex:2,minWidth:'140px'}}>
                  <div style={{fontSize:'14px',fontWeight:600,marginBottom:'3px'}}>{film.title}</div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <Pill color={gc}>{film.genre}</Pill>
                    <Pill color={T.textSub}>Est ${film.estM}M</Pill>
                    <Pill color={T.textSub}>W{film.week}</Pill>
                  </div>
                </div>
                <div style={{display:'flex',gap:'8px',alignItems:'center',flexShrink:0}}>
                  <input type="number" step="0.1" defaultValue={fc||''} placeholder="$M prediction" id={`fc-${film.id}`} style={{...S.inp,width:'130px'}}/>
                  <Btn color={T.blue} textColor="#fff" onClick={()=>{const v=parseFloat(document.getElementById(`fc-${film.id}`).value);if(isNaN(v))return notify('Enter a number',T.red);saveForecast(film.id,v)}}>Lock</Btn>
                </div>
                {fc&&<div style={{width:'100%',fontSize:'12px',color:T.blue,paddingLeft:'58px'}}>🔒 Locked at ${fc}M</div>}
              </div>
            )
          })}
        </div>}

        {fcTab==='results'&&<div>
          {resultedFilms.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No results yet.</div>}
          {resultedFilms.map(film=>{
            const actual=results[film.id]
            const pfc=allForecasts.filter(f=>f.film_id===film.id).map(fc=>{
              const p=players.find(pl=>pl.id===fc.player_id)
              const pct=Math.round(Math.abs(fc.predicted_m-actual)/actual*100)
              return{...fc,p,pct}
            }).sort((a,b)=>a.pct-b.pct)
            const gc=GENRE_COL[film.genre]||T.textSub
            return(
              <div key={film.id} style={{...S.card,marginBottom:'12px'}}>
                <div style={{display:'flex',gap:'14px',alignItems:'center',marginBottom:'12px'}}>
                  <FilmPoster film={film} width={40} height={60} radius={6}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px',fontWeight:600}}>{film.title}</div>
                    <div style={{fontSize:'13px',color:T.green,fontWeight:700,marginTop:'2px'}}>Actual: ${actual}M <span style={{color:T.textSub,fontWeight:400}}>· Est was ${film.estM}M</span></div>
                  </div>
                </div>
                {pfc.length>0?<div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {pfc.map((fc,i)=>(
                    <div key={fc.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',background:i===0?`${T.green}12`:T.surfaceUp,borderRadius:'9px',border:`1px solid ${i===0?T.green+'44':T.border}`}}>
                      {i===0&&<span style={{fontSize:'14px'}}>🎯</span>}
                      <div style={{width:'24px',height:'24px',borderRadius:'50%',background:fc.p?.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:900,color:'#0D0A08',flexShrink:0}}>{fc.p?.name?.[0]}</div>
                      <div style={{flex:1,fontSize:'13px',color:fc.p?.color||T.gold,fontWeight:500}}>{fc.p?.name}</div>
                      <div style={{fontSize:'13px',color:T.textSub}}>${fc.predicted_m}M</div>
                      <div style={{fontSize:'13px',fontWeight:700,color:fc.pct<=5?T.green:fc.pct<=15?T.gold:T.red,minWidth:'50px',textAlign:'right'}}>{fc.pct<=5?'🎯 ':''}{fc.pct}% off</div>
                    </div>
                  ))}
                </div>:<div style={{fontSize:'12px',color:T.textSub}}>No predictions made</div>}
              </div>
            )
          })}
        </div>}

        {fcTab==='board'&&<div>
          <div style={{...S.card,border:`1px solid ${T.blue}33`,marginBottom:'16px',padding:'16px 20px'}}>
            <div style={{fontSize:'12px',color:T.textSub,lineHeight:1.6}}>Ranked by mean absolute % error across all predicted films. Lower = more accurate. Only players with at least one prediction are shown.</div>
          </div>
          {leaderboard.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>No predictions yet — be the first to forecast!</div>}
          {leaderboard.map(({p,score,count},i)=>(
            <div key={p.id} style={{...S.card,display:'flex',alignItems:'center',gap:'14px',marginBottom:'8px',border:`1px solid ${i===0?T.gold+'44':T.border}`}}>
              <div style={{fontSize:'22px',minWidth:'28px',textAlign:'center'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
              <div style={{width:'34px',height:'34px',borderRadius:'50%',background:p.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:900,color:'#0D0A08',flexShrink:0}}>{p.name?.[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:600,color:p.color||T.gold}}>{p.name}</div>
                <div style={{fontSize:'12px',color:T.textSub,marginTop:'2px'}}>{count} prediction{count!==1?'s':''}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'28px',fontWeight:900,color:score<=10?T.green:score<=25?T.gold:T.red,fontFamily:T.mono,lineHeight:1}}>{score}%</div>
                <div style={{...S.label,marginTop:'2px'}}>avg error</div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    )
  }

  const OscarPage=()=>(
    <div>
      <div style={S.pageTitle}>🏆 Oscars</div>
      <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Predict Best Picture · correct = +75pts</div>
      {myOscar?<div style={{...S.card,border:`1px solid ${T.gold}44`,marginBottom:'20px'}}>
        <div style={{...S.label,marginBottom:'12px'}}>Your Pick</div>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <FilmPoster film={films.find(f=>f.id===myOscar.best_picture_film_id)} width={56} height={84} radius={8}/>
          <div><div style={{fontSize:'18px',fontWeight:700,color:T.gold}}>{films.find(f=>f.id===myOscar.best_picture_film_id)?.title||'—'}</div><div style={{fontSize:'13px',color:T.textSub,marginTop:'6px'}}>{myOscar.correct===true?'✅ CORRECT — +75pts':myOscar.correct===false?'❌ Incorrect':'Awaiting Oscar night'}</div></div>
        </div>
      </div>:<div style={{...S.card,marginBottom:'20px'}}>
        <div style={{fontSize:'13px',color:T.textSub,marginBottom:'14px'}}>Locks immediately — cannot be changed</div>
        <select id="oscar-pick" style={{...S.inp,marginBottom:'14px'}}><option value="">Select a film…</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
        <Btn onClick={()=>{const id=document.getElementById('oscar-pick').value;if(!id)return notify('Select a film',T.red);submitOscarPick(id)}} color={T.gold} full size="lg">🏆 Lock In</Btn>
      </div>}
      {oscarPreds.length>0&&<div>
        <div style={{...S.sectionTitle,marginBottom:'12px'}}>All Picks</div>
        {oscarPreds.map(op=>{const p=players.find(pl=>pl.id===op.player_id),f=films.find(fl=>fl.id===op.best_picture_film_id);return(
          <div key={op.id} style={{...S.card,display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <FilmPoster film={f} width={32} height={48} radius={6}/>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:p?.color||T.gold,flexShrink:0}}/>
            <div style={{flex:1,fontSize:'13px',color:p?.color||T.gold,fontWeight:500}}>{p?.name}</div>
            <div style={{fontSize:'13px',color:T.text}}>{f?.title||'—'}</div>
            {op.correct===true&&<span style={{color:T.green}}>✅ +75</span>}
            {op.correct===false&&<span style={{color:T.red}}>❌</span>}
          </div>
        )})}
      </div>}
    </div>
  )

  const ResultsPage=()=>(
    <div>
      <div style={S.pageTitle}>Enter Results</div>
      <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Opening weekend · weekly grosses · weekend #1</div>
      {films.map(film=>{
        const actual=results[film.id],weeks=weeklyG[film.id]||{},lb=calcLegsBonus(actual,weeks[2]),isWinner=wwWinners[film.week]===film.id
        return(
          <div key={film.id} style={{...S.card,marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
              <FilmPoster film={film} width={32} height={48} radius={6}/>
              <div style={{flex:2,minWidth:'120px'}}><div style={{fontSize:'13px',fontWeight:500}}>{film.title} {isWinner&&'🥇'}</div><div style={{fontSize:'11px',color:T.textSub}}>Est ${film.estM}M · Ph{film.phase} W{film.week}</div></div>
              <input type="number" step="0.1" defaultValue={actual||''} placeholder="Opening $M" id={`res-${film.id}`} style={{...S.inp,width:'110px'}}/>
              <Btn color={T.green} textColor="#0D0A08" onClick={async()=>{
                const v=parseFloat(document.getElementById(`res-${film.id}`).value);if(isNaN(v))return notify('Enter a number',T.red)
                const nv=calcMarketValue(film,v)
                await dbUpsert('results','film_id',film.id,{actual_m:v})
                await dbUpsert('film_values','film_id',film.id,{current_value:nv})
                await resolveChips(film.id,v)
                await logActivity(session.user.id,'result',{film_title:film.title,actual_m:v})
                await sendNotification('result_in',{film_title:film.title,actual_m:v,players:players.map(p=>({id:p.id}))})
                notify(`✅ ${film.title} · $${nv} · ${calcOpeningPts(film,v)}pts`,T.gold);loadData(league?.id)
              }}>Save</Btn>
              <button style={{...S.btn,background:isWinner?T.gold:T.surfaceUp,border:isWinner?'none':`1px solid ${T.border}`,color:isWinner?'#0D0A08':T.textSub,fontSize:'12px',padding:'9px 12px'}} onClick={async()=>{
                if(isWinner){await supabase.from('weekend_winners').delete().eq('week',film.week)}
                else{const ex=await supabase.from('weekend_winners').select('id').eq('week',film.week).maybeSingle();if(ex.data)await supabase.from('weekend_winners').update({film_id:film.id,phase:ph}).eq('week',film.week);else await supabase.from('weekend_winners').insert({film_id:film.id,week:film.week,phase:ph,league_id:league?.id})}
                notify(isWinner?'Removed':`🥇 ${film.title} · +15pts`,T.gold);loadData(league?.id)
              }}>{isWinner?'🥇 #1':'#1?'}</button>
              {actual!=null&&<span style={{fontSize:'12px',color:T.green}}>${actual}M → ${filmVal(film)}M · {calcOpeningPts(film,actual)}pts</span>}
            </div>
            {actual!=null&&<div style={{borderTop:`1px solid ${T.border}`,paddingTop:'12px',marginTop:'12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}}><div style={S.label}>Weekly Grosses</div>{lb>0&&<Badge color={T.green}>🦵 Legs +25pts</Badge>}</div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {[2,3,4,5,6,7,8].map(wk=>{const rate=wk>=4?1.1:1;return(
                  <div key={wk} style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'center'}}>
                    <div style={{fontSize:'10px',color:T.textDim}}>W{wk}{wk>=4?'×1.1':''}</div>
                    <input type="number" step="0.1" placeholder="$M" defaultValue={weeks[wk]||''} id={`wk-${film.id}-${wk}`} style={{...S.inp,width:'60px',fontSize:'11px',padding:'5px 6px'}}/>
                    <button style={{...S.btn,background:T.surfaceUp,border:`1px solid ${T.border}`,color:T.textSub,fontSize:'9px',padding:'3px 6px'}} onClick={async()=>{const v=parseFloat(document.getElementById(`wk-${film.id}-${wk}`).value);if(isNaN(v))return;await dbUpsertWeekly(film.id,wk,v);notify(`W${wk} saved`,T.gold);loadData(league?.id)}}>Save</button>
                    {weeks[wk]&&<div style={{fontSize:'10px',color:T.blue}}>+{Math.round(Number(weeks[wk])*rate)}</div>}
                  </div>
                )})}
              </div>
            </div>}
          </div>
        )
      })}
    </div>
  )

  const SealedBidPage=()=>{
    const[bidAmount,setBidAmount]=useState('')
    const[selFilm,setSelFilm]=useState(phaseFilms[0]?.id||'')
    const allBids=sealedBids.filter(b=>b.league_id===league?.id)
    const myBid=allBids.find(b=>b.player_id===profile.id&&b.status==='pending')
    const deadline=sealedWindowDeadline?new Date(sealedWindowDeadline):null
    const submitBid=async()=>{
      if(!selFilm||!bidAmount)return notify('Select film and enter bid',T.red)
      const amt=parseFloat(bidAmount)
      if(isNaN(amt)||amt<=0)return notify('Invalid amount',T.red)
      if(amt>myBudget)return notify(`Over budget — ${cur}${myBudget}M available`,T.red)
      if(myBid){await supabase.from('sealed_bids').update({film_id:selFilm,amount:amt,updated_at:new Date().toISOString()}).eq('id',myBid.id)}
      else{await supabase.from('sealed_bids').insert({player_id:profile.id,film_id:selFilm,amount:amt,phase:ph,league_id:league?.id,status:'pending'})}
      notify(`🔒 Bid locked — ${cur}${amt}M`,T.purple);setBidAmount('');loadData(league?.id)
    }
    const cancelBid=async()=>{if(!myBid)return;await supabase.from('sealed_bids').update({status:'cancelled'}).eq('id',myBid.id);notify('Bid cancelled',T.textSub);loadData(league?.id)}
    return(
      <div>
        <div style={S.pageTitle}>🔒 Sealed Bid</div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Blind IPO auction — highest bid wins the film at their price</div>
        {deadline&&<div style={{...S.card,border:`1px solid ${T.purple}44`,marginBottom:'20px',display:'flex',gap:'16px',alignItems:'center'}}>
          <div style={{fontSize:'28px'}}>⏱</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:600,color:T.purple,marginBottom:'3px'}}>Bidding closes</div>
            <div style={{fontSize:'12px',color:T.textSub}}>{deadline.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
          <DraftTimer deadline={sealedWindowDeadline} shortfall={0} draftMin={0}/>
        </div>}
        {myBid?<div style={{...S.card,border:`1px solid ${T.purple}55`,marginBottom:'20px'}}>
          <div style={{...S.label,color:T.purple,marginBottom:'12px'}}>Your Sealed Bid</div>
          <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
            <FilmPoster film={films.find(f=>f.id===myBid.film_id)} width={48} height={72} radius={7}/>
            <div style={{flex:1}}>
              <div style={{fontSize:'16px',fontWeight:700,marginBottom:'4px'}}>{films.find(f=>f.id===myBid.film_id)?.title}</div>
              <div style={{fontSize:'24px',fontWeight:900,color:T.purple,fontFamily:T.mono}}>{cur}{myBid.amount}M</div>
            </div>
            <Btn onClick={cancelBid} variant="outline" color={T.red} size="sm">Cancel</Btn>
          </div>
        </div>:<div style={{...S.card,marginBottom:'20px'}}>
          <div style={{...S.label,marginBottom:'14px'}}>Place Your Bid</div>
          <div style={{marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'6px'}}>Film</div>
            <select value={selFilm} onChange={e=>setSelFilm(e.target.value)} style={S.inp}>
              {phaseFilms.map(f=><option key={f.id} value={f.id}>{f.title} — IPO {cur}{f.basePrice}M</option>)}
            </select>
          </div>
          <div style={{marginBottom:'16px'}}>
            <div style={{...S.label,marginBottom:'6px'}}>Your Bid ({cur}M) — Budget: {cur}{myBudget}M</div>
            <input type="number" value={bidAmount} onChange={e=>setBidAmount(e.target.value)} placeholder={`e.g. ${phaseFilms.find(f=>f.id===selFilm)?.basePrice||20}`} style={{...S.inp,fontSize:'20px',padding:'14px 16px'}}/>
          </div>
          <Btn onClick={submitBid} color={T.purple} textColor="#fff" full size="lg">🔒 Lock Bid</Btn>
          <div style={{fontSize:'11px',color:T.textDim,marginTop:'10px',textAlign:'center'}}>Bids are hidden until the window closes · you can update until deadline</div>
        </div>}
        <div style={{...S.sectionTitle,marginBottom:'12px'}}>Who Has Bid</div>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {players.map(p=>{const hasBid=allBids.find(b=>b.player_id===p.id&&b.status==='pending');return(
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px'}}>
              <div style={{width:'10px',height:'10px',borderRadius:'50%',background:hasBid?T.purple:T.border,flexShrink:0}}/>
              <div style={{width:'30px',height:'30px',borderRadius:'50%',background:p.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:900,color:'#0D0A08',flexShrink:0}}>{p.name?.[0]}</div>
              <div style={{flex:1,fontSize:'13px',color:p.color||T.gold,fontWeight:500}}>{p.name}</div>
              <div style={{fontSize:'12px',color:hasBid?T.purple:T.textDim,fontWeight:hasBid?600:400}}>{hasBid?'🔒 Bid placed':'No bid yet'}</div>
            </div>
          )})}
        </div>
      </div>
    )
  }

  const DistributorPage=()=>{
    const[selFilm,setSelFilm]=useState(films[0]?.id||'')
    const[selDist,setSelDist]=useState('All')
    const[newEvt,setNewEvt]=useState({event_type:'trailer',label:'',event_date:'',notes:''})

    // All unique distributors
    const allDists=['All',...[...new Set(films.map(f=>f.dist).filter(Boolean))].sort()]
    // Filter films by selected distributor
    const filteredFilms=selDist==='All'?films:films.filter(f=>f.dist===selDist)

    // Reset film selection when distributor changes
    React.useEffect(()=>{
      if(selDist!=='All'){
        const first=filteredFilms[0]
        if(first&&first.id!==selFilm)setSelFilm(first.id)
      }
    },[selDist])

    const selF=films.find(f=>f.id===selFilm)
    const filmPicks=allPicks.filter(p=>p.film_id===selFilm)
    const total=filmPicks.length
    const vel7=pickVelocity(selFilm,allPicks,7),vel24=pickVelocity(selFilm,allPicks,1)
    const eventsForFilm=marketingEvents.filter(e=>e.film_id===selFilm).sort((a,b)=>new Date(a.event_date)-new Date(b.event_date))
    const clicks=bookingClicks.filter(b=>b.film_id===selFilm)
    const marketingImpact=eventsForFilm.map(ev=>{
      const evMs=new Date(ev.event_date).getTime()
      const before=filmPicks.filter(p=>{const t=new Date(p.picked_at).getTime();return t>=evMs-7*86400000&&t<evMs}).length
      const after=filmPicks.filter(p=>{const t=new Date(p.picked_at).getTime();return t>=evMs&&t<evMs+7*86400000}).length
      const lift=before>0?Math.round((after-before)/before*100):after>0?100:0
      return{ev,before,after,lift}
    })
    // Ranking filtered by distributor
    const filmRanking=[...filteredFilms].map(f=>({f,total:allPicks.filter(p=>p.film_id===f.id).length,vel:pickVelocity(f.id,allPicks,7)})).sort((a,b)=>b.total-a.total)
    const allFilmsRanking=[...films].map(f=>({f,total:allPicks.filter(p=>p.film_id===f.id).length,vel:pickVelocity(f.id,allPicks,7)})).sort((a,b)=>b.total-a.total)
    const benchmarks=selF?allFilmsRanking.filter(x=>x.f.id!==selFilm&&(x.f.genre===selF.genre||Math.abs(x.f.estM-(selF.estM||0))<30)).slice(0,3):[]
    const roiScore=(()=>{
      if(!selF||total===0)return null
      const avgBenchmarkPicks=benchmarks.length?benchmarks.reduce((s,b)=>s+b.total,0)/benchmarks.length:total
      const pickVsAvg=Math.min(2,total/Math.max(1,avgBenchmarkPicks))
      const avgLift=marketingImpact.length?marketingImpact.reduce((s,m)=>s+m.lift,0)/marketingImpact.length/100:0.5
      const bookConv=total>0?Math.min(1,clicks.length/total):0
      return Math.min(100,Math.round((pickVsAvg*40)+(avgLift*40)+(bookConv*20)))
    })()
    const roiColor=roiScore===null?T.textSub:roiScore>=70?T.green:roiScore>=40?T.gold:T.red
    const roiLabel=roiScore===null?'—':roiScore>=70?'Strong':roiScore>=40?'Building':'Weak'

    // Distributor aggregate stats
    const distStats=selDist!=='All'?(()=>{
      const distFilms=films.filter(f=>f.dist===selDist)
      const distPicks=allPicks.filter(p=>distFilms.find(f=>f.id===p.film_id))
      const distClicks=bookingClicks.filter(b=>distFilms.find(f=>f.id===b.film_id))
      const distVel=distFilms.reduce((s,f)=>s+pickVelocity(f.id,allPicks,7),0)
      const topFilm=distFilms.map(f=>({f,picks:allPicks.filter(p=>p.film_id===f.id).length})).sort((a,b)=>b.picks-a.picks)[0]
      return{films:distFilms.length,picks:distPicks.length,clicks:distClicks.length,vel7:distVel,topFilm}
    })():null

    const exportCSV=()=>{
      const rows=[['Film','Distributor','Genre','Phase','Week','Est $M','Total Picks','7d Velocity','24h Picks','Booking Clicks'],...filmRanking.map(({f,total,vel})=>[f.title,f.dist,f.genre,f.phase,f.week,f.estM,total,vel,pickVelocity(f.id,allPicks,1),bookingClicks.filter(b=>b.film_id===f.id).length])]
      const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`boxd-intent-${selDist==='All'?'all':selDist.toLowerCase().replace(/\s+/g,'-')}.csv`;a.click();URL.revokeObjectURL(url)
    }
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'4px'}}>
          <div style={S.pageTitle}>📈 Distributor Insights</div>
          <Btn onClick={exportCSV} color={T.textSub} variant="outline" size="sm">↓ CSV</Btn>
        </div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Audience intent · pick velocity · marketing impact</div>

        {/* ── DISTRIBUTOR FILTER ── */}
        <div style={{marginBottom:'20px'}}>
          <div style={{...S.label,marginBottom:'8px'}}>Filter by Distributor</div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {allDists.map(d=>{
              const isActive=selDist===d
              const distFilmCount=d==='All'?films.length:films.filter(f=>f.dist===d).length
              const distPickCount=d==='All'?allPicks.length:allPicks.filter(p=>films.find(f=>f.id===p.film_id&&f.dist===d)).length
              return(
                <button key={d} onClick={()=>setSelDist(d)} style={{...S.btn,background:isActive?`${T.blue}22`:T.surfaceUp,border:`1px solid ${isActive?T.blue+'66':T.border}`,color:isActive?T.blue:T.textSub,padding:'7px 14px',fontSize:'12px',textTransform:'none',letterSpacing:0,gap:'6px',flexShrink:0}}>
                  {d}
                  {distPickCount>0&&<span style={{fontSize:'10px',color:isActive?T.blue:T.textDim,background:isActive?`${T.blue}22`:T.border,padding:'1px 5px',borderRadius:'8px'}}>{distPickCount}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── DISTRIBUTOR AGGREGATE when filtered ── */}
        {distStats&&(
          <div style={{background:`linear-gradient(135deg,${T.blue}10,${T.surface})`,border:`1px solid ${T.blue}33`,borderRadius:'16px',padding:'18px 20px',marginBottom:'20px'}}>
            <div style={{fontSize:'12px',color:T.blue,fontWeight:700,letterSpacing:'1px',marginBottom:'12px'}}>{selDist.toUpperCase()} · SLATE OVERVIEW</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:distStats.topFilm?'14px':'0'}}>
              {[
                {label:'Films',value:distStats.films,color:T.text},
                {label:'Total picks',value:distStats.picks,color:T.gold},
                {label:'7d velocity',value:distStats.vel7,color:distStats.vel7>=5?T.red:distStats.vel7>=2?T.orange:T.text},
                {label:'Booking clicks',value:distStats.clicks,color:T.blue},
              ].map(({label,value,color})=>(
                <div key={label} style={{background:'#00000018',borderRadius:'10px',padding:'10px 8px',textAlign:'center'}}>
                  <div style={{fontSize:'20px',fontWeight:900,color,fontFamily:T.mono,lineHeight:1}}>{value}</div>
                  <div style={{fontSize:'10px',color:T.textDim,marginTop:'3px'}}>{label}</div>
                </div>
              ))}
            </div>
            {distStats.topFilm&&distStats.topFilm.picks>0&&(
              <div style={{display:'flex',gap:'10px',alignItems:'center',background:'#00000018',borderRadius:'10px',padding:'10px 12px'}}>
                <FilmPoster film={distStats.topFilm.f} width={32} height={48} radius={5}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:'10px',color:T.blue,fontWeight:700,letterSpacing:'1px',marginBottom:'2px'}}>TOP FILM</div>
                  <div style={{fontSize:'13px',fontWeight:600}}>{distStats.topFilm.f.title}</div>
                  <div style={{fontSize:'11px',color:T.textSub}}>{distStats.topFilm.picks} picks · Est ${distStats.topFilm.f.estM}M</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FILM SELECTOR ── */}
        <div style={{marginBottom:'20px'}}>
          <div style={{...S.label,marginBottom:'6px'}}>Select Film {selDist!=='All'?`· ${filteredFilms.length} from ${selDist}`:''}</div>
          <select value={selFilm} onChange={e=>setSelFilm(e.target.value)} style={S.inp}>
            {filteredFilms.map(f=><option key={f.id} value={f.id}>{f.title} — {f.dist} (Ph{f.phase})</option>)}
          </select>
        </div>
        {selF&&<>
          <div style={{...S.card,marginBottom:'16px',display:'flex',gap:'16px',alignItems:'center'}}>
            <FilmPoster film={selF} width={56} height={84} radius={8}/>
            <div style={{flex:1}}>
              <div style={{fontSize:'18px',fontWeight:700,marginBottom:'4px'}}>{selF.title}</div>
              <div style={{fontSize:'13px',color:T.textSub}}>{selF.dist} · Ph{selF.phase} · W{selF.week}</div>
              <div style={{display:'flex',gap:'8px',marginTop:'8px',flexWrap:'wrap'}}>
                <Pill color={GENRE_COL[selF.genre]||T.textSub}>{selF.genre}</Pill>
                {selF.rt!=null&&<Pill color={selF.rt>=75?T.green:T.red}>RT {selF.rt}%</Pill>}
                {selF.starActor&&<Pill>⭐ {selF.starActor}</Pill>}
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px',marginBottom:'16px'}}>
            <StatBox label="Total picks" value={total} color={T.gold} sub="intent signals"/>
            <StatBox label="7-day velocity" value={vel7} color={vel7>=5?T.red:vel7>=2?T.orange:T.text} sub="this week"/>
            <StatBox label="24h picks" value={vel24} color={vel24>0?T.green:T.text} sub="today"/>
            <StatBox label="Booking clicks" value={clicks.length} color={T.blue} sub="ticket CTAs"/>
          </div>
          <div style={{...S.card,marginBottom:'16px',display:'flex',gap:'20px',alignItems:'center'}}>
            <div style={{flex:1}}>
              <div style={{...S.sectionTitle,marginBottom:'6px'}}>Campaign ROI Score</div>
              <div style={{fontSize:'12px',color:T.textSub,lineHeight:1.5}}>Pick volume vs comparable titles (40%) + marketing lift (40%) + booking conversion (20%)</div>
              {benchmarks.length>0&&<div style={{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}}>{benchmarks.map(({f,total:bt})=><div key={f.id} style={{fontSize:'11px',color:T.textSub,background:T.surfaceUp,borderRadius:'6px',padding:'4px 8px'}}>{f.title.split(':')[0]} · {bt} picks</div>)}</div>}
            </div>
            <div style={{textAlign:'center',flexShrink:0}}>
              <div style={{fontSize:'52px',fontWeight:900,color:roiColor,lineHeight:1,fontFamily:T.mono,letterSpacing:'-2px'}}>{roiScore??'—'}</div>
              <div style={{fontSize:'12px',color:roiColor,fontWeight:600,marginTop:'4px'}}>{roiLabel}</div>
              <div style={{fontSize:'10px',color:T.textDim,marginTop:'2px'}}>out of 100</div>
            </div>
          </div>
          {total>0&&<div style={{...S.card,marginBottom:'16px'}}>
            <div style={{fontSize:'13px',fontWeight:600,color:T.textSub,marginBottom:'14px'}}>Pick Velocity — 30 days</div>
            <div style={{overflowX:'auto'}}><VelocitySparkline filmId={selFilm} allPicks={allPicks} marketingEvents={marketingEvents} width={Math.max(320,Math.min(600,(typeof window!=='undefined'?window.innerWidth:500)-80))} height={80}/></div>
          </div>}
          {marketingImpact.length>0&&<div style={{...S.card,marginBottom:'16px'}}>
            <div style={{fontSize:'13px',fontWeight:600,color:T.textSub,marginBottom:'14px'}}>Marketing Event Impact</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:'8px',marginBottom:'8px',padding:'0 4px'}}>{['Event','−7d','+7d','Lift'].map(h=><div key={h} style={S.label}>{h}</div>)}</div>
            {marketingImpact.map(({ev,before,after,lift})=>{const evType=MARKETING_EVENT_TYPES.find(t=>t.id===ev.event_type);return(
              <div key={ev.id} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:'8px',padding:'10px 4px',borderTop:`1px solid ${T.border}`,alignItems:'center'}}>
                <div><div style={{fontSize:'13px',fontWeight:500}}>{evType?.icon} {ev.label}</div><div style={{fontSize:'11px',color:T.textSub}}>{new Date(ev.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div></div>
                <div style={{fontSize:'14px',fontWeight:600,textAlign:'right'}}>{before}</div>
                <div style={{fontSize:'14px',fontWeight:600,textAlign:'right'}}>{after}</div>
                <div style={{fontSize:'14px',fontWeight:700,color:lift>0?T.green:lift<0?T.red:T.textSub,textAlign:'right'}}>{lift>0?'+':''}{lift}%</div>
              </div>
            )})}
          </div>}
          {isCommissioner&&<div style={{...S.card,border:`1px solid ${T.blue}33`,marginBottom:'24px'}}>
            <div style={{fontSize:'13px',fontWeight:600,color:T.blue,marginBottom:'14px'}}>+ Log Marketing Event for {selF.title}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
              <div><div style={{...S.label,marginBottom:'5px'}}>Event Type</div><select value={newEvt.event_type} onChange={e=>setNewEvt(p=>({...p,event_type:e.target.value}))} style={S.inp}>{MARKETING_EVENT_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}</select></div>
              <div><div style={{...S.label,marginBottom:'5px'}}>Date</div><input type="date" value={newEvt.event_date} onChange={e=>setNewEvt(p=>({...p,event_date:e.target.value}))} style={S.inp}/></div>
              <div style={{gridColumn:'1/-1'}}><div style={{...S.label,marginBottom:'5px'}}>Label</div><input type="text" value={newEvt.label} onChange={e=>setNewEvt(p=>({...p,label:e.target.value}))} placeholder="e.g. Main trailer drop — 2.4M views in 24h" style={S.inp}/></div>
            </div>
            <Btn color={T.blue} textColor="#fff" onClick={async()=>{
              if(!newEvt.label||!newEvt.event_date)return notify('Label and date required',T.red)
              const{error}=await supabase.from('marketing_events').insert({film_id:selFilm,event_type:newEvt.event_type,label:newEvt.label,event_date:newEvt.event_date,created_by:profile.id})
              if(error)return notify(error.message,T.red)
              notify(`Event logged for ${selF.title}`,T.blue);setNewEvt({event_type:'trailer',label:'',event_date:'',notes:''});loadMarketingEvents()
            }}>Log Event</Btn>
          </div>}
        </>}
        <div style={{fontSize:'13px',fontWeight:600,color:T.textSub,margin:'8px 0 12px'}}>
          {selDist==='All'?'All Films':'Films from '+selDist} — Audience Intent Ranking
        </div>
        {filmRanking.filter(x=>x.total>0).map(({f,total,vel},i)=>(
          <div key={f.id} className="hoverable" style={{display:'flex',gap:'12px',alignItems:'center',padding:'10px 12px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:'10px',marginBottom:'6px',cursor:'pointer'}} onClick={()=>setSelFilm(f.id)}>
            <div style={{fontSize:'16px',minWidth:'24px',textAlign:'center',color:T.textDim,fontWeight:700}}>#{i+1}</div>
            <FilmPoster film={f} width={28} height={42} radius={5}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.title}</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{f.dist} · Ph{f.phase}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:'16px',fontWeight:700,color:T.gold}}>{total}</div><div style={{fontSize:'11px',color:vel>=5?T.red:vel>=2?T.orange:T.textSub}}>+{vel}/wk</div></div>
          </div>
        ))}
        {filmRanking.filter(x=>x.total>0).length===0&&<div style={{...S.card,textAlign:'center',padding:'32px',color:T.textSub,fontSize:'13px'}}>No picks recorded yet — intent data will appear as players pick films.</div>}
      </div>
    )
  }

  const CommissionerPage=()=>{
    const[ingesting,setIngesting]=React.useState(false)
    const[panelTab,setPanelTab]=React.useState('overview')
    const filmsScored=films.filter(f=>results[f.id]!=null).length
    const filmsTotal=films.length
    const playersActive=players.filter(p=>rosters.some(r=>r.player_id===p.id&&r.active)).length
    const weeksInPhase=phaseFilms.length>0?Math.max(...phaseFilms.map(f=>f.week))-Math.min(...phaseFilms.map(f=>f.week))+1:0
    const weeksLeft=Math.max(0,weeksInPhase-(cfg.current_week-Math.min(...(phaseFilms.map(f=>f.week)||[cfg.current_week]))))
    const orphanCount=rosters.filter(r=>r.active&&!films.find(f=>f.id===r.film_id)).length
    const runIngest=async()=>{
      setIngesting(true)
      try{
        const res=await fetch(`${SUPABASE_URL}/functions/v1/ingest-results`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}})
        const data=await res.json();setIngestLog(data)
        notify(`✅ Ingested ${data.matched?.length||0} results · ${data.unmatched?.length||0} unmatched`,T.green);loadData(league?.id)
      }catch(e){notify(`Ingest failed: ${e.message}`,T.red)}
      setIngesting(false)
    }
    const PanelTab=({id,label,icon})=>(
      <button onClick={()=>setPanelTab(id)} style={{...S.btn,background:'none',border:'none',fontSize:'12px',fontWeight:panelTab===id?700:400,color:panelTab===id?T.gold:T.textSub,padding:'10px 14px',borderBottom:`2px solid ${panelTab===id?T.gold:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0,gap:'6px'}}>
        {icon} {label}
      </button>
    )
    return(
      <div>
        {/* Command centre header */}
        <div style={{background:`linear-gradient(135deg,${T.gold}10,${T.surface})`,border:`1px solid ${T.gold}33`,borderRadius:'16px',padding:'20px',marginBottom:'20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:`linear-gradient(90deg,${T.gold},${T.orange})`}}/>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
            <div>
              <div style={{fontSize:'11px',color:T.gold,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',marginBottom:'4px'}}>Commissioner · {league?.name}</div>
              <div style={{fontSize:'22px',fontWeight:800,color:T.text}}>Control Centre</div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <Btn onClick={()=>{navigator.clipboard?.writeText(`${window.location.origin}/join/${league?.invite_code||''}`);notify('Invite link copied!',T.green)}} color={T.gold} size="sm">🔗 Copy Invite</Btn>
            </div>
          </div>
          {/* League health stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
            {[
              {label:'Players',value:players.length,icon:'👥',color:T.text},
              {label:'Films scored',value:`${filmsScored}/${filmsTotal}`,icon:'🎬',color:filmsScored===filmsTotal&&filmsTotal>0?T.green:T.text},
              {label:'Phase',value:`${ph}/5`,icon:'📅',color:T.gold},
              {label:'Week',value:`W${cfg.current_week}`,icon:'🗓',color:T.text},
            ].map(({label,value,icon,color})=>(
              <div key={label} style={{background:'#00000022',borderRadius:'10px',padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:'16px',marginBottom:'3px'}}>{icon}</div>
                <div style={{fontSize:'16px',fontWeight:800,color,fontFamily:T.mono,lineHeight:1}}>{value}</div>
                <div style={{fontSize:'10px',color:T.textDim,marginTop:'3px',letterSpacing:'0.5px'}}>{label}</div>
              </div>
            ))}
          </div>
          {/* Action needed callouts */}
          {(orphanCount>0||!cfg.current_week)&&(
            <div style={{marginTop:'14px',display:'flex',flexDirection:'column',gap:'6px'}}>
              {orphanCount>0&&<div style={{background:`${T.red}15`,border:`1px solid ${T.red}33`,borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:T.red,display:'flex',gap:'8px',alignItems:'center'}}>
                ⚠️ {orphanCount} orphaned roster row{orphanCount!==1?'s':''} — run Scan & Fix in Maintenance
              </div>}
              {win&&<div style={{background:`${T.orange}15`,border:`1px solid ${T.orange}33`,borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:T.orange,display:'flex',gap:'8px',alignItems:'center'}}>
                🔓 Free drop window active — <WindowTimer openedAt={cfg.phase_window_opened_at} short/> remaining
              </div>}
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div style={{display:'flex',borderBottom:`1px solid ${T.border}`,marginBottom:'20px',overflowX:'auto'}}>
          <PanelTab id="overview" icon="⚡" label="Controls"/>
          <PanelTab id="films" icon="🎬" label="Films"/>
          <PanelTab id="chips" icon="🎯" label="Chips"/>
          <PanelTab id="settings" icon="⚙️" label="Settings"/>
        </div>

        {panelTab==='overview'&&(
          <div>
            {/* Ingest */}
            <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.green}33`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div><div style={{fontSize:'14px',fontWeight:700,color:T.green}}>📊 Box Office Ingest</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>Pulls from The Numbers · runs auto Monday 23:00 UTC</div></div>
                <Btn onClick={runIngest} color={T.green} textColor="#0D0A08" size="sm" disabled={ingesting}>{ingesting?'⏳':'🎬'} {ingesting?'Fetching…':'Run Now'}</Btn>
              </div>
              {ingestLog&&<div style={{background:T.surfaceUp,borderRadius:'9px',padding:'10px 14px',fontSize:'12px'}}>
                <span style={{color:T.green,fontWeight:600}}>✅ {ingestLog.matched?.length||0} matched</span>
                {ingestLog.unmatched?.length>0&&<span style={{color:T.red,marginLeft:'12px'}}>⚠️ {ingestLog.unmatched.join(', ')}</span>}
              </div>}
            </div>

            {/* Phase controls */}
            <div style={{...S.card,marginBottom:'12px'}}>
              <div style={{fontSize:'14px',fontWeight:700,color:T.gold,marginBottom:'14px'}}>📅 Phase Controls</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'12px'}}>
                  <div style={S.label}>Current Week</div>
                  <div style={{fontSize:'24px',fontWeight:900,color:T.text,fontFamily:T.mono,marginTop:'4px'}}>W{cfg.current_week}</div>
                  <Btn color={T.gold} size="sm" sx={{marginTop:'10px',width:'100%'}} onClick={async()=>{await supabase.from('league_config').update({current_week:cfg.current_week+1}).eq('league_id',league?.id);notify(`Week ${cfg.current_week+1}`,T.green);loadData(league?.id)}}>Advance Week →</Btn>
                </div>
                <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'12px'}}>
                  <div style={S.label}>Drop Window</div>
                  <div style={{fontSize:'14px',fontWeight:700,color:win?T.orange:T.textDim,marginTop:'4px'}}>{win?'🔓 Active':'🔒 Closed'}</div>
                  <Btn color={win?T.red:T.orange} textColor="#fff" size="sm" sx={{marginTop:'10px',width:'100%'}} onClick={async()=>{const ni=new Date().toISOString();await supabase.from('league_config').update({phase_window_active:!win,phase_window_opened_at:!win?ni:null}).eq('league_id',league?.id);notify(win?'Window closed':'🔓 72hr window open!',T.orange);loadData(league?.id)}}>{win?'Close Window':'Open 72hr Window'}</Btn>
                </div>
              </div>
              <Btn variant="outline" color={T.gold} full size="lg" disabled={phaseTransitioning} onClick={advancePhase}>
                {phaseTransitioning?'⏳ Transitioning…':`Advance to Phase ${ph+1}: ${PHASE_NAMES[ph+1]||'End'} →`}
              </Btn>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'12px'}}>
                {players.map(p=><div key={p.id} style={{background:T.surfaceUp,borderRadius:'8px',padding:'5px 10px',fontSize:'11px',display:'flex',gap:'6px',alignItems:'center'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:p.color||T.gold}}/>
                  <span style={{color:T.text}}>{p.name}</span>
                  <span style={{color:budgetLeft(p.id)<20?T.red:T.textSub}}>{cur}{budgetLeft(p.id)}M</span>
                </div>)}
              </div>
            </div>

            {/* Draft window */}
            <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.purple}33`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div><div style={{fontSize:'14px',fontWeight:700,color:T.purple}}>🎬 Draft Window</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>Min {DRAFT_MIN} picks required or ${DRAFT_PENALTY}M penalty</div></div>
                <Btn color={draftWindowOpen?T.red:T.purple} textColor="#fff" size="sm" onClick={async()=>{
                  const deadline=new Date(Date.now()+14*86400000).toISOString()
                  await supabase.from('league_config').update({draft_window_open:!draftWindowOpen,draft_deadline:!draftWindowOpen?deadline:null}).eq('league_id',league?.id)
                  notify(draftWindowOpen?'Draft window closed':'🎬 Draft window open · 14 days',T.purple);loadData(league?.id)
                }}>{draftWindowOpen?'Close':'Open (14d)'}</Btn>
              </div>
              {draftWindowOpen&&<div style={{background:`${T.purple}12`,borderRadius:'9px',padding:'10px 14px',marginBottom:'10px'}}>
                <div style={{fontSize:'12px',color:T.purple,marginBottom:'8px'}}>⏱ Deadline: {cfg.draft_deadline?new Date(cfg.draft_deadline).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}):'—'}</div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {players.map(p=>{const picks=rosters.filter(r=>r.player_id===p.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length;const ok=picks>=DRAFT_MIN;return(
                    <div key={p.id} style={{fontSize:'11px',background:ok?`${T.green}18`:`${T.red}18`,color:ok?T.green:T.red,padding:'3px 8px',borderRadius:'8px'}}>{p.name} {picks}/{DRAFT_MIN}</div>
                  )})}
                </div>
                <Btn variant="outline" color={T.red} size="sm" sx={{marginTop:'10px'}} onClick={async()=>{
                  if(!confirm('Apply draft penalties now?'))return
                  let penalised=0
                  for(const player of players){
                    const picks=rosters.filter(r=>r.player_id===player.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length
                    const shortfall=Math.max(0,DRAFT_MIN-picks)
                    if(shortfall>0){
                      const penalty=shortfall*DRAFT_PENALTY
                      await supabase.from('transactions').insert({player_id:player.id,film_id:null,type:'draft_penalty',price:penalty,week:cfg.current_week,league_id:league?.id})
                      const alloc=phaseAlloc(player.id,ph),ex=phaseBudgets.find(pb=>pb.player_id===player.id&&pb.phase===ph)
                      if(ex)await supabase.from('phase_budgets').update({budget_allocated:alloc-penalty}).eq('id',ex.id)
                      else await supabase.from('phase_budgets').insert({player_id:player.id,phase:ph,budget_allocated:PHASE_BUDGETS[ph]-penalty,budget_spent:0,budget_banked:0,league_id:league?.id})
                      penalised++
                    }
                  }
                  await supabase.from('league_config').update({draft_window_open:false,draft_deadline:null}).eq('league_id',league?.id)
                  notify(`Penalties applied to ${penalised} player${penalised!==1?'s':''}`,T.red);loadData(league?.id)
                }}>⚠️ Apply Penalties</Btn>
              </div>}
            </div>

            {/* Sealed bid */}
            <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.purple}22`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <div><div style={{fontSize:'14px',fontWeight:700,color:T.purple}}>🔒 Sealed Bid</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>Blind auction — highest bid wins</div></div>
                <Btn color={sealedWindowOpen?T.red:T.purple} textColor="#fff" size="sm" onClick={async()=>{
                  const deadline=new Date(Date.now()+48*3600000).toISOString()
                  await supabase.from('league_config').update({sealed_bid_window_open:!sealedWindowOpen,sealed_bid_deadline:!sealedWindowOpen?deadline:null}).eq('league_id',league?.id)
                  notify(sealedWindowOpen?'Sealed bid closed':'🔒 48hr auction open',T.purple);loadData(league?.id)
                }}>{sealedWindowOpen?'Close':'Open (48h)'}</Btn>
              </div>
              {sealedWindowOpen&&<>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
                  {players.map(p=>{const b=sealedBids.find(b=>b.player_id===p.id&&b.status==='pending');return(
                    <div key={p.id} style={{fontSize:'11px',background:b?`${T.purple}18`:T.surfaceUp,color:b?T.purple:T.textDim,padding:'3px 8px',borderRadius:'8px',border:`1px solid ${b?T.purple+'44':T.border}`}}>{p.name} {b?'✓ bid':'—'}</div>
                  )})}
                </div>
                <Btn color={T.orange} textColor="#0D0A08" size="sm" onClick={async()=>{
                  if(!confirm('Resolve bids now?'))return
                  const bidsByFilm={}
                  sealedBids.filter(b=>b.status==='pending').forEach(b=>{if(!bidsByFilm[b.film_id]||b.amount>bidsByFilm[b.film_id].amount)bidsByFilm[b.film_id]=b})
                  for(const[filmId,winBid] of Object.entries(bidsByFilm)){
                    const film=films.find(f=>f.id===filmId);if(!film)continue
                    await supabase.from('rosters').insert({player_id:winBid.player_id,film_id:filmId,bought_price:winBid.amount,bought_week:cfg.current_week,acquired_week:cfg.current_week,phase:ph,active:true,league_id:league?.id})
                    await supabase.from('sealed_bids').update({status:'won'}).eq('id',winBid.id)
                    await supabase.from('sealed_bids').update({status:'lost'}).eq('film_id',filmId).eq('status','pending')
                  }
                  await supabase.from('league_config').update({sealed_bid_window_open:false,sealed_bid_deadline:null}).eq('league_id',league?.id)
                  notify('✅ Bids resolved',T.green);loadData(league?.id)
                }}>Resolve Bids →</Btn>
              </>}
            </div>

            {/* Oscar night */}
            <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.gold}22`}}>
              <div style={{fontSize:'14px',fontWeight:700,color:T.gold,marginBottom:'12px'}}>🏆 Oscar Night</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <select id="oscar-win" style={{...S.inp,flex:1,minWidth:'180px'}}><option value="">Best Picture winner…</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
                <Btn color={T.gold} onClick={async()=>{const id=document.getElementById('oscar-win').value;if(!id)return;await supabase.from('league_config').update({best_picture_winner:id}).eq('league_id',league?.id);for(const op of oscarPreds)await supabase.from('oscar_predictions').update({correct:op.best_picture_film_id===id}).eq('player_id',op.player_id);notify(`🏆 ${films.find(f=>f.id===id)?.title}`,T.gold);loadData(league?.id)}}>Set Winner</Btn>
              </div>
            </div>
          </div>
        )}

        {panelTab==='films'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <div style={{fontSize:'14px',fontWeight:700,color:T.gold}}>Film Management</div>
              <Btn color={T.green} textColor="#0D0A08" size="sm" onClick={()=>setAddFilm(true)}>+ Add Film</Btn>
            </div>
            {[1,2,3,4,5].map(p=>{const pf=films.filter(f=>f.phase===p);if(!pf.length)return null;return(
              <div key={p} style={{marginBottom:'20px'}}>
                <div style={{...S.label,color:p===ph?T.gold:T.textDim,marginBottom:'10px',display:'flex',alignItems:'center',gap:'8px'}}>
                  Phase {p} — {PHASE_NAMES[p]}
                  {p===ph&&<span style={{background:`${T.gold}22`,color:T.gold,fontSize:'9px',padding:'2px 6px',borderRadius:'6px',fontWeight:700}}>CURRENT</span>}
                </div>
                {pf.map(film=>(
                  <div key={film.id} style={{...S.card,marginBottom:'8px',padding:'12px 14px'}}>
                    <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
                      <FilmPoster film={film} width={36} height={54} radius={6}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px',fontWeight:600}}>{film.title}</div>
                        <div style={{fontSize:'11px',color:T.textSub}}>W{film.week} · {film.dist}</div>
                        {results[film.id]!=null&&<div style={{fontSize:'11px',color:T.green,marginTop:'2px'}}>✅ ${results[film.id]}M actual</div>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'flex-end'}}>
                      {[['IPO $M','basePrice',64],['Est $M','estM',64],['RT%','rt',54]].map(([lbl,fld,w])=>(
                        <div key={fld}>
                          <div style={{fontSize:'9px',color:T.textDim,marginBottom:'3px',letterSpacing:'1px'}}>{lbl}</div>
                          <input type="number" defaultValue={film[fld]||''} id={`${fld}-${film.id}`} style={{...S.inp,width:`${w}px`,fontSize:'12px',padding:'6px 8px'}}/>
                        </div>
                      ))}
                      <div>
                        <div style={{fontSize:'9px',color:T.textDim,marginBottom:'3px',letterSpacing:'1px'}}>TRAILER URL</div>
                        <input type="text" defaultValue={film.trailer||''} id={`trailer-${film.id}`} style={{...S.inp,width:'120px',fontSize:'11px',padding:'6px 8px'}}/>
                      </div>
                      <Btn size="sm" color={T.gold} onClick={async()=>{
                        const ni=parseInt(document.getElementById(`basePrice-${film.id}`).value)
                        const ne=parseInt(document.getElementById(`estM-${film.id}`).value)
                        const nr=parseInt(document.getElementById(`rt-${film.id}`).value)||null
                        const nt=document.getElementById(`trailer-${film.id}`).value.trim()
                        await supabase.from('films').update({base_price:ni,est_m:ne,rt:nr,trailer:nt}).eq('id',film.id)
                        notify(`Updated ${film.title}`,T.green);loadData(league?.id)
                      }}>Save</Btn>
                      <Btn size="sm" variant="outline" color={T.red} onClick={async()=>{if(!confirm(`Remove ${film.title}?`))return;await supabase.from('films').update({active:false}).eq('id',film.id);notify(`Removed`,T.red);loadData(league?.id)}}>✕</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )})}
          </div>
        )}

        {panelTab==='chips'&&(
          <div>
            <div style={{fontSize:'14px',fontWeight:700,color:T.gold,marginBottom:'16px'}}>Chip Overrides</div>
            {!allChips.length&&<div style={{...S.card,textAlign:'center',padding:'32px',color:T.textSub}}>No chips activated yet.</div>}
            {allChips.map(c=>{const p=players.find(pl=>pl.id===c.player_id);return(
              <div key={c.id} style={{...S.card,marginBottom:'10px'}}>
                <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'12px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'50%',background:p?.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:900,color:'#0D0A08'}}>{p?.name?.[0]}</div>
                  <div style={{fontSize:'14px',fontWeight:600,color:p?.color||T.gold}}>{p?.name}</div>
                </div>
                {c.short_film_id&&<div style={{background:T.surfaceUp,borderRadius:'10px',padding:'10px 12px',marginBottom:'8px'}}>
                  <div style={{fontSize:'12px',color:T.red,fontWeight:600,marginBottom:'8px'}}>📉 Short — {films.find(f=>f.id===c.short_film_id)?.title}</div>
                  <div style={{fontSize:'11px',color:T.textSub,marginBottom:'8px'}}>Status: <span style={{color:c.short_result?T.text:T.orange}}>{c.short_result||'pending'}</span></div>
                  {!c.short_result&&<div style={{display:'flex',gap:'8px'}}>
                    <Btn color={T.green} textColor="#0D0A08" size="sm" sx={{flex:1}} onClick={async()=>{await supabase.from('chips').update({short_result:'win'}).eq('player_id',c.player_id);notify('Short WIN',T.green);loadData(league?.id)}}>✅ Win +100pts</Btn>
                    <Btn color={T.red} textColor="#fff" size="sm" sx={{flex:1}} onClick={async()=>{await supabase.from('chips').update({short_result:'lose'}).eq('player_id',c.player_id);notify('Short LOSE',T.red);loadData(league?.id)}}>❌ Lose −30pts</Btn>
                  </div>}
                </div>}
                {c.analyst_film_id&&<div style={{background:T.surfaceUp,borderRadius:'10px',padding:'10px 12px'}}>
                  <div style={{fontSize:'12px',color:T.blue,fontWeight:600,marginBottom:'8px'}}>🎯 Analyst — {films.find(f=>f.id===c.analyst_film_id)?.title} · predicted ${c.analyst_prediction}M</div>
                  <div style={{fontSize:'11px',color:T.textSub,marginBottom:'8px'}}>Status: <span style={{color:c.analyst_result?T.text:T.orange}}>{c.analyst_result||'pending'}</span></div>
                  {!c.analyst_result&&<div style={{display:'flex',gap:'8px'}}>
                    <Btn color={T.green} textColor="#0D0A08" size="sm" sx={{flex:1}} onClick={async()=>{await supabase.from('chips').update({analyst_result:'win'}).eq('player_id',c.player_id);notify('Analyst WIN +60pts',T.green);loadData(league?.id)}}>✅ Win +60pts</Btn>
                    <Btn color={T.red} textColor="#fff" size="sm" sx={{flex:1}} onClick={async()=>{await supabase.from('chips').update({analyst_result:'lose'}).eq('player_id',c.player_id);notify('Analyst missed',T.red);loadData(league?.id)}}>❌ Missed</Btn>
                  </div>}
                </div>}
              </div>
            )})}
          </div>
        )}

        {panelTab==='settings'&&(
          <div>
            <div style={{...S.card,marginBottom:'12px'}}>
              <div style={{fontSize:'14px',fontWeight:700,color:T.gold,marginBottom:'14px'}}>League Settings</div>
              <div style={S.label}>Invite Code</div>
              <div style={{fontSize:'28px',fontWeight:900,color:T.text,letterSpacing:'4px',fontFamily:T.mono,margin:'8px 0 4px'}}>{league?.invite_code}</div>
              <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Share this with players to join</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <Btn onClick={()=>{navigator.clipboard?.writeText(league?.invite_code||'');notify('Code copied!',T.green)}} color={T.gold} size="sm">Copy Code</Btn>
                <Btn onClick={()=>{navigator.clipboard?.writeText(`${window.location.origin}/join/${league?.invite_code||''}`);notify('Link copied!',T.green)}} color={T.blue} textColor="#fff" size="sm">🔗 Copy Link</Btn>
              </div>
            </div>
            <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.red}22`}}>
              <div style={{fontSize:'14px',fontWeight:700,color:T.red,marginBottom:'10px'}}>Maintenance</div>
              <div style={{fontSize:'12px',color:T.textSub,marginBottom:'12px'}}>Fix orphaned roster rows ({orphanCount} found)</div>
              <Btn variant="outline" color={T.red} size="sm" onClick={async()=>{const ids=new Set(films.map(f=>f.id)),orphans=rosters.filter(r=>r.active&&!ids.has(r.film_id));if(!orphans.length)return notify('No orphans ✅',T.green);for(const o of orphans)await supabase.from('rosters').update({active:false}).eq('id',o.id);notify(`Fixed ${orphans.length} rows`,T.green);loadData(league?.id)}}>Scan & Fix Orphans</Btn>
            </div>
            <Btn onClick={leaveLeague} variant="outline" color={T.red} size="sm">Leave League</Btn>
          </div>
        )}
      </div>
    )
  }
  // ── RENDER ────────────────────────────────────────────────────────────────────
  const renderPage=()=>{
    if(page==='profile'&&profilePlayer) return <PlayerProfilePage player={profilePlayer} films={films} rosters={rosters} results={results} weeklyG={weeklyG} allChips={allChips} auteurDecl={auteurDecl} wwWinners={wwWinners} oscarPreds={oscarPreds} calcPoints={calcPoints} calcPhasePoints={calcPhasePoints} budgetLeft={budgetLeft} cur={cur} isEarlyBird={isEarlyBird} analystActive={analystOn} auteurBonus={auteurOn} shortBonus={shortBonus} wwBonus={wwBonus} curPhase_ref={ph} onBack={()=>{setPage(prevPage);setProfilePlayer(null)}}/>
    switch(page){
      case 'market':     return <MarketPage/>
      case 'roster':     return <RosterPage/>
      case 'chips':      return <ChipsPage/>
      case 'league':     return <LeaguePage/>
      case 'feed':       return <FeedPage/>
      case 'intent':     return <IntentPage/>
      case 'trades':     return <TradesPage/>
      case 'forecaster': return <ForecasterPage/>
      case 'oscar':      return <OscarPage/>
      case 'results':    return <ResultsPage/>
      case 'sealed':     return <SealedBidPage/>
      case 'commissioner': return <CommissionerPage/>
      case 'distributor':  return <DistributorPage/>
      default:           return <MarketPage/>
    }
  }

  const navigate=(id)=>{setPage(id);setMoreOpen(false);window.scrollTo({top:0,behavior:'smooth'})}

  const draftBannerVisible=draftWindowOpen&&draftShortfall>0

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:T.mono,fontSize:'14px'}}>

      {/* ── AMBIENT PHASE BACKGROUND ─────────────────────────────────────────── */}
      <div className={`ambient-bg ambient-p${ph}`}/>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={{position:'sticky',top:0,zIndex:200,background:`${T.bg}F2`,backdropFilter:'blur(14px)',borderBottom:`1px solid ${T.border}`,padding:'0 20px',height:'56px',display:'flex',alignItems:'center',gap:'14px'}}>
        <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:'none',border:'none',color:T.textSub,cursor:'pointer',fontSize:'18px',padding:'4px 6px',flexShrink:0,display:isMobile?'none':'flex',alignItems:'center',justifyContent:'center',borderRadius:'6px',lineHeight:1}}>☰</button>
        <div style={{fontSize:'24px',fontWeight:900,color:T.gold,letterSpacing:'-1.5px',lineHeight:1,flexShrink:0,cursor:'pointer',fontFamily:T.mono}} onClick={()=>navigate('market')}>BOXD</div>
        {league&&<div style={{fontSize:'13px',color:T.textSub,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0,paddingLeft:'4px'}}>{league.name}</div>}
        {!isMobile&&<div style={{display:'flex',gap:'6px',alignItems:'center',marginLeft:'auto',flexShrink:0}}>
          <div style={{fontSize:'12px',color:T.textDim,background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'4px 10px',whiteSpace:'nowrap'}}>W{cfg.current_week} · Ph{ph}</div>
        </div>}
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexShrink:0}}>
          {draftWindowOpen&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1,cursor:'pointer'}} onClick={()=>navigate('market')}>
            <DraftTimer deadline={draftDeadline} shortfall={draftShortfall} draftMin={DRAFT_MIN}/>
          </div>}
          <div style={{background:myBudget<20?`${T.red}18`:`${T.gold}14`,border:`1px solid ${myBudget<20?T.red+'55':T.gold+'44'}`,borderRadius:'12px',padding:'6px 14px',cursor:'pointer',minWidth:'80px'}} onClick={()=>navigate('roster')}>
            <div style={{fontSize:'10px',color:T.textDim,letterSpacing:'1px',marginBottom:'2px'}}>BUDGET</div>
            <div style={{fontSize:'16px',fontWeight:900,color:myBudget<20?T.red:myBudget<50?T.orange:T.gold,fontFamily:T.mono,lineHeight:1}}>{cur}<CountUp value={myBudget}/>M</div>
            <div style={{height:'2px',background:T.border,borderRadius:'2px',marginTop:'5px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.min(100,Math.round((1-myBudget/Math.max(1,phaseAlloc(profile.id,ph)))*100))}%`,background:myBudget<20?T.red:myBudget<50?T.orange:T.gold,borderRadius:'2px'}}/>
            </div>
          </div>
          {pendingForMe.length>0&&<div style={{background:`${T.blue}22`,border:`1px solid ${T.blue}55`,borderRadius:'20px',padding:'6px 12px',fontSize:'13px',color:T.blue,cursor:'pointer',whiteSpace:'nowrap',fontWeight:600}} onClick={()=>navigate('trades')}>
            🔄 {pendingForMe.length}
          </div>}
          <div onClick={()=>goToProfile(profile)} style={{width:'34px',height:'34px',borderRadius:'50%',background:profile?.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:900,color:'#0D0A08',cursor:'pointer',flexShrink:0,boxShadow:`0 0 0 2px ${T.bg},0 0 0 3px ${profile?.color||T.gold}44`}}>
            {profile?.name?.[0]||'?'}
          </div>
        </div>
      </div>

      {/* ── DRAFT BANNER ────────────────────────────────────────────────────── */}
      {draftBannerVisible&&(
        <div style={{background:`${T.orange}18`,borderBottom:`1px solid ${T.orange}44`,padding:'10px 20px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
          <span style={{fontSize:'14px',color:T.orange,fontWeight:600}}>⚠️ Draft window open</span>
          <span style={{fontSize:'13px',color:T.textSub}}>Pick {draftShortfall} more film{draftShortfall!==1?'s':''} or face {cur}{draftPenalty}M penalty</span>
          <Btn onClick={()=>navigate('market')} color={T.orange} textColor="#0D0A08" size="sm">Go to Market →</Btn>
        </div>
      )}

      <div style={{display:'flex',minHeight:'calc(100vh - 54px)'}}>

        {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
        {!isMobile&&sidebarOpen&&(
          <div style={{width:'220px',flexShrink:0,borderRight:`1px solid ${T.border}`,padding:'12px 8px',display:'flex',flexDirection:'column',gap:'2px',position:'sticky',top:'54px',height:'calc(100vh - 54px)',overflowY:'auto',background:T.bg}}>
            {/* Main nav */}
            {[
              {id:'market',icon:'🎬',label:'Market'},
              {id:'roster',icon:'📁',label:'Roster'},
              {id:'chips',icon:'⚡',label:'Chips'},
              {id:'league',icon:'🥇',label:'League'},
              {id:'feed',icon:'📡',label:'Feed'},
            ].map(({id,icon,label})=>{
              const active=page===id
              return(
                <button key={id} onClick={()=>navigate(id)} style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',background:active?`${T.gold}18`:'transparent',color:active?T.gold:T.textSub,border:`1px solid ${active?T.gold+'44':'transparent'}`,borderRadius:'9px',padding:'10px 12px',cursor:'pointer',fontFamily:T.mono,fontSize:'13px',fontWeight:active?700:400,textAlign:'left',transition:'all .12s'}}>
                  <span style={{fontSize:'16px',lineHeight:1,flexShrink:0}}>{icon}</span>
                  <span>{label}</span>
                </button>
              )
            })}
            <div style={{height:'1px',background:T.border,margin:'8px 4px'}}/>
            {/* Secondary nav */}
            {[
              {id:'intent',icon:'👁️',label:'Watchlist'},
              {id:'trades',icon:'🔄',label:'Trades',badge:pendingForMe.length||null},
              {id:'forecaster',icon:'📊',label:'Forecaster'},
              {id:'oscar',icon:'🏆',label:'Oscars'},
              {id:'results',icon:'📋',label:'Results'},
              ...(sealedWindowOpen?[{id:'sealed',icon:'🔒',label:'Sealed Bid',badge:null}]:[]),
            ].map(({id,icon,label,badge})=>{
              const active=page===id
              return(
                <button key={id} onClick={()=>navigate(id)} style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',background:active?`${T.gold}18`:'transparent',color:active?T.gold:T.textSub,border:`1px solid ${active?T.gold+'44':'transparent'}`,borderRadius:'9px',padding:'10px 12px',cursor:'pointer',fontFamily:T.mono,fontSize:'13px',fontWeight:active?700:400,textAlign:'left',transition:'all .12s',position:'relative'}}>
                  <span style={{fontSize:'16px',lineHeight:1,flexShrink:0}}>{icon}</span>
                  <span style={{flex:1}}>{label}</span>
                  {badge>0&&<span style={{background:T.blue,color:'#fff',borderRadius:'20px',fontSize:'10px',padding:'1px 7px',fontWeight:700,flexShrink:0}}>{badge}</span>}
                </button>
              )
            })}
            {isCommissioner&&<>
              <div style={{height:'1px',background:T.border,margin:'8px 4px'}}/>
              {[
                {id:'commissioner',icon:'⚙️',label:'Panel'},
                {id:'distributor',icon:'📈',label:'Insights'},
              ].map(({id,icon,label})=>{
                const active=page===id
                return(
                  <button key={id} onClick={()=>navigate(id)} style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',background:active?`${T.gold}18`:'transparent',color:active?T.gold:T.textDim,border:`1px solid ${active?T.gold+'44':'transparent'}`,borderRadius:'9px',padding:'10px 12px',cursor:'pointer',fontFamily:T.mono,fontSize:'12px',fontWeight:active?700:400,textAlign:'left',transition:'all .12s'}}>
                    <span style={{fontSize:'15px',lineHeight:1,flexShrink:0}}>{icon}</span>
                    <span>{label}</span>
                  </button>
                )
              })}
            </>}
            <div style={{marginTop:'auto',paddingTop:'12px',borderTop:`1px solid ${T.border}`}}>
              {/* Phase indicator */}
              <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'10px 12px',marginBottom:'8px'}}>
                <div style={{fontSize:'10px',color:T.textDim,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'4px'}}>Current Phase</div>
                <div style={{fontSize:'13px',fontWeight:700,color:T.gold}}>Ph{ph} · {PHASE_NAMES[ph]}</div>
                <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>W{cfg.current_week} · {cur}{myBudget}M left</div>
              </div>
              <button onClick={()=>supabase.auth.signOut()} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',background:'none',border:'none',color:T.textDim,padding:'8px 12px',cursor:'pointer',fontFamily:T.mono,fontSize:'11px',textAlign:'left',borderRadius:'8px'}}>→ Sign out</button>
              <button onClick={()=>{setLeague(null);supabase.from('profiles').update({active_league_id:null}).eq('id',profile.id)}} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',background:'none',border:'none',color:T.textDim,padding:'8px 12px',cursor:'pointer',fontFamily:T.mono,fontSize:'11px',textAlign:'left',borderRadius:'8px'}}>← Switch league</button>
            </div>
          </div>
        )}

        {/* ── PAGE CONTENT ────────────────────────────────────────────────── */}
        <div style={{flex:1,minWidth:0,padding:isMobile?'16px 14px 100px':'28px 36px 56px',overflowX:'hidden'}}>
          <div style={{maxWidth:'1400px',margin:'0 auto',position:'relative'}}>
            {dataLoading&&(films.length===0
              ?<div style={{padding:'8px 0'}}><PageSkeleton/></div>
              :<div style={{position:'absolute',inset:0,zIndex:10,background:`${T.bg}CC`,backdropFilter:'blur(2px)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'80px',borderRadius:'12px'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
                  <div style={{width:'32px',height:'32px',border:`3px solid ${T.border}`,borderTopColor:T.gold,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
                  <div style={{fontSize:'12px',color:T.textSub,letterSpacing:'1px'}}>Loading…</div>
                </div>
              </div>
            )}
            {renderPage()}
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────────────────────── */}
      {isMobile&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:300,background:`${T.surface}F8`,backdropFilter:'blur(14px)',borderTop:`1px solid ${T.border}`,paddingBottom:'env(safe-area-inset-bottom)',display:'flex',alignItems:'stretch'}}>
          {BOTTOM_TABS.map(({id,icon,label})=>{
            const active=page===id
            const badge=id==='trades'&&pendingForMe.length>0?pendingForMe.length:null
            return(
              <button key={id} onClick={()=>navigate(id)} style={{...S.btn,flex:1,flexDirection:'column',gap:'3px',padding:'10px 4px',background:'none',color:active?T.gold:T.textSub,fontSize:'9px',textTransform:'none',letterSpacing:0,fontWeight:active?700:400,borderRadius:0,position:'relative',borderBottom:`2px solid ${active?T.gold:'transparent'}`}}>
                <span style={{fontSize:'18px',lineHeight:1,position:'relative'}}>
                  {icon}
                  {badge&&<span style={{position:'absolute',top:'-4px',right:'-4px',background:T.blue,color:'#fff',borderRadius:'50%',width:'14px',height:'14px',fontSize:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900}}>{badge}</span>}
                </span>
                <span>{label}</span>
              </button>
            )
          })}
          <button onClick={()=>setMoreOpen(o=>!o)} style={{...S.btn,flex:1,flexDirection:'column',gap:'3px',padding:'10px 4px',background:'none',color:moreOpen?T.gold:T.textSub,fontSize:'9px',textTransform:'none',letterSpacing:0,fontWeight:moreOpen?700:400,borderRadius:0,borderBottom:`2px solid ${moreOpen?T.gold:'transparent'}`}}>
            <span style={{fontSize:'18px',lineHeight:1}}>⋯</span>
            <span>More</span>
          </button>
        </div>
      )}

      {/* ── MOBILE MORE DRAWER ──────────────────────────────────────────── */}
      {isMobile&&moreOpen&&(
        <div style={{position:'fixed',bottom:'calc(56px + env(safe-area-inset-bottom))',left:0,right:0,zIndex:299,background:T.surface,borderTop:`1px solid ${T.border}`,borderRadius:'20px 20px 0 0',padding:'16px',animation:'slideUp .18s ease'}}>
          <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 16px'}}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
            {ALL_PAGES.filter(p=>!BOTTOM_TABS.find(t=>t.id===p.id)).map(({id,icon,label})=>(
              <button key={id} onClick={()=>navigate(id)} style={{...S.btn,flexDirection:'column',gap:'6px',padding:'14px 8px',background:page===id?`${T.gold}18`:T.surfaceUp,border:`1px solid ${page===id?T.gold+'55':T.border}`,color:page===id?T.gold:T.textSub,fontSize:'11px',textTransform:'none',letterSpacing:0,fontWeight:page===id?700:400,borderRadius:'12px'}}>
                <span style={{fontSize:'20px',lineHeight:1}}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
            <button onClick={()=>{setLeague(null);supabase.from('profiles').update({active_league_id:null}).eq('id',profile.id);setMoreOpen(false)}} style={{...S.btn,flex:1,background:T.surfaceUp,border:`1px solid ${T.border}`,color:T.textSub,padding:'12px',fontSize:'12px',textTransform:'none',letterSpacing:0,borderRadius:'10px'}}>← Switch League</button>
            <button onClick={()=>supabase.auth.signOut()} style={{...S.btn,flex:1,background:T.surfaceUp,border:`1px solid ${T.border}`,color:T.textSub,padding:'12px',fontSize:'12px',textTransform:'none',letterSpacing:0,borderRadius:'10px'}}>→ Sign Out</button>
          </div>
        </div>
      )}
      {isMobile&&moreOpen&&<div style={{position:'fixed',inset:0,zIndex:298}} onClick={()=>setMoreOpen(false)}/>}

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {notif&&(
        <div style={{position:'fixed',bottom:isMobile?'80px':'24px',left:'50%',transform:'translateX(-50%)',background:notif.color,color:notif.color===T.gold?'#0D0A08':'#fff',padding:'12px 24px',borderRadius:'20px',fontSize:'13px',fontWeight:600,zIndex:999,boxShadow:'0 8px 32px #00000055',whiteSpace:'nowrap',animation:'fadeUp .2s ease',pointerEvents:'none',maxWidth:'90vw',textAlign:'center'}}>
          {notif.msg}
        </div>
      )}

      {/* ── SCORE BREAKDOWN MODAL ───────────────────────────────────────── */}
      {scoreModal&&(
        <ScoreBreakdownModal
          film={scoreModal.film}
          holding={scoreModal.holding}
          results={results}
          weeklyGrosses={weeklyG}
          allChips={allChips}
          auteurDeclarations={auteurDecl}
          weekendWinners={wwWinners}
          isEarlyBird={isEarlyBird}
          onClose={()=>setScoreModal(null)}
        />
      )}

      {/* ── FILM DETAIL ─────────────────────────────────────────────────── */}
      {filmDetail&&(
        <FilmDetailModal
          film={filmDetail}
          profile={profile}
          league={league}
          players={players}
          results={results}
          allPicks={allPicks}
          marketingEvents={marketingEvents}
          onTogglePick={togglePick}
          onBookingClick={trackBookingClick}
          onShowtimes={f=>{setShowtimesFilm(f);setFilmDetail(null)}}
          onClose={()=>setFilmDetail(null)}
        />
      )}

      {/* ── SHOWTIMES MODAL ─────────────────────────────────────────────── */}
      {showtimesFilm&&(
        <ShowtimesModal
          film={showtimesFilm}
          onClose={()=>setShowtimesFilm(null)}
          onBookingClick={trackBookingClick}
          supabaseUrl={SUPABASE_URL}
          anonKey={SUPABASE_ANON_KEY}
        />
      )}

      {/* ── TRADE MODAL ─────────────────────────────────────────────────── */}
      {tradeModal&&(
        <TradeModal
          profile={profile}
          league={league}
          players={players}
          rosters={rosters}
          films={films}
          filmVal={filmVal}
          curPhase={curPhase}
          notify={notify}
          onClose={()=>setTradeModal(false)}
          onDone={()=>{setTradeModal(false);loadTrades()}}
        />
      )}

      {/* ── TRAILER MODAL ───────────────────────────────────────────────── */}
      {trailerFilm&&(
        <div style={{position:'fixed',inset:0,background:'#000000EE',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900,padding:'16px'}} onClick={()=>setTrailerFilm(null)}>
          <div style={{width:'100%',maxWidth:'800px',aspectRatio:'16/9',borderRadius:'16px',overflow:'hidden',boxShadow:'0 32px 64px #000'}} onClick={e=>e.stopPropagation()}>
            <iframe src={trailerFilm.trailer} style={{width:'100%',height:'100%',border:'none'}} allow="autoplay; encrypted-media" allowFullScreen title={trailerFilm.title}/>
          </div>
          <button onClick={()=>setTrailerFilm(null)} style={{position:'absolute',top:'20px',right:'20px',background:`${T.surface}CC`,border:`1px solid ${T.border}`,color:T.textSub,borderRadius:'50%',width:'40px',height:'40px',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono}}>✕</button>
        </div>
      )}

      {/* ── ADD FILM MODAL ──────────────────────────────────────────────── */}
      {addFilm&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:700}} onClick={()=>setAddFilm(false)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px 20px 0 0',padding:'24px',width:'100%',maxWidth:'560px',maxHeight:'90vh',overflowY:'auto',paddingBottom:'calc(24px + env(safe-area-inset-bottom))',animation:'slideUp .22s ease'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 20px'}}/>
            <div style={{fontSize:'18px',fontWeight:700,color:T.gold,marginBottom:'20px'}}>+ Add Film to Slate</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              {[['Title','title','text'],['Distributor','dist','text'],['Franchise','franchise','text'],['Star Actor','starActor','text'],['IPO $M','basePrice','number'],['Est $M','estM','number'],['RT%','rt','number'],['Week','week','number'],['Phase','phase','number'],['TMDB ID','tmdbId','text']].map(([label,field,type])=>(
                <div key={field} style={{gridColumn:field==='title'||field==='dist'?'1/-1':'auto'}}>
                  <div style={{...S.label,marginBottom:'5px'}}>{label}</div>
                  <input type={type} value={newFilm[field]||''} style={S.inp} onChange={e=>setNewFilm(prev=>({...prev,[field]:type==='number'?parseFloat(e.target.value)||'':e.target.value}))}/>
                </div>
              ))}
              <div>
                <div style={{...S.label,marginBottom:'5px'}}>Genre</div>
                <select value={newFilm.genre} style={S.inp} onChange={e=>setNewFilm(prev=>({...prev,genre:e.target.value}))}>{Object.keys(GENRE_COL).map(g=><option key={g} value={g}>{g}</option>)}</select>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',paddingTop:'18px'}}>
                <input type="checkbox" checked={newFilm.sleeper} id="sleeper" onChange={e=>setNewFilm(prev=>({...prev,sleeper:e.target.checked}))} style={{width:'16px',height:'16px'}}/>
                <label htmlFor="sleeper" style={{fontSize:'13px',color:T.textSub,cursor:'pointer'}}>Sleeper</label>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <div style={{...S.label,marginBottom:'5px'}}>Trailer URL</div>
                <input type="text" placeholder="https://youtube.com/embed/…" value={newFilm.trailer} style={S.inp} onChange={e=>setNewFilm(prev=>({...prev,trailer:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <Btn onClick={()=>setAddFilm(false)} variant="outline" color={T.textSub} sx={{flex:1}} size="lg">Cancel</Btn>
              <Btn onClick={async()=>{
                if(!newFilm.title||!newFilm.dist)return notify('Title and distributor required',T.red)
                const id='f'+Date.now().toString(36)
                const{error}=await supabase.from('films').insert({id,title:newFilm.title,dist:newFilm.dist,genre:newFilm.genre,franchise:newFilm.franchise||null,star_actor:newFilm.starActor||null,phase:Number(newFilm.phase)||1,week:Number(newFilm.week)||1,base_price:Number(newFilm.basePrice)||20,est_m:Number(newFilm.estM)||30,rt:newFilm.rt!==''?Number(newFilm.rt):null,sleeper:newFilm.sleeper,trailer:newFilm.trailer||'',affiliate_url:newFilm.affiliateUrl||'',tmdb_id:newFilm.tmdbId||null,active:true})
                if(error)return notify(error.message,T.red)
                setAddFilm(false);notify(`✅ ${newFilm.title} added`,T.green)
                setNewFilm({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:'',affiliateUrl:'',tmdbId:''})
                loadData(league?.id)
              }} color={T.green} textColor="#0D0A08" sx={{flex:2}} size="lg">Add Film</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── CHIP MODALS ─────────────────────────────────────────────────── */}
      {chipModal&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:700}} onClick={()=>setChipModal(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px 20px 0 0',padding:'24px',width:'100%',maxWidth:'480px',maxHeight:'88vh',overflowY:'auto',paddingBottom:'calc(24px + env(safe-area-inset-bottom))',animation:'slideUp .22s ease'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 20px'}}/>

            {chipModal==='short'&&(
              <>
                <div style={{fontSize:'20px',fontWeight:700,color:T.red,marginBottom:'6px'}}>📉 The Short</div>
                <div style={{fontSize:'13px',color:T.textSub,marginBottom:'20px',lineHeight:1.6}}>Call a bomb. Under 60% of estimate = +100pts. Overshoots = −30pts.</div>
                <div style={{marginBottom:'14px'}}>
                  <div style={{...S.label,marginBottom:'6px'}}>Film to Short</div>
                  <select id="short-film" style={S.inp}>
                    {films.filter(f=>!results[f.id]&&!allChips.find(c=>c.short_film_id===f.id)).map(f=><option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'20px'}}>
                  <div style={{...S.label,marginBottom:'6px'}}>Your Prediction ($M)</div>
                  <input type="number" id="short-pred" placeholder="e.g. 18" style={S.inp}/>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <Btn onClick={()=>setChipModal(null)} variant="outline" color={T.textSub} sx={{flex:1}} size="lg">Cancel</Btn>
                  <Btn onClick={()=>{const fid=document.getElementById('short-film').value,pred=parseFloat(document.getElementById('short-pred').value);if(isNaN(pred))return notify('Enter a prediction',T.red);activateShort(fid,pred)}} color={T.red} textColor="#fff" sx={{flex:2}} size="lg">Confirm Short</Btn>
                </div>
              </>
            )}

            {chipModal==='analyst'&&(
              <>
                <div style={{fontSize:'20px',fontWeight:700,color:T.blue,marginBottom:'6px'}}>🎯 The Analyst</div>
                <div style={{fontSize:'13px',color:T.textSub,marginBottom:'20px',lineHeight:1.6}}>Predict opening within ±10% on a film you own. Correct = +60pts flat.</div>
                <div style={{marginBottom:'14px'}}>
                  <div style={{...S.label,marginBottom:'6px'}}>Film (must own)</div>
                  <select id="analyst-film" style={S.inp}>
                    {myRoster.filter(r=>!results[r.film_id]&&!allChips.find(c=>c.analyst_film_id===r.film_id)).map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>:null})}
                  </select>
                </div>
                <div style={{marginBottom:'20px'}}>
                  <div style={{...S.label,marginBottom:'6px'}}>Your Prediction ($M)</div>
                  <input type="number" id="analyst-pred" placeholder="e.g. 92" style={S.inp}/>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <Btn onClick={()=>setChipModal(null)} variant="outline" color={T.textSub} sx={{flex:1}} size="lg">Cancel</Btn>
                  <Btn onClick={()=>{const fid=document.getElementById('analyst-film').value,pred=parseFloat(document.getElementById('analyst-pred').value);if(isNaN(pred))return notify('Enter a prediction',T.red);activateAnalyst(fid,pred)}} color={T.blue} textColor="#fff" sx={{flex:2}} size="lg">Confirm</Btn>
                </div>
              </>
            )}

            {chipModal==='auteur'&&(
              <>
                <div style={{fontSize:'20px',fontWeight:700,color:T.orange,marginBottom:'6px'}}>🎭 The Auteur</div>
                <div style={{fontSize:'13px',color:T.textSub,marginBottom:'20px',lineHeight:1.6}}>Declare 2+ films sharing a star actor. Each earns +10% opening pts.</div>
                <div style={{marginBottom:'14px'}}>
                  <div style={{...S.label,marginBottom:'6px'}}>Star Actor</div>
                  <input type="text" value={auteurActor} onChange={e=>setAuteurActor(e.target.value)} placeholder="e.g. Tom Cruise" style={S.inp}/>
                </div>
                <div style={{marginBottom:'20px'}}>
                  <div style={{...S.label,marginBottom:'12px'}}>Select Films (min 2)</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {myRoster.map(r=>{
                      const f=films.find(fl=>fl.id===r.film_id);if(!f)return null
                      const checked=auteurFilms.includes(f.id)
                      return(
                        <div key={r.film_id} onClick={()=>setAuteurFilms(prev=>prev.includes(f.id)?prev.filter(x=>x!==f.id):[...prev,f.id])} style={{display:'flex',alignItems:'center',gap:'12px',cursor:'pointer',padding:'12px',background:checked?`${T.orange}18`:T.surfaceUp,borderRadius:'11px',border:`1px solid ${checked?T.orange+'55':T.border}`,transition:'all .15s'}}>
                          <FilmPoster film={f} width={28} height={42} radius={5}/>
                          <div style={{width:'20px',height:'20px',borderRadius:'5px',background:checked?T.orange:'transparent',border:`2px solid ${checked?T.orange:T.textDim}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>
                            {checked&&<span style={{color:'#0D0A08',fontSize:'12px',fontWeight:900}}>✓</span>}
                          </div>
                          <div>
                            <div style={{fontSize:'13px',fontWeight:500}}>{f.title}</div>
                            {f.starActor&&<div style={{fontSize:'11px',color:T.textSub}}>{f.starActor}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <Btn onClick={()=>{setChipModal(null);setAuteurActor('');setAuteurFilms([])}} variant="outline" color={T.textSub} sx={{flex:1}} size="lg">Cancel</Btn>
                  <Btn onClick={()=>{if(!auteurActor.trim())return notify('Enter actor name',T.red);submitAuteur(auteurActor.trim(),auteurFilms)}} color={T.orange} textColor="#0D0A08" sx={{flex:2}} size="lg">Declare</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PHASE CEREMONY MODAL ─────────────────────────────────────────── */}
      {phaseCeremony&&(
        <div style={{position:'fixed',inset:0,background:'#000000EE',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900,padding:'16px'}} onClick={()=>setPhaseCeremony(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.gold}44`,borderRadius:'24px',width:'100%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto',animation:'fadeUp .3s ease',position:'relative',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
            {/* Gold shimmer header */}
            <div style={{background:`linear-gradient(135deg,${T.gold}22,${T.orange}11)`,borderBottom:`1px solid ${T.gold}33`,padding:'32px 28px 24px',textAlign:'center',position:'relative'}}>
              <div style={{fontSize:'52px',marginBottom:'8px',animation:'fadeUp .4s ease'}}>🎬</div>
              <div style={{fontSize:'12px',color:T.gold,fontWeight:700,letterSpacing:'3px',marginBottom:'6px'}}>PHASE {phaseCeremony.phase} COMPLETE</div>
              <div style={{fontSize:'28px',fontWeight:900,color:T.text,letterSpacing:'-0.5px'}}>{PHASE_NAMES[phaseCeremony.phase]}</div>
            </div>

            <div style={{padding:'24px 28px'}}>
              {/* Phase winner podium */}
              {phaseCeremony.winner&&phaseCeremony.winner.pts>0&&(
                <div style={{background:`linear-gradient(135deg,${T.gold}15,${T.surface})`,border:`1px solid ${T.gold}44`,borderRadius:'16px',padding:'20px',marginBottom:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'11px',color:T.gold,fontWeight:700,letterSpacing:'2px',marginBottom:'12px'}}>PHASE WINNER</div>
                  <div style={{width:'56px',height:'56px',borderRadius:'50%',background:phaseCeremony.winner.p.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:900,color:'#0D0A08',margin:'0 auto 10px',boxShadow:`0 0 0 4px ${T.surface},0 0 0 6px ${T.gold}`}}>
                    {phaseCeremony.winner.p.name?.[0]}
                  </div>
                  <div style={{fontSize:'20px',fontWeight:800,color:phaseCeremony.winner.p.color||T.gold,marginBottom:'4px'}}>{phaseCeremony.winner.p.name}</div>
                  <div style={{fontSize:'40px',fontWeight:900,color:T.gold,fontFamily:T.mono,lineHeight:1,letterSpacing:'-1px'}}>{phaseCeremony.winner.pts}</div>
                  <div style={{fontSize:'12px',color:T.textSub,marginTop:'4px'}}>phase points</div>
                </div>
              )}

              {/* All phase scores */}
              <div style={{marginBottom:'16px'}}>
                <div style={{...S.label,marginBottom:'10px'}}>Phase Standings</div>
                {phaseCeremony.scores.map(({p,pts},i)=>(
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:'16px',minWidth:'24px'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
                    <div style={{width:'28px',height:'28px',borderRadius:'50%',background:p.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:900,color:'#0D0A08',flexShrink:0}}>{p.name?.[0]}</div>
                    <div style={{flex:1,fontSize:'13px',fontWeight:600,color:p.color||T.gold}}>{p.name}</div>
                    <div style={{fontSize:'20px',fontWeight:900,color:i===0?T.gold:T.text,fontFamily:T.mono}}>{pts}</div>
                  </div>
                ))}
              </div>

              {/* MVP film */}
              {phaseCeremony.mvp&&phaseCeremony.mvp.film&&(
                <div style={{background:T.surfaceUp,borderRadius:'12px',padding:'14px',marginBottom:'12px',display:'flex',gap:'12px',alignItems:'center'}}>
                  <FilmPoster film={phaseCeremony.mvp.film} width={44} height={66} radius={7}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'10px',color:T.green,fontWeight:700,letterSpacing:'1.5px',marginBottom:'4px'}}>🏆 TOP FILM</div>
                    <div style={{fontSize:'14px',fontWeight:700,marginBottom:'2px'}}>{phaseCeremony.mvp.film.title}</div>
                    <div style={{fontSize:'13px',color:T.gold,fontWeight:700}}>{Math.round(phaseCeremony.mvp.pts)} pts · ${results[phaseCeremony.mvp.film.id]}M actual</div>
                  </div>
                </div>
              )}

              {/* Chip winner */}
              {phaseCeremony.chipWinner&&(
                <div style={{background:`${T.purple}12`,border:`1px solid ${T.purple}33`,borderRadius:'12px',padding:'12px 14px',marginBottom:'16px'}}>
                  <div style={{fontSize:'10px',color:T.purple,fontWeight:700,letterSpacing:'1.5px',marginBottom:'4px'}}>⚡ CHIP PLAY</div>
                  <div style={{fontSize:'13px',color:T.text}}>
                    <span style={{color:phaseCeremony.chipWinner.color||T.gold,fontWeight:600}}>{phaseCeremony.chipWinner.name}</span>
                    {phaseCeremony.chipWin?.short_result==='win'&&' nailed THE SHORT · +100pts 📉'}
                    {phaseCeremony.chipWin?.analyst_result==='win'&&' nailed THE ANALYST · +60pts 🎯'}
                  </div>
                </div>
              )}

              {/* Next phase teaser */}
              {ph<=5&&PHASE_NAMES[ph]&&(
                <div style={{background:`${T.blue}10`,border:`1px solid ${T.blue}22`,borderRadius:'12px',padding:'14px',marginBottom:'20px'}}>
                  <div style={{fontSize:'10px',color:T.blue,fontWeight:700,letterSpacing:'1.5px',marginBottom:'4px'}}>UP NEXT</div>
                  <div style={{fontSize:'15px',fontWeight:700,color:T.text}}>Phase {ph} · {PHASE_NAMES[ph]}</div>
                  <div style={{fontSize:'12px',color:T.textSub,marginTop:'3px'}}>New budget unlocked · fresh slate incoming</div>
                </div>
              )}

              <Btn onClick={()=>setPhaseCeremony(null)} color={T.gold} full size="lg">Let's go →</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE CARD MODAL ─────────────────────────────────────────────── */}
      {shareCardFilm&&(()=>{
        const myRank=[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id)).findIndex(p=>p.id===profile.id)+1
        const myPts=calcPoints(profile.id)
        const shareText=`🎬 I'm #${myRank} in my BOXD league with ${myPts}pts\nJoin us: ${window.location.origin}/join/${league?.invite_code||''}`
        return(
          <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:900}} onClick={()=>setShareCardFilm(null)}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'20px 20px 0 0',width:'100%',maxWidth:'480px',padding:'28px',animation:'slideUp .25s ease',paddingBottom:'calc(28px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
              <div style={{width:'36px',height:'4px',background:T.border,borderRadius:'2px',margin:'0 auto 20px'}}/>
              {/* Preview card */}
              <div style={{background:`linear-gradient(135deg,#0D0A08,#1A1410)`,border:`1px solid ${T.gold}44`,borderRadius:'16px',padding:'24px',marginBottom:'20px',textAlign:'center'}}>
                <div style={{fontSize:'32px',fontWeight:900,color:T.gold,letterSpacing:'-2px',marginBottom:'4px'}}>BOXD</div>
                <div style={{fontSize:'11px',color:T.textDim,letterSpacing:'3px',marginBottom:'20px'}}>FANTASY BOX OFFICE</div>
                <div style={{width:'52px',height:'52px',borderRadius:'50%',background:profile?.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:900,color:'#0D0A08',margin:'0 auto 10px'}}>{profile?.name?.[0]}</div>
                <div style={{fontSize:'16px',fontWeight:700,color:T.text,marginBottom:'4px'}}>{profile?.name}</div>
                <div style={{fontSize:'11px',color:T.textSub,marginBottom:'16px'}}>{league?.name}</div>
                <div style={{display:'flex',gap:'16px',justifyContent:'center'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'36px',fontWeight:900,color:T.gold,fontFamily:T.mono,lineHeight:1,letterSpacing:'-1px'}}>{myPts}</div>
                    <div style={{fontSize:'10px',color:T.textSub,marginTop:'4px'}}>GRAND PTS</div>
                  </div>
                  <div style={{width:'1px',background:T.border}}/>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'36px',fontWeight:900,color:myRank===1?T.gold:T.text,fontFamily:T.mono,lineHeight:1}}>{myRank===1?'🥇':`#${myRank}`}</div>
                    <div style={{fontSize:'10px',color:T.textSub,marginTop:'4px'}}>of {players.length}</div>
                  </div>
                </div>
                <div style={{marginTop:'20px',fontSize:'11px',color:T.textDim}}>{window.location.origin}</div>
              </div>
              <Btn onClick={()=>{navigator.share?navigator.share({title:'BOXD Fantasy Box Office',text:shareText,url:`${window.location.origin}/join/${league?.invite_code||''}`}).catch(()=>{}):navigator.clipboard?.writeText(shareText).then(()=>notify('Copied to clipboard!',T.gold))}} color={T.gold} full size="lg">
                {navigator.share?'📤 Share':'📋 Copy share text'}
              </Btn>
              <Btn onClick={()=>setShareCardFilm(null)} variant="outline" color={T.textSub} full size="md" sx={{marginTop:'8px'}}>Close</Btn>
            </div>
          </div>
        )
      })()}

      {/* ── CONFETTI ─────────────────────────────────────────────────────── */}
      <ConfettiBurst active={confettiActive}/>

    </div>
  )
}
