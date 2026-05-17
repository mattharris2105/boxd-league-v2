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
      {owned&&url&&<div className="poster-shine"/>}
      {scored&&url&&<div style={{position:'absolute',inset:0,background:`linear-gradient(to top, ${T.green}44, transparent 60%)`,pointerEvents:'none'}}/>}
    </div>
  )
}

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

// PERF: memo wrapper for calcBuzzIndex — caches by film.id+rosters.length+news.length
const _buzzCache=new Map()
function calcBuzzIndex(film,allPicks=[],news=[],rosters=[],totalPlayers=0,currentWeek=null,priceNow=null){
  if(film.hasResult)return null
  const cacheKey=`${film.id}|${allPicks.length}|${news.length}|${rosters.length}|${totalPlayers}|${currentWeek}`
  if(_buzzCache.has(cacheKey))return _buzzCache.get(cacheKey)
  const cutoff14=Date.now()-14*86400000
  const recentPicks=allPicks.filter(p=>p.film_id===film.id&&new Date(p.picked_at).getTime()>cutoff14).length
  const watchScore=Math.min(100,(recentPicks/Math.max(1,totalPlayers))*150)
  const newsForFilm=news.filter(n=>n.film_id===film.id)
  let signalScore=0
  newsForFilm.forEach(n=>{
    const ageDays=(Date.now()-new Date(n.signal_date).getTime())/86400000
    const decay=Math.max(0,1-ageDays/21)
    const sentBoost=n.sentiment==='positive'?1:n.sentiment==='negative'?-0.5:0.4
    signalScore+=decay*sentBoost*15
  })
  signalScore=Math.max(0,Math.min(100,signalScore))
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
  const composite=watchScore*0.30+signalScore*0.30+ownerScore*0.20+timeScore*0.20
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
    ownershipMult=pct>=0.7?1.30:pct>=0.55?1.22:pct>=0.40?1.15:pct>=0.25?1.08:pct>=0.10?1.00:pct>=0.02?0.92:0.80
  }
  let timeMult=1
  if(currentWeek!=null&&film.week!=null){
    const weeksOut=film.week-currentWeek
    timeMult=weeksOut>=8?0.78:weeksOut>=6?0.86:weeksOut>=4?0.95:weeksOut>=2?1.00:weeksOut===1?1.10:weeksOut===0?1.18:0.95
  }
  const rtMult=film.rt!=null
    ?(film.rt>=90?1.15:film.rt>=80?1.08:film.rt>=70?1.03:film.rt>=55?1.00:film.rt>=40?0.93:0.85)
    :1.0
  let signalMult=1
  if(filmNews.length){
    const cutoff=Date.now()-14*86400000
    const recent=filmNews.filter(n=>n.film_id===film.id&&new Date(n.signal_date).getTime()>cutoff&&n.price_impact!=null)
    if(recent.length){
      const cumulative=recent.reduce((s,n)=>s+Number(n.price_impact),0)
      const capped=Math.max(-25,Math.min(25,cumulative))
      signalMult=1+(capped/100)
    }
  }
  let buzzMult=1
  if(allPicks.length&&totalPlayers>0){
    const cutoff=Date.now()-7*86400000
    const recentWatch=allPicks.filter(p=>p.film_id===film.id&&new Date(p.picked_at).getTime()>cutoff).length
    const intensity=recentWatch/Math.max(1,totalPlayers)
    buzzMult=intensity>=0.8?1.06:intensity>=0.5?1.03:intensity>=0.25?1.01:1.00
  }
  return{ownershipMult,timeMult,rtMult,signalMult,buzzMult}
}

function calcDemandMult(film,rosters,phase,totalPlayers,currentWeek=null,filmNews=[],allPicks=[]){
  if(film.hasResult)return 1
  const d=calcPriceDrivers(film,rosters,phase,totalPlayers,currentWeek,filmNews,allPicks)
  const composite=d.ownershipMult*d.timeMult*d.rtMult*d.signalMult*d.buzzMult
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

// ── PLAYER TASTE CARD GENERATOR (post-launch feature) ────────────────────────
// Auto-generates a personality description from a player's picks
function generateTasteCard(playerId,allPicks,films,results,rosters){
  const myPicks=allPicks.filter(p=>p.user_id===playerId)
  const myRosters=rosters.filter(r=>r.player_id===playerId)
  const filmIds=[...new Set([...myPicks.map(p=>p.film_id),...myRosters.map(r=>r.film_id)])]
  const myFilms=filmIds.map(id=>films.find(f=>f.id===id)).filter(Boolean)
  if(myFilms.length<3)return null
  // Genre breakdown
  const genreCount={}
  myFilms.forEach(f=>{genreCount[f.genre]=(genreCount[f.genre]||0)+1})
  const topGenres=Object.entries(genreCount).sort((a,b)=>b[1]-a[1])
  // Indie vs blockbuster preference (using estM as proxy)
  const avgEstM=myFilms.reduce((s,f)=>s+f.estM,0)/myFilms.length
  const sizeLabel=avgEstM<25?'low-budget indie':avgEstM<60?'mid-tier discovery':avgEstM<120?'theatrical event':'tentpole blockbuster'
  // Distributor loyalty
  const distCount={}
  myFilms.forEach(f=>{distCount[f.dist]=(distCount[f.dist]||0)+1})
  const topDist=Object.entries(distCount).sort((a,b)=>b[1]-a[1])[0]
  const distLoyalty=topDist&&topDist[1]>=3?topDist[0]:null
  // Hit rate on resulted films
  const resulted=myFilms.filter(f=>results[f.id]!=null)
  const hits=resulted.filter(f=>results[f.id]/f.estM>=1.1).length
  const hitRate=resulted.length>=2?Math.round(hits/resulted.length*100):null
  // Early bird tendency
  const earlyPicks=myRosters.filter(r=>{
    const f=films.find(fl=>fl.id===r.film_id);if(!f)return false
    return f.week-(r.acquired_week||r.bought_week||0)>=EARLY_BIRD_WEEKS
  }).length
  const earlyPct=myRosters.length?Math.round(earlyPicks/myRosters.length*100):0
  const styleLabel=earlyPct>=60?'early-mover scout':earlyPct>=30?'timing-aware':'momentum buyer'
  return{
    primaryGenre:topGenres[0]?.[0]||null,
    secondaryGenre:topGenres[1]?.[0]||null,
    avgScale:sizeLabel,
    distLoyalty,
    hitRate,
    earlyPct,
    styleLabel,
    filmCount:myFilms.length,
    resultedCount:resulted.length,
  }
}

function PlayerProfilePage({player,films,rosters,results,weeklyG,allChips,auteurDecl,wwWinners,oscarPreds,allPicks,calcPoints,calcPhasePoints,budgetLeft,cur,isEarlyBird,analystActive,auteurBonus,shortBonus,wwBonus,curPhase_ref,onBack}){
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
  const taste=generateTasteCard(player.id,allPicks||[],films,results,rosters)

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
            <div style={{flex:1}}><div style={{fontSize:'26px',fontWeight:900,color:pc,letterSpacing:'-0.5px'}}>{player.name}</div><div style={{fontSize:'13px',color:T.textSub,marginTop:'6px'}}>{activeNow.length} films active · {budgetLeft(player.id)}M left</div>{player.bio&&<div style={{fontSize:'12px',color:T.textSub,marginTop:'4px',fontStyle:'italic'}}>"{player.bio}"</div>}</div>
            <div style={{textAlign:'right'}}><div style={{fontSize:'48px',fontWeight:900,color:T.gold,lineHeight:1,letterSpacing:'-2px'}}>{totalPts}</div><div style={S.label}>grand pts</div></div>
          </div>
        </div>

        {/* TASTE CARD — auto-generated personality */}
        {taste&&(
          <div style={{background:`linear-gradient(135deg,${pc}10,${T.surface})`,border:`1px solid ${pc}33`,borderRadius:'14px',padding:'16px 18px',marginBottom:'16px'}}>
            <div style={{...S.label,color:pc,marginBottom:'10px'}}>🎭 Taste Profile</div>
            <div style={{fontSize:'13px',color:T.text,lineHeight:1.7}}>
              <strong style={{color:pc}}>{player.name}</strong> is a <strong style={{color:T.gold}}>{taste.styleLabel}</strong>{taste.primaryGenre&&<> who leans <strong style={{color:GENRE_COL[taste.primaryGenre]||T.gold}}>{taste.primaryGenre.toLowerCase()}</strong></>}{taste.secondaryGenre&&<>, with strong picks in <strong style={{color:GENRE_COL[taste.secondaryGenre]||T.gold}}>{taste.secondaryGenre.toLowerCase()}</strong></>}. Tends towards <strong style={{color:T.text}}>{taste.avgScale}</strong> films{taste.distLoyalty&&<>, with <strong style={{color:T.gold}}>{taste.distLoyalty}</strong> as a recurring distributor</>}.
              {taste.hitRate!=null&&<> Has <strong style={{color:taste.hitRate>=60?T.green:taste.hitRate>=45?T.gold:T.red}}>{taste.hitRate}% overperform rate</strong> across {taste.resultedCount} resulted films.</>}
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'12px',flexWrap:'wrap'}}>
              {taste.primaryGenre&&<Pill color={GENRE_COL[taste.primaryGenre]||T.gold}>{taste.primaryGenre}</Pill>}
              {taste.secondaryGenre&&<Pill color={GENRE_COL[taste.secondaryGenre]||T.textSub}>{taste.secondaryGenre}</Pill>}
              <Pill color={T.orange}>{taste.styleLabel}</Pill>
              {taste.earlyPct>=50&&<Pill color={T.green}>🐦 {taste.earlyPct}% early</Pill>}
              {taste.hitRate!=null&&taste.hitRate>=60&&<Pill color={T.green}>🎯 {taste.hitRate}% hit rate</Pill>}
            </div>
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

function FilmDetailModal({film,profile,players,results,allPicks=[],marketingEvents=[],news=[],rosters=[],filmValues={},currentWeek=null,phase=1,onTogglePick,onBookingClick,onShowtimes,onClose,league}){
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
            {results[film.id]==null&&(()=>{
              const drivers=calcPriceDrivers(film,rosters,phase,players.length,currentWeek,news,allPicks)
              const basePrice=filmValues[film.id]??film.basePrice
              const composite=drivers.ownershipMult*drivers.timeMult*drivers.rtMult*drivers.signalMult*drivers.buzzMult
              const finalPrice=Math.round(basePrice*composite)
              const buzz=calcBuzzIndex({...film,hasResult:false},allPicks,news,rosters,players.length,currentWeek,finalPrice)
              const rows=[
                {label:'Ownership',mult:drivers.ownershipMult,desc:`${rosters.filter(r=>r.film_id===film.id&&r.phase===phase&&r.active).length}/${players.length} players hold`},
                {label:'Time to Release',mult:drivers.timeMult,desc:currentWeek!=null?`${film.week-currentWeek} week${film.week-currentWeek===1?'':'s'} out`:'—'},
                {label:'Rotten Tomatoes',mult:drivers.rtMult,desc:film.rt!=null?`${film.rt}% critic score`:'No score yet'},
                {label:'News Signals',mult:drivers.signalMult,desc:(()=>{
                  const cutoff=Date.now()-14*86400000
                  const recent=news.filter(n=>n.film_id===film.id&&new Date(n.signal_date).getTime()>cutoff&&n.price_impact!=null)
                  return recent.length?`${recent.length} signal${recent.length===1?'':'s'} (14d)`:'No recent signals'
                })()},
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
          </>}
        </div>
      </div>
    </div>
  )
}


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
  const leaveLeague=async()=>{
    if(!league||!confirm(`Leave ${league.name}?`)) return
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
    setDataLoading(true)
    const memberIds=(await supabase.from('league_members').select('user_id').eq('league_id',lid)).data?.map(m=>m.user_id)||[]
    // CRITICAL: load films FIRST so UI can render, then everything else in parallel
    const[{data:fl},{data:cf}]=await Promise.all([
      supabase.from('films').select('*').eq('active',true).order('phase').order('week'),
      supabase.from('league_config').select('*').eq('league_id',lid).maybeSingle(),
    ])
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
      loadPolls(lid)
    },100)
  }

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

  const advancePhase=async()=>{
    if(!confirm(`Advance to Phase ${curPhase()+1}? This will bank budgets for all players.`)) return
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
      await supabase.from('league_config').update({
        current_phase:nextPhase,
        phase_window_active:false,
        phase_window_opened_at:null,
        draft_window_open:false,
        draft_deadline:null,
      }).eq('league_id',league?.id)
      await logActivity(session.user.id,'phase_advance',{from_phase:completedPhase,to_phase:nextPhase,league:league?.name},league?.id)
      await sendNotification('phase_advance',{league_id:league?.id,from_phase:completedPhase,to_phase:nextPhase,players:players.map(p=>({id:p.id}))})
      setPhaseCeremony({phase:completedPhase,scores:phaseScores,winner:phaseWinner,mvp:mvpHolding,chipWinner,chipWin})
      if(phaseWinner?.pts>0)triggerConfetti()
      loadData(league?.id)
    }catch(e){notify(`Phase transition failed: ${e.message}`,T.red)}
    setPhaseTransitioning(false)
  }

  const filmVal=(film)=>Math.round((filmValues[film.id]??film.basePrice)*calcDemandMult(film,rosters,curPhase(),players.length,cfg.current_week,news,allPicks))
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

  const inviteFromUrl=(()=>{const p=window.location.pathname,q=new URLSearchParams(window.location.search);return p.match(/\/join\/([A-Z0-9-]+)/i)?.[1]?.toUpperCase()||q.get('invite')?.toUpperCase()||null})()
  if(inviteFromUrl&&!session&&!loading)return <InviteLanding code={inviteFromUrl} onLogin={()=>{setInviteCode(inviteFromUrl)}}/>
  if(loading)return(<div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono}}><div style={{textAlign:'center'}}><div style={{fontSize:'52px',fontWeight:900,color:T.gold,letterSpacing:'-2px',marginBottom:'16px'}}>BOXD</div><div style={{width:'40px',height:'3px',background:T.gold,borderRadius:'2px',margin:'0 auto',animation:'pulse 1.2s ease-in-out infinite'}}/></div></div>)
  if(!session)return<Login/>
  if(inviteFromUrl&&inviteCode!==inviteFromUrl)setInviteCode(inviteFromUrl)
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
          <button onClick={()=>setLeaguePage('create')} style={{...S.btn,flex:1,background:leaguePage==='create'?T.gold:T.surfaceUp,color:leaguePage==='create'?'#0D0A08':T.textSub,border:`1px solid ${leaguePage==='create'?T.gold:T.border}`,padding:'10px',fontSize:'13px',textTransform:'none',letterSpacing:0}}>+ Create League</button>
          <button onClick={()=>setLeaguePage('join')} style={{...S.btn,flex:1,background:leaguePage==='join'?T.blue:T.surfaceUp,color:leaguePage==='join'?'#fff':T.textSub,border:`1px solid ${leaguePage==='join'?T.blue:T.border}`,padding:'10px',fontSize:'13px',textTransform:'none',letterSpacing:0}}>Join League</button>
        </div>
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
    ...(hasFridayForecasts||hasResults?[{id:'friday',icon:'🎯',label:'Weekend Forecast'}]:[]),
    ...(polls.length>0?[{id:'polls',icon:'🗳',label:'Polls'}]:[]),
    {id:'intent',icon:'👁️',label:'Watchlist'},
    {id:'trades',icon:'🔄',label:'Trades'},
    ...(sealedWindowOpen?[{id:'sealed',icon:'🔒',label:'Sealed Bid'}]:[]),
    {id:'forecaster',icon:'📊',label:'Forecaster'},
    {id:'oscar',icon:'🏆',label:'Oscars'},
    {id:'results',icon:'📋',label:'Results'},
    {id:'howto',icon:'❓',label:'How to Play'},
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
                    {n.price_impact!=null&&Math.abs(n.price_impact)>=2&&<span style={{color:col,fontSize:'11px',marginLeft:'8px',fontWeight:700,fontFamily:T.mono}}>{n.price_impact>0?'▲':'▼'}{Math.abs(n.price_impact).toFixed(0)}%</span>}
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
  const MarketPage=()=>{
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

        {/* NEWS TICKER · hidden until first buy */}
        {hasEverBought&&<NewsTickerStrip/>}

        {/* WEEKEND LIVE — Fri 5pm-Sun 11pm · hidden until player has bought first film */}
        {hasEverBought&&(()=>{
          const now=new Date()
          const day=now.getDay();const hr=now.getHours()
          const isWeekendLive=(day===5&&hr>=17)||day===6||(day===0&&hr<=23)
          if(!isWeekendLive)return null
          const opening=films.filter(f=>f.week===cfg.current_week&&results[f.id]==null).slice(0,4)
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

        {/* THE PULSE — daily check-in · hidden until player has bought first film */}
        {hasEverBought&&(()=>{
          const cutoff=Date.now()-48*3600000
          const movers=films.filter(f=>results[f.id]==null).map(f=>{
            const recent=news.filter(n=>n.film_id===f.id&&new Date(n.signal_date).getTime()>cutoff&&n.price_impact!=null)
            const move=recent.reduce((s,n)=>s+Number(n.price_impact),0)
            return{f,move}
          }).filter(x=>Math.abs(x.move)>=3).sort((a,b)=>Math.abs(b.move)-Math.abs(a.move)).slice(0,3)
          const openingWeek=films.filter(f=>f.week===cfg.current_week&&results[f.id]==null).slice(0,3)
          const heating=films.filter(f=>results[f.id]==null).map(f=>({f,buzz:calcBuzzIndex({...f,hasResult:false},allPicks,news,rosters,players.length,cfg.current_week)||0})).sort((a,b)=>b.buzz-a.buzz).slice(0,3)
          if(movers.length===0&&openingWeek.length===0&&heating.length===0)return null
          return(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'10px',marginBottom:'14px'}}>
              {movers.length>0&&<div style={{...S.card,padding:'12px'}}>
                <div style={{...S.label,marginBottom:'8px',color:T.gold}}>📊 Movers (48h)</div>
                {movers.map(({f,move})=>(
                  <div key={f.id} onClick={()=>setFilmDetail(f)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',cursor:'pointer'}}>
                    <span style={{fontSize:'12px',color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'70%'}}>{f.title.split(':')[0]}</span>
                    <span style={{fontSize:'12px',color:move>0?T.green:T.red,fontFamily:T.mono,fontWeight:700}}>{move>0?'▲':'▼'}{Math.abs(move).toFixed(0)}%</span>
                  </div>
                ))}
              </div>}
              {openingWeek.length>0&&<div style={{...S.card,padding:'12px'}}>
                <div style={{...S.label,marginBottom:'8px',color:T.green}}>🎬 Opening This Week</div>
                {openingWeek.map(f=>(
                  <div key={f.id} onClick={()=>setFilmDetail(f)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',cursor:'pointer'}}>
                    <span style={{fontSize:'12px',color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'70%'}}>{f.title.split(':')[0]}</span>
                    <span style={{fontSize:'11px',color:T.textSub,fontFamily:T.mono}}>${f.estM}M</span>
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

        <div className="film-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'10px'}}>
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
                      {/* Price change indicator — based on news signals in last 48h */}
                      {actual==null&&(()=>{
                        const cutoff=Date.now()-48*3600000
                        const recent=news.filter(n=>n.film_id===film.id&&new Date(n.signal_date).getTime()>cutoff&&n.price_impact!=null)
                        if(!recent.length)return null
                        const move=recent.reduce((s,n)=>s+Number(n.price_impact),0)
                        if(Math.abs(move)<2)return null
                        return <span style={{fontSize:'10px',fontWeight:700,color:move>0?T.green:T.red,fontFamily:T.mono,flexShrink:0}}>{move>0?'▲':'▼'}{Math.abs(move).toFixed(0)}%</span>
                      })()}
                    </div>
                    <div style={{fontSize:'11px',color:T.textSub,marginTop:'2px',display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                      <span>{film.dist}</span>
                      {film.rt!=null&&<><span style={{color:T.textDim}}>·</span><span style={{color:film.rt>=75?T.green:film.rt>=55?T.gold:T.red}}>RT {film.rt}%</span></>}
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
                      <div style={{fontSize:'15px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>${val}M</div>
                    </div>
                    {!owned&&actual==null&&<Btn onClick={e=>{e.stopPropagation();buyFilm(film)}} color={T.gold} size="sm">Buy</Btn>}
                    {owned&&actual==null&&<Btn onClick={e=>{e.stopPropagation();sellFilm(film)}} color={T.red} textColor="#fff" size="sm">Sell</Btn>}
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
        if(auteurOn(profile.id,film.id))op=Math.round(op*1.1)
        const wp=Math.round(calcWeeklyPts(weeklyG[film.id]||{}))
        const lb=calcLegsBonus(actual,weeklyG[film.id]?.[2])
        const wb=wwBonus(film.id),sb=shortBonus(profile.id,film.id)
        const total=op+wp+lb+wb+sb
        return(
          <div key={h.id} className="hoverable" onClick={()=>setScoreModal({film,holding:h})} style={{...S.card,marginBottom:'10px',cursor:'pointer'}}>
            <div style={{display:'flex',gap:'12px'}}>
              <FilmPoster film={film} width={50} height={75} radius={7}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'14px',fontWeight:700,marginBottom:'4px'}}>{film.title}</div>
                <div style={{fontSize:'11px',color:T.textSub,marginBottom:'8px'}}>{film.dist} · W{film.week} · Bought ${h.bought_price}M{eb&&' · 🐦 EB'}</div>
                {actual!=null?<div style={{display:'flex',gap:'10px',alignItems:'baseline'}}>
                  <span style={{fontSize:'10px',color:T.textDim,letterSpacing:'1.5px'}}>SCORED</span>
                  <span style={{fontSize:'20px',fontWeight:900,color:T.gold,fontFamily:T.mono}}>{total}pts</span>
                </div>:<div style={{display:'flex',gap:'10px',alignItems:'baseline'}}>
                  <span style={{fontSize:'10px',color:T.textDim,letterSpacing:'1.5px'}}>VALUE</span>
                  <span style={{fontSize:'18px',fontWeight:800,color:T.gold,fontFamily:T.mono}}>${filmVal(film)}M</span>
                  <span style={{fontSize:'11px',color:filmVal(film)>h.bought_price?T.green:filmVal(film)<h.bought_price?T.red:T.textSub,fontFamily:T.mono}}>{filmVal(film)>h.bought_price?'+':''}{filmVal(film)-h.bought_price}M</span>
                </div>}
              </div>
              {actual==null&&<Btn onClick={e=>{e.stopPropagation();sellFilm(film)}} color={T.red} textColor="#fff" size="sm" sx={{alignSelf:'center'}}>Sell</Btn>}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── HOW TO PLAY PAGE ─────────────────────────────────────────────────────
  const HowToPlayPage=()=>{
    const Step=({n,title,desc})=>(
      <div style={{display:'flex',gap:'14px',marginBottom:'16px'}}>
        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'14px',flexShrink:0}}>{n}</div>
        <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:700,marginBottom:'3px'}}>{title}</div><div style={{fontSize:'13px',color:T.textSub,lineHeight:1.5}}>{desc}</div></div>
      </div>
    )
    return(
      <div style={{animation:'fadeUp .2s ease',maxWidth:'640px'}}>
        <div style={S.pageTitle}>How to play</div>
        <div style={{fontSize:'13px',color:T.textSub,marginBottom:'24px',lineHeight:1.6}}>BOXD is fantasy box office. You pick films you think will overperform, then earn points when results land.</div>
        <div style={{...S.card,marginBottom:'14px'}}>
          <div style={{...S.label,marginBottom:'14px',color:T.gold}}>The basics</div>
          <Step n="1" title="Pick films" desc={`Up to ${MAX_ROSTER} films per phase. Each phase has a budget you spend on them.`}/>
          <Step n="2" title="Results land Monday" desc="Every Monday, real opening weekend numbers update prices and lock in points for last week's films."/>
          <Step n="3" title="Score points" desc="Better-than-expected = more points. Critic scores, multi-week legs, and Weekend #1 add bonuses."/>
          <Step n="4" title="Use chips wisely" desc="Each player has 4 one-time chips: Recut, Short, Analyst, Auteur. Save them for the right moment."/>
        </div>
        <div style={{...S.card,marginBottom:'14px'}}>
          <div style={{...S.label,marginBottom:'10px',color:T.green}}>Scoring quick-reference</div>
          <div style={{fontSize:'12px',color:T.textSub,lineHeight:1.8}}>
            • Opening pts = actual gross × performance multiplier (0.45–2.0×) × RT bonus<br/>
            • 🐦 <strong style={{color:T.green}}>Early Bird +10%</strong> if you bought {EARLY_BIRD_WEEKS}+ weeks before release<br/>
            • 🎯 <strong style={{color:T.blue}}>Analyst +60pts</strong> if your forecast is within 10%<br/>
            • 🎭 <strong style={{color:T.orange}}>Auteur +10%</strong> on all films from your declared actor<br/>
            • 🦵 <strong style={{color:T.green}}>Legs +25</strong> if W2 drop is under 30%<br/>
            • 🥇 <strong style={{color:T.gold}}>Weekend #1 +15</strong> if your film tops the chart
          </div>
        </div>
        <div style={{...S.card,marginBottom:'14px'}}>
          <div style={{...S.label,marginBottom:'10px',color:T.blue}}>Pro tips</div>
          <div style={{fontSize:'12px',color:T.textSub,lineHeight:1.8}}>
            • <strong>Watch the Buzz Index.</strong> When it climbs past 70 the price will too.<br/>
            • <strong>Get in early.</strong> Films are cheapest 6+ weeks out — that's where your conviction shows.<br/>
            • <strong>Read the Signals page.</strong> News moves prices ±25% over 14 days.<br/>
            • <strong>Use the phase window.</strong> Each phase has a free-trade window — drop dead weight for zero fees.
          </div>
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
    const shortStatus=chips?.short_film_id?(()=>{const f=films.find(fl=>fl.id===chips.short_film_id);return `📉 ${f?.title||'?'} · ${chips.short_result||'pending'}`})():null
    const analystStatus=chips?.analyst_film_id?(()=>{const f=films.find(fl=>fl.id===chips.analyst_film_id);return `🎯 ${f?.title||'?'} · ${chips.analyst_result||'pending'}`})():null
    const auteurStatus=(()=>{const a=auteurDecl.find(a=>a.player_id===profile.id&&a.phase===ph);return a?`🎭 ${a.star_actor} · ${a.film_ids?.length||0} films`:null})()
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>Your Chips</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Each chip is one-time use across the whole season.</div>
        <ChipCard icon="🎬" name="THE RECUT" color={T.purple} used={recutUsed} onClick={activateRecut} desc="Clear your entire roster with zero transaction fees. Press the reset button when things go wrong."/>
        <ChipCard icon="📉" name="SHORT" color={T.red} used={shortUsed} status={shortStatus} onClick={()=>setChipModal('short')} desc="Bet against a film. If it underperforms by 40%+, win 100pts. If it overperforms or breaks even, lose 30pts."/>
        <ChipCard icon="🎯" name="ANALYST" color={T.blue} used={analystUsed} status={analystStatus} onClick={()=>setChipModal('analyst')} desc="Pick a film you own and predict its opening number. Within 10% = +60pts bonus on top of normal scoring."/>
        <ChipCard icon="🎭" name="AUTEUR" color={T.orange} used={!!auteurDecl.find(a=>a.player_id===profile.id&&a.phase===ph)} status={auteurStatus} onClick={()=>setChipModal('auteur')} desc="Declare an actor and 2+ films they appear in this phase. All their films get +10% opening pts."/>
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
    const [edit,setEdit]=useState({})
    const fcFilms=films.filter(f=>f.phase===ph&&results[f.id]==null)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>The Forecaster</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Predict opening weekends. Most accurate per phase wins +15pts. Most accurate over the season wins +50pts.</div>
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
    const eligible=films.filter(f=>['Drama','Awards','Animation'].includes(f.genre)||f.phase>=4)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>🏆 Oscar Pick</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Pick the eventual Best Picture winner. Correct = +75pts at end of season.</div>
        {myOscar?(()=>{const pick=films.find(f=>f.id===myOscar.best_picture_film_id);return(
          <div style={{...S.card,padding:'24px',textAlign:'center',background:`linear-gradient(135deg,${T.gold}14,${T.surface})`,border:`1px solid ${T.gold}66`}}>
            {pick&&<><FilmPoster film={pick} width={120} height={180} radius={10}/><div style={{fontSize:'18px',fontWeight:700,marginTop:'12px',marginBottom:'4px'}}>{pick.title}</div><div style={{fontSize:'12px',color:T.textSub,marginBottom:'10px'}}>{pick.dist}</div></>}
            <Pill color={myOscar.correct==null?T.gold:myOscar.correct?T.green:T.red}>{myOscar.correct==null?'Locked':myOscar.correct?'✓ Correct +75pts':'✗ Wrong'}</Pill>
          </div>
        )})():<>{eligible.map(f=>(
          <div key={f.id} className="hoverable" onClick={()=>{if(confirm(`Lock in ${f.title} as your Best Picture pick? You can't change it later.`))submitOscarPick(f.id)}} style={{...S.card,marginBottom:'8px',cursor:'pointer',display:'flex',gap:'12px',alignItems:'center'}}>
            <FilmPoster film={f} width={42} height={63} radius={6}/>
            <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{f.dist} · {f.genre}{f.rt!=null?` · RT ${f.rt}%`:''}</div></div>
            <div style={{color:T.gold,fontSize:'18px'}}>›</div>
          </div>
        ))}</>}
      </div>
    )
  }

  // ── RESULTS PAGE ─────────────────────────────────────────────────────────
  const ResultsPage=()=>{
    const resulted=films.filter(f=>results[f.id]!=null).sort((a,b)=>b.week-a.week||b.phase-a.phase)
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>Results</div>
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
                {n.price_impact!=null&&<div style={{fontSize:'13px',fontWeight:700,color:col,fontFamily:T.mono,flexShrink:0}}>{n.price_impact>0?'+':''}{n.price_impact}%</div>}
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
  const CommunityPage=()=>{
    const[tab,setTab]=useState('anticipated')
    const TabBtn=({id,label})=><button onClick={()=>setTab(id)} style={{...S.btn,background:'none',border:'none',padding:'8px 14px',fontSize:'12px',fontWeight:tab===id?700:400,color:tab===id?T.gold:T.textSub,borderBottom:`2px solid ${tab===id?T.gold:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0}}>{label}</button>
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>Community</div>
        <div style={{display:'flex',gap:'4px',borderBottom:`1px solid ${T.border}`,marginBottom:'14px'}}>
          <TabBtn id="anticipated" label="🔥 Most Anticipated"/>
          <TabBtn id="watchlists" label="👁 Watchlists"/>
          <TabBtn id="players" label="👥 Players"/>
        </div>
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
          const taste=generateTasteCard(p.id,allPicks,films,results,rosters)
          return(
            <div key={p.id} className="hoverable" onClick={()=>goToProfile(p)} style={{...S.card,marginBottom:'8px',cursor:'pointer',display:'flex',gap:'12px',alignItems:'center'}}>
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:p.color||T.gold,color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',fontWeight:700,flexShrink:0}}>{p.name?.[0]||'?'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'14px',fontWeight:700,color:p.color||T.gold}}>{p.name}</div>
                {taste?<div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{taste.styleLabel}{taste.primaryGenre?` · ${taste.primaryGenre}`:''}{taste.hitRate!=null?` · ${taste.hitRate}% hit rate`:''}</div>:<div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{rosters.filter(r=>r.player_id===p.id).length} films picked</div>}
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
  const DistributorPage=()=>{
    const dists=[...new Set(films.map(f=>f.dist))]
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>📈 Distributor Insights</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>How the league reads each distributor's slate</div>
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
            <div key={d} style={{...S.card,marginBottom:'12px'}}>
              <div style={{fontSize:'15px',fontWeight:700,color:T.blue,marginBottom:'4px'}}>{d}</div>
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
  const CommissionerPage=()=>{
    const [tab,setTab]=useState('phase')
    const TabBtn=({id,label})=><button onClick={()=>setTab(id)} style={{...S.btn,background:'none',border:'none',padding:'8px 14px',fontSize:'12px',fontWeight:tab===id?700:400,color:tab===id?T.gold:T.textSub,borderBottom:`2px solid ${tab===id?T.gold:'transparent'}`,borderRadius:0,textTransform:'none',letterSpacing:0}}>{label}</button>
    const runIngest=async()=>{
      if(!confirm('Run box office ingest now?'))return
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
          <TabBtn id="phase" label="Phase"/><TabBtn id="windows" label="Windows"/><TabBtn id="films" label="Films"/><TabBtn id="advanced" label="Advanced"/>
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
              <Btn onClick={async()=>{await supabase.from('league_config').update({current_week:cfg.current_week+1}).eq('league_id',league?.id);loadData(league?.id);notify(`Week ${cfg.current_week+1}`,T.gold)}} color={T.gold} size="sm">Week +1</Btn>
              <Btn onClick={async()=>{await supabase.from('league_config').update({current_week:Math.max(1,cfg.current_week-1)}).eq('league_id',league?.id);loadData(league?.id);notify(`Week ${cfg.current_week-1}`,T.gold)}} variant="outline" color={T.gold} size="sm">Week −1</Btn>
              <Btn onClick={advancePhase} color={T.purple} textColor="#fff" size="sm" disabled={phaseTransitioning}>Advance Phase →</Btn>
            </div>
          </div>

          {/* SAMPLE SIGNALS — launch helper */}
          <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.red}33`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div><div style={{fontSize:'14px',fontWeight:700,color:T.red}}>📡 Sample Signals</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>One-click seed · launch-day kickstart</div></div>
              <Btn onClick={async()=>{
                if(!confirm('Add 8 sample news signals to kickstart the league?'))return
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
                    sentiment:s.sent,price_impact:s.imp,
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
              await supabase.from('league_config').update({phase_window_active:newState,phase_window_opened_at:newState?new Date().toISOString():null}).eq('league_id',league?.id)
              loadData(league?.id);notify(`Window ${newState?'opened':'closed'}`,newState?T.green:T.red)
            }} color={win?T.red:T.green} textColor={win?'#fff':'#0D0A08'} size="sm">{win?'Close Window':'Open Window'}</Btn>
          </div>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.orange}}>Draft Window</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'12px'}}>Players must pick {DRAFT_MIN}+ films during draft or face {DRAFT_PENALTY}pt penalty each.</div>
            <Btn onClick={async()=>{
              const newState=!draftWindowOpen
              const dl=newState?new Date(Date.now()+72*3600000).toISOString():null
              await supabase.from('league_config').update({draft_window_open:newState,draft_deadline:dl}).eq('league_id',league?.id)
              loadData(league?.id);notify(`Draft ${newState?'opened':'closed'}`,newState?T.green:T.red)
            }} color={draftWindowOpen?T.red:T.orange} textColor="#fff" size="sm">{draftWindowOpen?'Close Draft':'Open Draft'}</Btn>
          </div>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.blue}}>Sealed-bid Window</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'12px'}}>For high-demand films · highest blind bid wins.</div>
            <Btn onClick={async()=>{
              const newState=!sealedWindowOpen
              const dl=newState?new Date(Date.now()+48*3600000).toISOString():null
              await supabase.from('league_config').update({sealed_bid_window_open:newState,sealed_bid_deadline:dl}).eq('league_id',league?.id)
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
            <div style={{fontSize:'11px',color:T.textSub}}>Use War Room to enter weekend results in bulk.</div>
          </div>
        </>}

        {tab==='advanced'&&<>
          <div style={{...S.card,marginBottom:'12px'}}>
            <div style={{...S.label,marginBottom:'8px',color:T.red}}>League Settings</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'10px'}}>Invite code: <strong style={{color:T.gold}}>{league?.invite_code}</strong></div>
            <div style={{fontSize:'11px',color:T.textDim,marginBottom:'12px'}}>Share: boxd-league-v2.vercel.app/join/{league?.invite_code}</div>
            <Btn onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/join/${league?.invite_code}`);notify('Invite link copied',T.green)}} variant="outline" color={T.green} size="sm">Copy Invite Link</Btn>
          </div>
        </>}
      </div>
    )
  }


  // ── WAR ROOM PAGE — batch results entry ──────────────────────────────────
  const WarRoomPage=()=>{
    const[entries,setEntries]=useState({})
    const upcoming=films.filter(f=>f.week<=cfg.current_week&&results[f.id]==null)
    const saveAll=async()=>{
      const toSave=Object.entries(entries).filter(([_,v])=>v.actual&&!isNaN(Number(v.actual)))
      if(toSave.length===0)return notify('Nothing to save',T.red)
      for(const[filmId,v] of toSave){
        await dbUpsert('results','film_id',filmId,{actual_m:Number(v.actual)})
        const film=films.find(f=>f.id===filmId)
        if(film){await dbUpsert('film_values','film_id',filmId,{current_value:calcMarketValue(film,Number(v.actual))});resolveChips(filmId,Number(v.actual))}
        if(v.week2)await dbUpsertWeekly(filmId,2,Number(v.week2))
        if(v.week3)await dbUpsertWeekly(filmId,3,Number(v.week3))
      }
      notify(`✓ Saved ${toSave.length} result${toSave.length!==1?'s':''}`,T.green)
      setEntries({});loadData(league?.id)
    }
    return(
      <div style={{animation:'fadeUp .2s ease'}}>
        <div style={S.pageTitle}>⚡ War Room</div>
        <div style={{fontSize:'12px',color:T.textSub,marginBottom:'14px'}}>Batch enter weekend results · saves all at once</div>
        {upcoming.length===0?<div style={{...S.card,textAlign:'center',padding:'40px',color:T.textSub}}>All caught up.</div>:<>
          {upcoming.map(f=>(
            <div key={f.id} style={{...S.card,marginBottom:'8px'}}>
              <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'10px'}}>
                <FilmPoster film={f} width={42} height={63} radius={6}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:600}}>{f.title}</div>
                  <div style={{fontSize:'11px',color:T.textSub}}>{f.dist} · W{f.week} · est ${f.estM}M</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                <input value={entries[f.id]?.actual||''} onChange={e=>setEntries({...entries,[f.id]:{...entries[f.id],actual:e.target.value}})} placeholder="Opening" style={{...S.inp,fontSize:'12px'}}/>
                <input value={entries[f.id]?.week2||''} onChange={e=>setEntries({...entries,[f.id]:{...entries[f.id],week2:e.target.value}})} placeholder="Week 2" style={{...S.inp,fontSize:'12px'}}/>
                <input value={entries[f.id]?.week3||''} onChange={e=>setEntries({...entries,[f.id]:{...entries[f.id],week3:e.target.value}})} placeholder="Week 3" style={{...S.inp,fontSize:'12px'}}/>
              </div>
            </div>
          ))}
          <Btn onClick={saveAll} color={T.green} textColor="#0D0A08" full size="lg" sx={{marginTop:'12px'}}>Save All Results</Btn>
        </>}
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
      {[1,2,3,4,5].map(phN=>{
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
    const save=async()=>{
      await supabase.from('profiles').update({name:name.trim(),bio:bio.trim(),color:col}).eq('id',profile.id)
      loadProfile();notify('Profile updated',T.green);setProfileEditOpen(false)
    }
    return(
      <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900,padding:'20px'}} onClick={()=>setProfileEditOpen(false)}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'380px'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:'18px',fontWeight:700,marginBottom:'16px'}}>Edit profile</div>
          <div style={{...S.label,marginBottom:'6px'}}>Name</div>
          <input value={name} onChange={e=>setName(e.target.value)} style={{...S.inp,marginBottom:'14px'}}/>
          <div style={{...S.label,marginBottom:'6px'}}>Bio</div>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="One-line tagline…" style={{...S.inp,minHeight:'60px',marginBottom:'14px',resize:'vertical',fontFamily:T.mono}}/>
          <div style={{...S.label,marginBottom:'10px'}}>Colour</div>
          <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
            {PLAYER_COLORS.map(c=><div key={c} onClick={()=>setCol(c)} style={{width:'30px',height:'30px',borderRadius:'50%',background:c,cursor:'pointer',border:`3px solid ${col===c?'#fff':'transparent'}`,boxSizing:'border-box'}}/>)}
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
    const[imp,setImp]=useState(5)
    const submit=async()=>{
      if(!head.trim())return notify('Need a headline',T.red)
      await supabase.from('news_signals').insert({league_id:league?.id,film_id:selFilm||null,signal_type:type,headline:head.trim(),detail:det.trim()||null,sentiment:sent,price_impact:Number(imp),created_by:profile.id})
      notify('📡 Signal published',T.red);loadNews(league?.id);setNewSignalOpen(false)
    }
    return(
      <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:900,padding:'20px'}} onClick={()=>setNewSignalOpen(false)}>
        <div style={{background:T.surface,border:`1px solid ${T.red}44`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'420px',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:'18px',fontWeight:700,marginBottom:'4px',color:T.red}}>📡 New Signal</div>
          <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Publish news that moves prices</div>
          <select value={selFilm} onChange={e=>setSelFilm(e.target.value)} style={{...S.inp,marginBottom:'10px'}}>
            <option value="">Attached to which film? (optional)</option>
            {films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select value={type} onChange={e=>setType(e.target.value)} style={{...S.inp,marginBottom:'10px'}}>
            <option value="rt_score">RT Score</option><option value="trailer">Trailer</option><option value="festival">Festival</option><option value="box_office">Box Office</option><option value="controversy">Controversy</option><option value="casting">Casting</option>
          </select>
          <input value={head} onChange={e=>setHead(e.target.value)} placeholder="Headline" style={{...S.inp,marginBottom:'10px'}}/>
          <textarea value={det} onChange={e=>setDet(e.target.value)} placeholder="Detail (optional)" style={{...S.inp,minHeight:'60px',marginBottom:'10px',resize:'vertical',fontFamily:T.mono}}/>
          <div style={{display:'flex',gap:'10px',marginBottom:'10px'}}>
            <select value={sent} onChange={e=>setSent(e.target.value)} style={{...S.inp,flex:1}}>
              <option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option>
            </select>
            <input type="number" value={imp} onChange={e=>setImp(e.target.value)} placeholder="Impact %" style={{...S.inp,flex:1}}/>
          </div>
          <div style={{fontSize:'10px',color:T.textDim,marginBottom:'14px'}}>Price impact: −25 to +25 · cumulative across signals (capped)</div>
          <div style={{display:'flex',gap:'10px'}}>
            <Btn onClick={()=>setNewSignalOpen(false)} variant="outline" color={T.textSub} sx={{flex:1}}>Cancel</Btn>
            <Btn onClick={submit} color={T.red} textColor="#fff" sx={{flex:2}}>Publish</Btn>
          </div>
        </div>
      </div>
    )
  }


  // ── PAGE RENDERER ─────────────────────────────────────────────────────────
  const renderPage=()=>{
    switch(page){
      case 'market':return <MarketPage/>
      case 'roster':return <RosterPage/>
      case 'chips':return <ChipsPage/>
      case 'league':return <LeaguePage/>
      case 'community':return <CommunityPage/>
      case 'feed':return <FeedPage/>
      case 'signals':return <SignalsPage/>
      case 'friday':return <FridayForecastPage/>
      case 'motw':return <MovieOfWeekPage/>
      case 'polls':return <PollsPage/>
      case 'intent':return <IntentPage/>
      case 'trades':return <TradesPage/>
      case 'sealed':return <SealedBidPage/>
      case 'forecaster':return <ForecasterPage/>
      case 'oscar':return <OscarPage/>
      case 'results':return <ResultsPage/>
      case 'howto':return <HowToPlayPage/>
      case 'slate':return <SlatePage/>
      case 'report':return <MatchReportPage/>
      case 'intelligence':return <IntelligencePage/>
      case 'warroom':return <WarRoomPage/>
      case 'commissioner':return <CommissionerPage/>
      case 'distributor':return <DistributorPage/>
      case 'profile':return profilePlayer?<PlayerProfilePage player={profilePlayer} films={films} rosters={rosters} results={results} weeklyG={weeklyG} allChips={allChips} auteurDecl={auteurDecl} wwWinners={wwWinners} oscarPreds={oscarPreds} allPicks={allPicks} calcPoints={calcPoints} calcPhasePoints={calcPhasePoints} budgetLeft={budgetLeft} cur={cur} isEarlyBird={isEarlyBird} analystActive={analystOn} auteurBonus={auteurOn} shortBonus={(pid,fid)=>shortBonus(pid,fid)} wwBonus={wwBonus} curPhase_ref={curPhase()} onBack={()=>setPage(prevPage)}/>:null
      default:return <MarketPage/>
    }
  }

  const navigate=(p)=>{setPage(p);setMoreOpen(false)}
  const draftBannerVisible=draftWindowOpen&&draftShortfall>0

  // Fresh-results banner state
  const dismissKey=`boxd_results_seen_w${cfg.current_week-1}`
  const[resultsDismissed,setResultsDismissed]=useState(()=>typeof localStorage!=='undefined'&&localStorage.getItem(dismissKey)==='1')
  useEffect(()=>{setResultsDismissed(typeof localStorage!=='undefined'&&localStorage.getItem(dismissKey)==='1')},[cfg.current_week])
  const justScored=films.filter(f=>f.week===cfg.current_week-1&&results[f.id]!=null)
  const myJustScored=justScored.filter(f=>myRoster.find(r=>r.film_id===f.id)||rosters.find(r=>r.player_id===profile.id&&r.film_id===f.id))
  const myJustScoredPts=myJustScored.reduce((s,f)=>{
    const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===f.id);if(!h)return s
    let op=calcOpeningPts(f,results[f.id],isEarlyBird(h),analystOn(profile.id,f.id))
    if(auteurOn(profile.id,f.id))op=Math.round(op*1.1)
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
              ...(hasFridayForecasts||hasResults?[{id:'friday',icon:'🎯',label:'Weekend Forecast'}]:[]),
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
              {id:'trades',icon:'🔄',label:'Trades',badge:pendingForMe.length||null},
              {id:'forecaster',icon:'📊',label:'Forecaster'},
              {id:'oscar',icon:'🏆',label:'Oscars'},
              {id:'results',icon:'📋',label:'Results'},
              {id:'howto',icon:'❓',label:'How to Play'},
              ...(hasPicks&&films.length>0?[{id:'slate',icon:'🗺',label:'Slate Map'}]:[]),
              ...(hasResults?[{id:'report',icon:'📰',label:'Match Report'}]:[]),
              ...(hasPicks?[{id:'intelligence',icon:'📡',label:'Intelligence'}]:[]),
              ...(sealedWindowOpen?[{id:'sealed',icon:'🔒',label:'Sealed Bid'}]:[]),
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
        <div style={{padding:'20px',maxWidth:'1100px',margin:'0 auto'}}>
          {dataLoading?<PageSkeleton/>:renderPage()}
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
      {filmDetail&&<FilmDetailModal film={filmDetail} profile={profile} players={players} results={results} allPicks={allPicks} marketingEvents={marketingEvents} news={news} rosters={rosters} filmValues={filmValues} currentWeek={cfg.current_week} phase={ph} onTogglePick={togglePick} onBookingClick={trackBookingClick} onShowtimes={(f)=>{setShowtimesFilm(f);setFilmDetail(null)}} onClose={()=>setFilmDetail(null)} league={league}/>}
      {showtimesFilm&&<ShowtimesModal film={showtimesFilm} onClose={()=>setShowtimesFilm(null)} onBookingClick={trackBookingClick} supabaseUrl={SUPABASE_URL} anonKey={SUPABASE_ANON_KEY}/>}
      {scoreModal&&<ScoreBreakdownModal film={scoreModal.film} holding={scoreModal.holding} results={results} weeklyGrosses={weeklyG} allChips={allChips} auteurDeclarations={auteurDecl} weekendWinners={wwWinners} isEarlyBird={isEarlyBird} onClose={()=>setScoreModal(null)}/>}
      {tradeModal&&<TradeModal profile={profile} players={players} rosters={rosters} films={films} filmVal={filmVal} curPhase={curPhase} onClose={()=>setTradeModal(false)} notify={notify} onDone={()=>{setTradeModal(false);loadTrades(league?.id)}} league={league}/>}
      {profileEditOpen&&<ProfileEditModal/>}
      {newSignalOpen&&<NewSignalModal/>}

      {/* CHIP MODAL */}
      {chipModal==='short'&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'20px'}} onClick={()=>setChipModal(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.red}44`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'400px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'18px',fontWeight:700,color:T.red,marginBottom:'6px'}}>📉 SHORT</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Pick a film to bet against. Wins +100pts, loses −30pts.</div>
            {films.filter(f=>f.phase===ph&&results[f.id]==null).map(f=>(
              <div key={f.id} onClick={()=>{if(confirm(`Short ${f.title}?`))activateShort(f.id,Math.round(f.estM*0.6))}} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center'}}>
                <FilmPoster film={f} width={36} height={54} radius={5}/>
                <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'10px',color:T.textSub}}>est ${f.estM}M</div></div>
                <div style={{color:T.red,fontSize:'16px'}}>›</div>
              </div>
            ))}
            <Btn onClick={()=>setChipModal(null)} variant="outline" color={T.textSub} full sx={{marginTop:'10px'}}>Cancel</Btn>
          </div>
        </div>
      )}
      {chipModal==='analyst'&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'20px'}} onClick={()=>setChipModal(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.blue}44`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'400px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'18px',fontWeight:700,color:T.blue,marginBottom:'6px'}}>🎯 ANALYST</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Pick a film you own + predict opening. Within 10% = +60pts.</div>
            {myRoster.map(h=>{
              const f=films.find(fl=>fl.id===h.film_id);if(!f)return null
              return(
                <div key={h.id} onClick={()=>{const pred=prompt(`Predict opening for ${f.title} ($M)`);if(pred&&!isNaN(Number(pred)))activateAnalyst(f.id,Number(pred))}} className="hoverable" style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center'}}>
                  <FilmPoster film={f} width={36} height={54} radius={5}/>
                  <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'10px',color:T.textSub}}>est ${f.estM}M</div></div>
                  <div style={{color:T.blue,fontSize:'16px'}}>›</div>
                </div>
              )
            })}
            <Btn onClick={()=>setChipModal(null)} variant="outline" color={T.textSub} full sx={{marginTop:'10px'}}>Cancel</Btn>
          </div>
        </div>
      )}
      {chipModal==='auteur'&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'20px'}} onClick={()=>setChipModal(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.orange}44`,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'420px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'18px',fontWeight:700,color:T.orange,marginBottom:'6px'}}>🎭 AUTEUR</div>
            <div style={{fontSize:'12px',color:T.textSub,marginBottom:'16px'}}>Declare an actor + 2+ of their films this phase. +10% opening pts on all.</div>
            <input value={auteurActor} onChange={e=>setAuteurActor(e.target.value)} placeholder="Actor name (e.g. Tom Cruise)" style={{...S.inp,marginBottom:'14px'}}/>
            <div style={{...S.label,marginBottom:'8px'}}>Pick 2+ films</div>
            {films.filter(f=>f.phase===ph).map(f=>(
              <div key={f.id} onClick={()=>setAuteurFilms(auteurFilms.includes(f.id)?auteurFilms.filter(id=>id!==f.id):[...auteurFilms,f.id])} style={{...S.card,marginBottom:'6px',cursor:'pointer',display:'flex',gap:'10px',alignItems:'center',border:`1px solid ${auteurFilms.includes(f.id)?T.orange+'66':T.border}`}}>
                <FilmPoster film={f} width={36} height={54} radius={5}/>
                <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:600}}>{f.title}</div><div style={{fontSize:'10px',color:T.textSub}}>{f.starActor||'—'}</div></div>
                <div style={{color:auteurFilms.includes(f.id)?T.orange:T.textDim,fontSize:'16px'}}>{auteurFilms.includes(f.id)?'✓':'○'}</div>
              </div>
            ))}
            <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
              <Btn onClick={()=>setChipModal(null)} variant="outline" color={T.textSub} sx={{flex:1}}>Cancel</Btn>
              <Btn onClick={()=>submitAuteur(auteurActor.trim(),auteurFilms)} color={T.orange} textColor="#fff" sx={{flex:2}} disabled={!auteurActor.trim()||auteurFilms.length<2}>Lock In</Btn>
            </div>
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
                const{error}=await supabase.from('films').insert({id,title:newFilm.title.trim(),dist:newFilm.dist.trim(),genre:newFilm.genre,base_price:newFilm.basePrice,est_m:newFilm.estM,rt:newFilm.rt?Number(newFilm.rt):null,week:newFilm.week,phase:newFilm.phase,active:true})
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
