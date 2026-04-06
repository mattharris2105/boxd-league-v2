import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const SUPABASE_URL = 'https://yxluqkfanhzktinayvex.supabase.co'

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
  html,body{margin:0;padding:0;background:#0D0A08;}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#2A2420;border-radius:3px;}
  @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(200%);}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
  .hoverable{transition:border-color .15s,transform .15s,background .15s;}
  .hoverable:active{transform:scale(0.985);opacity:0.9;}
  .pressable:active{transform:scale(0.96);opacity:0.8;}
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
  return <button onClick={onClick} disabled={disabled} className="pressable" style={{...S.btn,padding:pad,fontSize:fs,background:variant==='solid'?color:'transparent',color:variant==='solid'?textColor:color,border:variant==='outline'?`1px solid ${color}55`:'none',opacity:disabled?0.35:1,cursor:disabled?'not-allowed':'pointer',width:full?'100%':undefined,...sx}}>{children}</button>
}
function Badge({children,color=T.gold}){return <span style={{fontSize:'10px',fontWeight:500,color,background:`${color}20`,padding:'2px 8px',borderRadius:'20px',display:'inline-flex',alignItems:'center',gap:'3px',lineHeight:1.5}}>{children}</span>}
function Pill({children,color=T.textSub}){return <span style={{fontSize:'11px',color,background:`${color}18`,padding:'3px 9px',borderRadius:'20px',display:'inline-block',lineHeight:1.4,whiteSpace:'nowrap'}}>{children}</span>}
function Divider({my=12}){return <div style={{height:'1px',background:T.border,margin:`${my}px 0`}}/>}
function StatBox({label,value,color=T.text,sub}){return <div style={{background:T.surfaceUp,borderRadius:'10px',padding:'12px 14px',flex:1,minWidth:0}}><div style={{...S.label,marginBottom:'5px'}}>{label}</div><div style={{fontSize:'22px',fontWeight:700,color,lineHeight:1,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:'11px',color:T.textSub,marginTop:'3px'}}>{sub}</div>}</div>}

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

function FilmPoster({film,width,height,radius=8,imgStyle={}}){
  const key=film?.tmdbId?`id:${film.tmdbId}`:film?.title
  const [url,setUrl]=useState(posterCache[key]!==undefined?posterCache[key]:undefined)
  const gc=GENRE_COL[film?.genre]||T.textSub
  useEffect(()=>{
    if(!film?.title){setUrl(null);return}
    if(posterCache[key]!==undefined) return
    let cancelled=false
    fetchTMDBPoster(film.title,film.tmdbId).then(u=>{if(!cancelled)setUrl(u)})
    return()=>{cancelled=true}
  },[film?.title,film?.tmdbId])
  const w=typeof width==='number'?`${width}px`:width
  const h=typeof height==='number'?`${height}px`:height
  return(
    <div style={{width:w,height:h,borderRadius:radius,flexShrink:0,overflow:'hidden',position:'relative',contain:'strict',transform:'translateZ(0)',isolation:'isolate'}}>
      {url===undefined&&<div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,${T.surfaceUp} 25%,${T.border} 50%,${T.surfaceUp} 75%)`,animation:'shimmer 1.6s ease-in-out infinite'}}/>}
      {url===null&&<div style={{position:'absolute',inset:0,background:`linear-gradient(145deg,${gc}28 0%,${T.surfaceUp} 100%)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5}}><div style={{fontSize:typeof width==='number'?Math.max(16,width*0.28):20,lineHeight:1}}>🎬</div><div style={{fontSize:'9px',color:gc,textAlign:'center',padding:'0 6px',lineHeight:1.2}}>{film?.genre}</div></div>}
      {url&&<img src={url} alt={film?.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',display:'block',...imgStyle}} onError={()=>setUrl(null)}/>}
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
  if(!totalPlayers) return 1
  const pct=rosters.filter(r=>r.film_id===film.id&&r.phase===phase&&r.active).length/totalPlayers
  return pct>0.4?1.4:pct>0.25?1.25:pct>0.15?1.1:pct<0.05?0.9:1
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
  const nowRef=useRef(Date.now())
  const isMobile=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

  useEffect(()=>{const el=document.createElement('style');el.textContent=GLOBAL_CSS;document.head.appendChild(el);return()=>document.head.removeChild(el)},[])
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
      // 1. Bank remaining budgets for all players in current phase
      for(const p of players) await bankBudget(p.id,curPhase())
      // 2. Advance phase, close windows
      const nextPhase=curPhase()+1
      await supabase.from('league_config').update({
        current_phase:nextPhase,
        phase_window_active:false,
        phase_window_opened_at:null,
        draft_window_open:false,
        draft_deadline:null,
      }).eq('league_id',league?.id)
      // 3. Log it
      await logActivity(session.user.id,'phase_advance',{from_phase:curPhase(),to_phase:nextPhase,league:league?.name},league?.id)
      notify(`✅ Phase ${nextPhase} started · budgets banked`,T.green)
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
    return t+forecasterBonus(pid,ph)
  }
  const calcPoints=(pid)=>{let t=[1,2,3,4,5].reduce((s,ph)=>s+calcPhasePoints(pid,ph),0);if(oscarPreds.find(o=>o.player_id===pid)?.correct)t+=75;return t+seasonForecasterBonus(pid)}

  // ── BUY / SELL ──────────────────────────────────────────────────────────────
  const buyFilm=async(film)=>{
    if(!profile)return notify('Create a profile first',T.red)
    const ph=curPhase()
    if(film.phase!==ph)return notify(`Film is Phase ${film.phase} — you are in Phase ${ph}`,T.red)
    if(rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active))return notify('Already in your roster',T.red)
    if(rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length>=MAX_ROSTER)return notify(`Phase roster full (${MAX_ROSTER} max)`,T.red)
    const price=filmVal(film),left=budgetLeft(profile.id)
    if(price>left)return notify(`Not enough budget — need $${price}M, have $${left}M`,T.red)
    const{error}=await supabase.from('rosters').insert({player_id:profile.id,film_id:film.id,bought_price:price,bought_week:cfg.current_week,acquired_week:cfg.current_week,phase:ph,active:true,league_id:league?.id})
    if(error)return notify(error.message,T.red)
    await supabase.from('transactions').insert({player_id:profile.id,film_id:film.id,type:'buy',price,week:cfg.current_week,league_id:league?.id})
    await logActivity(profile.id,'buy',{film_id:film.id,film_title:film.title,price,player_name:profile.name},league?.id)
    notify(`Acquired ${film.title} · $${price}M`,T.green);loadData(league?.id)
  }
  const sellFilm=async(film)=>{
    const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active);if(!h)return
    const win=isWindow(),val=filmVal(film),fee=win?0:cfg.tx_fee,proceeds=Math.max(0,val-fee)
    await supabase.from('rosters').update({active:false,sold_price:proceeds,sold_week:cfg.current_week}).eq('id',h.id)
    await supabase.from('transactions').insert([{player_id:profile.id,film_id:film.id,type:'sell',price:proceeds,week:cfg.current_week},...(fee>0?[{player_id:profile.id,film_id:film.id,type:'fee',price:fee,week:cfg.current_week}]:[])])
    await logActivity(profile.id,'sell',{film_id:film.id,film_title:film.title,proceeds,player_name:profile.name},league?.id)
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
    notify('🎬 RECUT activated',T.purple);setChipModal(null);loadData(league?.id)
  }
  const activateShort=async(filmId,pred)=>{
    if(chips?.short_film_id)return notify('Short already used',T.red)
    if(allChips.find(c=>c.short_film_id===filmId))return notify('Film already shorted',T.red)
    if(chips)await supabase.from('chips').update({short_film_id:filmId,short_phase:curPhase(),short_prediction:pred}).eq('player_id',profile.id).eq('league_id',league?.id)
    else await supabase.from('chips').insert({player_id:profile.id,short_film_id:filmId,short_phase:curPhase(),short_prediction:pred,league_id:league?.id})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_short',{film_title:ft,prediction:pred,player_name:profile.name},league?.id)
    notify(`📉 SHORT on ${ft}`,T.red);setChipModal(null);loadData(league?.id)
  }
  const activateAnalyst=async(filmId,pred)=>{
    if(chips?.analyst_film_id)return notify('Analyst already used',T.red)
    if(allChips.find(c=>c.analyst_film_id===filmId))return notify('Film already Analysed',T.red)
    if(!rosters.find(r=>r.player_id===profile.id&&r.film_id===filmId&&r.active))return notify('You must own this film',T.red)
    if(chips)await supabase.from('chips').update({analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred}).eq('player_id',profile.id).eq('league_id',league?.id)
    else await supabase.from('chips').insert({player_id:profile.id,analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred,league_id:league?.id})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_analyst',{film_title:ft,prediction:pred,player_name:profile.name},league?.id)
    notify(`🎯 ANALYST on ${ft}`,T.blue);setChipModal(null);loadData(league?.id)
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
    return(
      <div>
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
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(auto-fill,minmax(200px,1fr))',gap:'12px'}}>
          {visible.map(film=>{
            const owned=myRoster.find(r=>r.film_id===film.id)
            const val=filmVal(film),actual=results[film.id]
            const gc=GENRE_COL[film.genre]||T.textSub
            const ipo=film.basePrice,diff=(filmValues[film.id]??ipo)-ipo
            const op=actual!=null?calcOpeningPts(film,actual,owned?isEarlyBird(owned):false,analystOn(profile.id,film.id)):0
            const wp=actual!=null?Math.round(calcWeeklyPts(weeklyG[film.id]||{})):0
            const ownCount=rosters.filter(r=>r.film_id===film.id&&r.phase===ph&&r.active).length
            const demandPct=players.length?Math.round(ownCount/players.length*100):0
            const pickCount=allPicks.filter(p=>p.film_id===film.id).length
            const vel7=pickVelocity(film.id,allPicks,7)
            return(
              <div key={film.id} className="hoverable" style={{background:owned?`linear-gradient(155deg,${T.gold}14 0%,${T.surface} 55%)`:T.surface,border:`1px solid ${owned?T.gold+'55':T.border}`,borderRadius:'14px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
                <div style={{height:'3px',background:gc,flexShrink:0}}/>
                <div style={{position:'relative',cursor:'pointer',flexShrink:0}} onClick={()=>setFilmDetail(film)}>
                  <FilmPoster film={film} width="100%" height={isMobile?168:196} radius={0} imgStyle={{width:'100%'}}/>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 45%,rgba(13,10,8,0.95) 100%)'}}/>
                  <div style={{position:'absolute',bottom:'10px',left:'12px'}}>
                    <div style={{fontSize:'20px',fontWeight:800,color:owned?T.gold:T.text,lineHeight:1,fontFamily:T.mono}}>{cur}{val}M</div>
                    <div style={{fontSize:'11px',color:diff>0?T.green:diff<0?T.red:T.textSub,marginTop:'2px'}}>{diff===0?'—':diff>0?`▲ ${cur}${diff}`:`▼ ${cur}${Math.abs(diff)}`} IPO</div>
                  </div>
                  <div style={{position:'absolute',top:'8px',right:'8px',display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-end'}}>
                    {film.sleeper&&<Badge color={T.blue}>💤 sleeper</Badge>}
                    {owned&&isEarlyBird(owned)&&<Badge color={T.green}>🐦 early</Badge>}
                    {chips?.short_film_id===film.id&&<Badge color={T.red}>📉 short</Badge>}
                    {chips?.analyst_film_id===film.id&&<Badge color={T.blue}>🎯 analyst</Badge>}
                    {auteurOn(profile.id,film.id)&&<Badge color={T.orange}>🎭 auteur</Badge>}
                  </div>
                  {pickCount>0&&<div style={{position:'absolute',bottom:'10px',right:'10px'}}><Badge color={vel7>=5?T.red:vel7>=2?T.orange:T.textSub}>👁 {pickCount}</Badge></div>}
                </div>
                <div style={{padding:'12px',flex:1,display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:600,lineHeight:1.35,color:T.text}}>{film.title}</div>
                    <div style={{fontSize:'11px',color:T.textSub,marginTop:'3px'}}>{film.dist} · W{film.week}</div>
                  </div>
                  <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                    <Pill color={gc}>{film.genre}</Pill>
                    {film.franchise&&<Pill>{film.franchise.split(':')[0]}</Pill>}
                    {film.rt!=null&&<Pill color={film.rt>=90?T.green:film.rt>=75?T.gold:T.red}>🍅 {film.rt}%</Pill>}
                  </div>
                  {ownCount>0&&<div style={{fontSize:'12px',color:demandPct>=40?T.red:demandPct>=25?T.orange:T.textSub}}>{demandPct>=40?'🔥 ':demandPct>=15?'📈 ':''}{ownCount} own · {demandPct}%</div>}
                  {actual!=null&&(
                    <div style={{background:T.surfaceUp,borderRadius:'9px',padding:'9px 11px',cursor:owned?'pointer':'default'}} onClick={()=>owned&&setScoreModal({film,holding:owned})}>
                      <div style={{fontSize:'13px',color:T.green,fontWeight:600}}>${actual}M actual</div>
                      <div style={{fontSize:'12px',color:T.gold,marginTop:'2px'}}>{op}pts{wp>0?` +${wp}w`:''}{calcLegsBonus(actual,weeklyG[film.id]?.[2])>0?' 🦵':''}{wwBonus(film.id)>0?' 🥇':''}</div>
                      {owned&&<div style={{fontSize:'10px',color:T.textDim,marginTop:'2px'}}>tap for breakdown →</div>}
                    </div>
                  )}
                  <div style={{display:'flex',gap:'6px'}}>
                    <PickButton filmId={film.id} userId={profile.id} allPicks={allPicks} onToggle={togglePick} size="sm"/>
                    <button onClick={()=>setFilmDetail(film)} style={{...S.btn,background:T.surfaceUp,color:T.textSub,fontSize:'13px',padding:'8px',flex:1}}>💬</button>
                    <button onClick={e=>{e.stopPropagation();setShowtimesFilm(film)}} style={{...S.btn,background:T.surfaceUp,color:T.textSub,fontSize:'13px',padding:'8px',flex:1}}>🎟</button>
                    {film.trailer?.length>5&&<button onClick={e=>{e.stopPropagation();setTrailerFilm(film)}} style={{...S.btn,background:T.surfaceUp,color:T.textSub,fontSize:'13px',padding:'8px',flex:1}}>▶</button>}
                  </div>
                  {owned?<Btn onClick={()=>sellFilm(film)} variant="outline" color={T.red} full size="md">Drop{win?' FREE':` · $${Math.max(0,val-cfg.tx_fee)}M`}</Btn>:<Btn onClick={()=>buyFilm(film)} color={T.gold} full size="md">Acquire · {cur}{val}M</Btn>}
                </div>
              </div>
            )
          })}
          {visible.length===0&&<div style={{gridColumn:'1/-1',...S.card,textAlign:'center',padding:'48px',color:T.textSub}}>No films match your search.</div>}
        </div>
      </div>
    )
  }

  const RosterPage=()=>(
    <div>
      <div style={S.pageTitle}>My Roster</div>
      <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'4px'}}>Phase {ph} · {PHASE_NAMES[ph]}</div>
      <div style={{fontSize:'13px',color:T.textSub,marginBottom:'20px'}}>{myRoster.length}/{MAX_ROSTER} films · {cur}{myBudget}M left{phaseBanked(profile.id,ph)>0?` (incl. ${cur}${phaseBanked(profile.id,ph)}M banked)`:''}</div>
      <div style={{display:'flex',gap:'6px',marginBottom:'20px',overflowX:'auto',paddingBottom:'2px'}}>
        {[1,2,3,4,5].map(p=>{const pts=calcPhasePoints(profile.id,p),nr=rosters.filter(r=>r.player_id===profile.id&&r.phase===p&&films.find(f=>f.id===r.film_id)).length;return <div key={p} style={{background:p===ph?`${T.gold}18`:T.surfaceUp,border:`1px solid ${p===ph?T.gold+'55':T.border}`,borderRadius:'10px',padding:'10px 14px',textAlign:'center',flexShrink:0,minWidth:'60px'}}><div style={{...S.label,color:p===ph?T.gold:T.textDim,marginBottom:'4px'}}>PH{p}</div><div style={{fontSize:'16px',fontWeight:700,color:p===ph?T.gold:T.text}}>{pts}</div><div style={{fontSize:'11px',color:T.textSub,marginTop:'2px'}}>{nr} films</div></div>})}
      </div>
      {myRoster.length===0?<div style={{...S.card,textAlign:'center',padding:'48px 24px'}}><div style={{fontSize:'32px',marginBottom:'12px'}}>🎬</div><div style={{fontSize:'14px',color:T.textSub}}>No films this phase.</div><div style={{fontSize:'12px',color:T.textDim,marginTop:'6px'}}>Head to Market to acquire.</div></div>:myRoster.map(h=>{
        const film=films.find(f=>f.id===h.film_id);if(!film)return null
        const val=filmVal(film),actual=results[film.id],pnl=val-h.bought_price
        const gc=GENRE_COL[film.genre]||T.textSub
        const wp=actual!=null?Math.round(calcWeeklyPts(weeklyG[film.id]||{})):0
        const eb=isEarlyBird(h),ao=analystOn(profile.id,film.id),au=auteurOn(profile.id,film.id)
        let op=actual!=null?calcOpeningPts(film,actual,eb,ao):0;if(au&&actual!=null)op=Math.round(op*1.1)
        const lb=calcLegsBonus(actual,weeklyG[film.id]?.[2]),wb=wwBonus(film.id),sb=shortBonus(profile.id,film.id)
        const total=op+wp+lb+wb+sb
        return(
          <div key={h.id} className="hoverable" style={{...S.card,display:'flex',gap:'14px',alignItems:'flex-start',marginBottom:'10px',cursor:actual!=null?'pointer':'default'}} onClick={()=>actual!=null&&setScoreModal({film,holding:h})}>
            <div style={{position:'relative',flexShrink:0}}><FilmPoster film={film} width={56} height={84} radius={9}/><div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:gc,borderRadius:'9px 9px 0 0'}}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'15px',fontWeight:700,marginBottom:'3px',lineHeight:1.3}}>{film.title}</div>
              <div style={{fontSize:'12px',color:T.textSub,marginBottom:'10px'}}>{film.dist} · W{film.week}</div>
              <div style={{display:'flex',gap:'16px',flexWrap:'wrap',marginBottom:'8px'}}>
                <div><div style={S.label}>Paid</div><div style={{fontSize:'15px',fontWeight:600,marginTop:'3px'}}>{cur}{h.bought_price}M</div></div>
                <div><div style={S.label}>Now</div><div style={{fontSize:'15px',fontWeight:600,color:pnl>=0?T.green:T.red,marginTop:'3px'}}>{cur}{val}M</div></div>
                <div><div style={S.label}>P&L</div><div style={{fontSize:'15px',fontWeight:700,color:pnl>=0?T.green:T.red,marginTop:'3px'}}>{pnl>=0?'+':''}{pnl}M</div></div>
                {actual!=null&&<div><div style={S.label}>Pts</div><div style={{fontSize:'15px',fontWeight:700,color:T.gold,marginTop:'3px'}}>{total}</div></div>}
              </div>
              <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                {eb&&<Badge color={T.green}>🐦 early bird</Badge>}
                {ao&&<Badge color={T.blue}>🎯 +60</Badge>}
                {au&&<Badge color={T.orange}>🎭 +10%</Badge>}
                {actual!=null&&<span style={{fontSize:'11px',color:T.textDim,alignSelf:'center'}}>tap for breakdown →</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const ChipsPage=()=>{
    const myAuteur=auteurDecl.find(a=>a.player_id===profile.id&&a.phase===ph)
    return(
      <div>
        <div style={S.pageTitle}>My Chips</div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>One of each per season · first-come first-served on Shorts & Analyst</div>
        {[
          {key:'recut',icon:'🎬',label:'THE RECUT',desc:'Wipe your roster completely — zero fees, anytime',used:recutUsed,col:T.purple,usedLabel:'Used',action:activateRecut},
          {key:'short',icon:'📉',label:'THE SHORT',desc:'Call a bomb — under 60% est = +100pts · overshoots = −30pts',used:shortUsed,col:T.red,usedLabel:chips?.short_result==='win'?'✅ +100pts':chips?.short_result==='lose'?'❌ −30pts':`📉 ${films.find(f=>f.id===chips?.short_film_id)?.title||'Active'}`,action:()=>setChipModal('short')},
          {key:'analyst',icon:'🎯',label:'THE ANALYST',desc:'Predict opening ±10% on a film you own — correct = +60pts flat',used:analystUsed,col:T.blue,usedLabel:chips?.analyst_result==='win'?'✅ +60pts':chips?.analyst_result==='lose'?'❌ Missed':`🎯 ${films.find(f=>f.id===chips?.analyst_film_id)?.title||'Active'}`,action:()=>setChipModal('analyst')},
        ].map(({key,icon,label,desc,used,col,usedLabel,action})=>(
          <div key={key} style={{...S.card,border:`1px solid ${used?T.border:col+'44'}`,marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{fontSize:'30px',lineHeight:1,flexShrink:0}}>{icon}</div>
              <div style={{flex:1}}><div style={{fontSize:'15px',fontWeight:700,color:used?T.textSub:col,marginBottom:'3px'}}>{label}</div><div style={{fontSize:'12px',color:T.textSub,lineHeight:1.5}}>{desc}</div></div>
              {used?<span style={{fontSize:'11px',color:T.textSub,padding:'5px 12px',border:`1px solid ${T.border}`,borderRadius:'20px',whiteSpace:'nowrap',flexShrink:0}}>{usedLabel}</span>:<Btn onClick={action} color={col} textColor="#0D0A08" size="sm">Activate</Btn>}
            </div>
          </div>
        ))}
        <div style={{...S.card,border:`1px solid ${myAuteur?T.border:T.orange+'44'}`,marginBottom:'24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{fontSize:'30px',lineHeight:1,flexShrink:0}}>🎭</div>
            <div style={{flex:1}}><div style={{fontSize:'15px',fontWeight:700,color:myAuteur?T.textSub:T.orange,marginBottom:'3px'}}>THE AUTEUR</div><div style={{fontSize:'12px',color:T.textSub,lineHeight:1.5}}>Declare 2+ films by the same star actor — +10% opening pts each</div>{myAuteur&&<div style={{fontSize:'12px',color:T.orange,marginTop:'5px',fontWeight:500}}>⭐ {myAuteur.star_actor} · {myAuteur.film_ids.length} films</div>}</div>
            <Btn onClick={()=>setChipModal('auteur')} color={myAuteur?T.surfaceUp:T.orange} textColor={myAuteur?T.textSub:'#0D0A08'} variant={myAuteur?'outline':'solid'} size="sm">{myAuteur?'Update':'Declare'}</Btn>
          </div>
        </div>
        {allChips.filter(c=>c.player_id!==profile.id&&(c.short_film_id||c.analyst_film_id)).length>0&&<div>
          <div style={{...S.sectionTitle,marginBottom:'12px'}}>League Chip Activity</div>
          {allChips.filter(c=>c.player_id!==profile.id).map(c=>{const p=players.find(pl=>pl.id===c.player_id);return(
            <div key={c.id} style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px'}}>
              {c.short_film_id&&<div style={{background:T.surfaceUp,borderRadius:'9px',padding:'7px 14px',fontSize:'12px'}}><span style={{color:T.red}}>📉 {p?.name}</span><span style={{color:T.textSub}}> → {films.find(f=>f.id===c.short_film_id)?.title}</span>{c.short_result&&<span style={{color:c.short_result==='win'?T.green:T.red}}> {c.short_result==='win'?'✅':'❌'}</span>}</div>}
              {c.analyst_film_id&&<div style={{background:T.surfaceUp,borderRadius:'9px',padding:'7px 14px',fontSize:'12px'}}><span style={{color:T.blue}}>🎯 {p?.name}</span><span style={{color:T.textSub}}> → {films.find(f=>f.id===c.analyst_film_id)?.title}</span>{c.analyst_result&&<span style={{color:c.analyst_result==='win'?T.green:T.red}}> {c.analyst_result==='win'?'✅':'❌'}</span>}</div>}
            </div>
          )})}
        </div>}
      </div>
    )
  }

  const LeaguePage=()=>(
    <div>
      <div style={S.pageTitle}>Standings</div>
      <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Grand League · W{cfg.current_week} · Phase {ph}</div>
      <div style={{...S.card,marginBottom:'20px'}}>
        <div style={{...S.sectionTitle,marginBottom:'14px'}}>Phase Leaders</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>
          {[1,2,3,4,5].map(p=>{const sc=[...players].map(pl=>({pl,pts:calcPhasePoints(pl.id,p)})).sort((a,b)=>b.pts-a.pts),leader=sc[0];return(
            <div key={p} style={{background:p===ph?`${T.gold}15`:T.surfaceUp,border:`1px solid ${p===ph?T.gold+'44':T.border}`,borderRadius:'10px',padding:'10px 4px',textAlign:'center'}}>
              <div style={{...S.label,color:p===ph?T.gold:T.textDim,marginBottom:'4px'}}>PH{p}</div>
              {leader?.pts>0?<><div style={{fontSize:'11px',fontWeight:600,color:players.find(pl=>pl.id===leader.pl.id)?.color||T.gold,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'0 2px'}}>{leader.pl.name}</div><div style={{fontSize:'14px',fontWeight:800,color:p===ph?T.gold:T.text,marginTop:'2px'}}>{leader.pts}</div></>:<div style={{fontSize:'12px',color:T.textDim,paddingTop:'6px'}}>—</div>}
            </div>
          )})}
        </div>
      </div>
      {[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id)).map((player,i)=>{
        const pts=calcPoints(player.id),rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`
        const pc=allChips.find(c=>c.player_id===player.id),pa=auteurDecl.find(a=>a.player_id===player.id&&a.phase===ph)
        const playerPicks=allPicks.filter(p=>p.user_id===player.id).length
        const playerDraft=rosters.filter(r=>r.player_id===player.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length
        const draftOk=draftWindowOpen&&playerDraft>=DRAFT_MIN
        return(
          <div key={player.id} className="hoverable" style={{...S.card,display:'flex',alignItems:'center',gap:'14px',marginBottom:'8px',cursor:'pointer'}} onClick={()=>goToProfile(player)}>
            <div style={{fontSize:'24px',minWidth:'30px',textAlign:'center'}}>{rank}</div>
            <div style={{width:'36px',height:'36px',borderRadius:'50%',background:player.color||T.gold,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:900,color:'#0D0A08'}}>{player.name?.[0]||'?'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'15px',fontWeight:600,color:player.color||T.gold,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.name}</div>
              <div style={{display:'flex',gap:'6px',marginTop:'4px',flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:'12px',color:T.textSub}}>Ph{ph}: {calcPhasePoints(player.id,ph)}pts</span>
                <span style={{fontSize:'11px',color:T.textDim}}>·</span>
                <span style={{fontSize:'12px',color:T.textSub}}>{cur}{budgetLeft(player.id)} left</span>
                {draftWindowOpen&&<Badge color={draftOk?T.green:T.red}>{draftOk?'✓ Draft':'⚠️ Draft'} {playerDraft}/{DRAFT_MIN}</Badge>}
                {playerPicks>0&&<Badge color={T.gold}>👁 {playerPicks}</Badge>}
                {pc?.recut_used&&<Badge color={T.purple}>🎬</Badge>}
                {pc?.short_film_id&&<Badge color={T.red}>📉</Badge>}
                {pc?.analyst_film_id&&<Badge color={T.blue}>🎯</Badge>}
                {pa&&<Badge color={T.orange}>🎭</Badge>}
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:'30px',fontWeight:900,color:i===0?T.gold:T.text,lineHeight:1,fontFamily:T.mono}}>{pts}</div>
              <div style={S.label}>pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const FeedPage=()=>{
    const getItem=item=>{
      const p=item.payload||{},pl=players.find(pl=>pl.id===item.user_id)
      const pName=p.player_name||pl?.name||'Someone',pCol=pl?.color||T.gold
      const pSpan=<span style={{color:pCol,fontWeight:600}}>{pName}</span>
      switch(item.type){
        case 'buy':return{icon:'🎬',text:<>{pSpan} acquired <b style={{color:T.text}}>{p.film_title}</b> for <span style={{color:T.green}}>${p.price}M</span></>,col:T.green}
        case 'sell':return{icon:'💸',text:<>{pSpan} dropped <b style={{color:T.text}}>{p.film_title}</b></>,col:T.gold}
        case 'chip_recut':return{icon:'🎬',text:<>{pSpan} activated <span style={{color:T.purple,fontWeight:700}}>THE RECUT</span></>,col:T.purple}
        case 'chip_short':return{icon:'📉',text:<>{pSpan} shorted <b>{p.film_title}</b> at <span style={{color:T.red}}>${p.prediction}M</span></>,col:T.red}
        case 'chip_analyst':return{icon:'🎯',text:<>{pSpan} went Analyst on <b>{p.film_title}</b> at <span style={{color:T.blue}}>${p.prediction}M</span></>,col:T.blue}
        case 'auteur':return{icon:'🎭',text:<>{pSpan} declared Auteur — <span style={{color:T.orange,fontWeight:600}}>{p.actor}</span></>,col:T.orange}
        case 'forecast':return{icon:'📊',text:<>{pSpan} forecast <b>{p.film_title}</b> at <span style={{color:T.blue}}>${p.predicted_m}M</span></>,col:T.blue}
        case 'oscar':return{icon:'🏆',text:<>{pSpan} locked Best Picture — <span style={{color:T.gold,fontWeight:600}}>{p.film_title}</span></>,col:T.gold}
        case 'phase_advance':return{icon:'🚀',text:<>{pSpan} advanced league to <span style={{color:T.gold,fontWeight:700}}>Phase {p.to_phase}</span></>,col:T.gold}
        case 'trade_proposed':return{icon:'🔄',text:<>{pSpan} proposed a trade</>,col:T.blue}
        case 'trade_accepted':return{icon:'🤝',text:<>Trade complete — <span style={{color:T.green}}>{p.film_received}</span></>,col:T.green}
        default:return{icon:'📡',text:pSpan,col:T.textSub}
      }
    }
    const grouped=feedItems.reduce((acc,item)=>{const day=new Date(item.created_at).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'});if(!acc[day])acc[day]=[];acc[day].push(item);return acc},{})
    return(
      <div>
        <div style={S.pageTitle}>League Feed</div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Live · updates in real time</div>
        {feedItems.length===0&&<div style={{...S.card,textAlign:'center',padding:'48px 24px'}}><div style={{fontSize:'32px',marginBottom:'12px'}}>📡</div><div style={{fontSize:'14px',color:T.textSub}}>No activity yet</div></div>}
        {Object.entries(grouped).map(([day,items])=>(
          <div key={day}>
            <div style={{...S.label,margin:'20px 0 10px'}}>{day}</div>
            {items.map(item=>{const{icon,text,col}=getItem(item);return(
              <div key={item.id} style={{...S.card,padding:'13px 15px',marginBottom:'8px',borderLeft:`3px solid ${col}55`,display:'flex',gap:'14px',alignItems:'flex-start'}}>
                <div style={{fontSize:'18px',flexShrink:0,marginTop:'1px'}}>{icon}</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',lineHeight:1.6,color:T.text}}>{text}</div><div style={{fontSize:'11px',color:T.textDim,marginTop:'4px'}}>{timeAgo(item.created_at)} ago</div></div>
              </div>
            )})}
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

  const ForecasterPage=()=>(
    <div>
      <div style={S.pageTitle}>Forecaster</div>
      <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Best phase accuracy = +15pts · Best season = +50pts</div>
      {films.filter(f=>!results[f.id]).map(film=>{const fc=forecasts[film.id];return(
        <div key={film.id} style={{...S.card,display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap',marginBottom:'8px'}}>
          <FilmPoster film={film} width={36} height={54} radius={6}/>
          <div style={{flex:2,minWidth:'120px'}}><div style={{fontSize:'14px',fontWeight:500}}>{film.title}</div><div style={{fontSize:'12px',color:T.textSub}}>Est ${film.estM}M · Ph{film.phase}</div></div>
          <input type="number" step="0.1" defaultValue={fc||''} placeholder="$M" id={`fc-${film.id}`} style={{...S.inp,width:'90px'}}/>
          <Btn color={T.blue} textColor="#fff" onClick={()=>{const v=parseFloat(document.getElementById(`fc-${film.id}`).value);if(isNaN(v))return notify('Enter a number',T.red);saveForecast(film.id,v)}}>Lock</Btn>
          {fc&&<span style={{fontSize:'13px',color:T.blue}}>${fc}M</span>}
        </div>
      )})}
      {films.filter(f=>results[f.id]).length>0&&<div style={{marginTop:'28px'}}>
        <div style={{...S.sectionTitle,marginBottom:'14px'}}>Results</div>
        {films.filter(f=>results[f.id]).map(film=>{const actual=results[film.id],pfc=allForecasts.filter(f=>f.film_id===film.id);return(
          <div key={film.id} style={{...S.card,marginBottom:'10px'}}>
            <div style={{fontSize:'14px',fontWeight:600,marginBottom:'10px'}}>{film.title} <span style={{color:T.green,fontWeight:400}}>— ${actual}M</span></div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {pfc.map(fc=>{const p=players.find(pl=>pl.id===fc.player_id),pct=Math.round((Math.abs(fc.predicted_m-actual)/actual)*100);return<div key={fc.id} style={{background:T.surfaceUp,borderRadius:'9px',padding:'5px 12px',fontSize:'12px'}}><span style={{color:p?.color||T.gold}}>{p?.name}</span><span style={{color:T.textSub}}> ${fc.predicted_m}M </span><span style={{color:pct<=10?T.green:T.red}}>{pct<=10?'✅ ':''}{pct}% off</span></div>})}
              {!pfc.length&&<div style={{fontSize:'12px',color:T.textSub}}>No predictions</div>}
            </div>
          </div>
        )})}
      </div>}
    </div>
  )

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


  const DistributorPage=()=>{
    const[selFilm,setSelFilm]=useState(films[0]?.id||'')
    const[newEvt,setNewEvt]=useState({event_type:'trailer',label:'',event_date:'',notes:''})
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
    const filmRanking=[...films].map(f=>({f,total:allPicks.filter(p=>p.film_id===f.id).length,vel:pickVelocity(f.id,allPicks,7)})).sort((a,b)=>b.total-a.total)
    const benchmarks=selF?filmRanking.filter(x=>x.f.id!==selFilm&&(x.f.genre===selF.genre||Math.abs(x.f.estM-(selF.estM||0))<30)).slice(0,3):[]
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
    const exportCSV=()=>{
      const rows=[['Film','Distributor','Genre','Phase','Week','Est $M','Total Picks','7d Velocity','24h Picks','Booking Clicks'],...filmRanking.map(({f,total,vel})=>[f.title,f.dist,f.genre,f.phase,f.week,f.estM,total,vel,pickVelocity(f.id,allPicks,1),bookingClicks.filter(b=>b.film_id===f.id).length])]
      const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='boxd-intent-data.csv';a.click();URL.revokeObjectURL(url)
    }
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'4px'}}>
          <div style={S.pageTitle}>📈 Distributor Insights</div>
          <Btn onClick={exportCSV} color={T.textSub} variant="outline" size="sm">↓ Export CSV</Btn>
        </div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Audience intent data · pick velocity vs marketing events</div>
        <div style={{marginBottom:'20px'}}>
          <div style={{...S.label,marginBottom:'6px'}}>Select Film</div>
          <select value={selFilm} onChange={e=>setSelFilm(e.target.value)} style={S.inp}>{films.map(f=><option key={f.id} value={f.id}>{f.title} (Ph{f.phase})</option>)}</select>
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
        <div style={{fontSize:'13px',fontWeight:600,color:T.textSub,margin:'8px 0 12px'}}>All Films — Audience Intent Ranking</div>
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
    const runIngest=async()=>{
      setIngesting(true)
      try{
        const res=await fetch(`${SUPABASE_URL}/functions/v1/ingest-results`,{headers:{apikey:supabase.supabaseKey,Authorization:`Bearer ${supabase.supabaseKey}`}})
        const data=await res.json();setIngestLog(data)
        notify(`✅ Ingested ${data.matched?.length||0} results · ${data.unmatched?.length||0} unmatched`,T.green);loadData(league?.id)
      }catch(e){notify(`Ingest failed: ${e.message}`,T.red)}
      setIngesting(false)
    }
    return(
      <div>
        <div style={S.pageTitle}>⚙️ Panel</div>
        <div style={{fontSize:'13px',color:T.textSub,marginTop:'4px',marginBottom:'20px'}}>Commissioner controls · {league?.name}</div>
        <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.gold}33`}}>
          <div style={{...S.sectionTitle,color:T.gold,marginBottom:'14px'}}>League Settings</div>
          <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'12px',flexWrap:'wrap'}}>
            <div style={{flex:1}}><div style={S.label}>Invite Code</div><div style={{fontSize:'22px',fontWeight:700,color:T.text,letterSpacing:'3px',marginTop:'4px',fontFamily:T.mono}}>{league?.invite_code}</div></div>
            <Btn onClick={()=>{navigator.clipboard?.writeText(league?.invite_code||'');notify('Code copied!',T.green)}} color={T.gold} size="sm">Copy Code</Btn>
          </div>
          <Divider/>
          <Btn onClick={leaveLeague} variant="outline" color={T.red} size="sm" sx={{marginTop:'10px'}}>Leave League</Btn>
        </div>
        <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.green}33`}}>
          <div style={{...S.sectionTitle,color:T.green,marginBottom:'10px'}}>📊 Box Office Ingest</div>
          <div style={{fontSize:'13px',color:T.textSub,marginBottom:'12px'}}>Pull weekend box office from The Numbers. Runs automatically Sunday nights.</div>
          <Btn onClick={runIngest} color={T.green} textColor="#0D0A08" size="sm" disabled={ingesting}>{ingesting?'⏳ Fetching…':'🎬 Run Ingest Now'}</Btn>
          {ingestLog&&<div style={{marginTop:'12px',background:T.surfaceUp,borderRadius:'9px',padding:'12px 14px'}}>
            <div style={{fontSize:'12px',color:T.green,fontWeight:600,marginBottom:'8px'}}>✅ {ingestLog.matched?.length||0} matched · ⚠️ {ingestLog.unmatched?.length||0} unmatched</div>
            {ingestLog.matched?.length>0&&<div style={{fontSize:'11px',color:T.textSub,marginBottom:'6px'}}>{ingestLog.matched.map(r=>`${r.matched} → $${r.actualM}M`).join(' · ')}</div>}
            {ingestLog.unmatched?.length>0&&<div style={{fontSize:'11px',color:T.red}}>Unmatched: {ingestLog.unmatched.join(', ')}</div>}
          </div>}
        </div>
        <div style={{...S.card,marginBottom:'12px'}}>
          <div style={{...S.sectionTitle,color:T.gold,marginBottom:'14px'}}>League Controls</div>
          <div style={{fontSize:'13px',color:T.textSub,marginBottom:'12px'}}>W{cfg.current_week} · Ph{ph} · {PHASE_NAMES[ph]}</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <Btn color={T.gold} size="sm" onClick={async()=>{await supabase.from('league_config').update({current_week:cfg.current_week+1}).eq('league_id',league?.id);notify(`Week ${cfg.current_week+1}`,T.green);loadData(league?.id)}}>Next Week →</Btn>
            <Btn color={win?T.orange:T.purple} textColor="#fff" size="sm" onClick={async()=>{const ni=new Date().toISOString();await supabase.from('league_config').update({phase_window_active:!win,phase_window_opened_at:!win?ni:null}).eq('league_id',league?.id);notify(win?'Window closed':'🔓 72hr window open!',T.orange);loadData(league?.id)}}>{win?'🔒 Close Window':'🔓 72hr Window'}</Btn>
            <Btn variant="outline" color={T.gold} size="sm" disabled={phaseTransitioning} onClick={advancePhase}>{phaseTransitioning?'⏳ Transitioning…':'Next Phase →'}</Btn>
          </div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
            {players.map(p=><div key={p.id} style={{background:T.surfaceUp,borderRadius:'8px',padding:'6px 12px',fontSize:'12px'}}><span style={{color:p.color||T.gold}}>{p.name}</span><span style={{color:T.textSub}}> {cur}{budgetLeft(p.id)}M</span>{phaseBanked(p.id,ph)>0&&<span style={{color:T.orange}}> +{phaseBanked(p.id,ph)}banked</span>}</div>)}
          </div>
        </div>
        <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.purple}33`}}>
          <div style={{...S.sectionTitle,color:T.purple,marginBottom:'14px'}}>🎬 Draft / IPO Window</div>
          <Btn color={draftWindowOpen?T.red:T.purple} textColor="#fff" size="sm" onClick={async()=>{
            const deadline=new Date(Date.now()+14*86400000).toISOString()
            await supabase.from('league_config').update({draft_window_open:!draftWindowOpen,draft_deadline:!draftWindowOpen?deadline:null}).eq('league_id',league?.id)
            notify(draftWindowOpen?'Draft window closed':'🎬 Draft window open · 14 days',T.purple);loadData(league?.id)
          }}>{draftWindowOpen?'Close Draft Window':'Open Draft Window (14 days)'}</Btn>
          {draftWindowOpen&&cfg.draft_deadline&&<div style={{background:`${T.purple}18`,borderRadius:'9px',padding:'10px 14px',marginTop:'12px'}}>
            <div style={{fontSize:'12px',color:T.purple}}>⏱ Deadline: {new Date(cfg.draft_deadline).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})} · <DraftTimer deadline={cfg.draft_deadline} shortfall={0} draftMin={DRAFT_MIN}/></div>
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
              await logActivity(session.user.id,'draft_penalties',{penalised,league:league?.name},league?.id)
              notify(`Draft penalties applied to ${penalised} player${penalised!==1?'s':''}`,T.red);loadData(league?.id)
            }}>⚠️ Apply Draft Penalties Now</Btn>
          </div>}
        </div>
        <div style={{...S.card,marginBottom:'12px',border:`1px solid ${T.red}33`}}>
          <div style={{...S.sectionTitle,color:T.red,marginBottom:'8px'}}>Roster Maintenance</div>
          <div style={{fontSize:'12px',color:T.textSub,marginBottom:'12px'}}>Fix orphaned active roster rows from deleted films.</div>
          <Btn variant="outline" color={T.red} size="sm" onClick={async()=>{const ids=new Set(films.map(f=>f.id)),orphans=rosters.filter(r=>r.active&&!ids.has(r.film_id));if(!orphans.length)return notify('No orphans found ✅',T.green);for(const o of orphans)await supabase.from('rosters').update({active:false}).eq('id',o.id);notify(`Fixed ${orphans.length} orphaned rows`,T.green);loadData(league?.id)}}>Scan & Fix Orphans ({rosters.filter(r=>r.active&&!films.find(f=>f.id===r.film_id)).length})</Btn>
        </div>
        <div style={{...S.card,marginBottom:'12px'}}>
          <div style={{...S.sectionTitle,color:T.gold,marginBottom:'14px'}}>Oscar Night</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <select id="oscar-win" style={{...S.inp,flex:1,minWidth:'180px'}}><option value="">Best Picture winner…</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
            <Btn color={T.gold} onClick={async()=>{const id=document.getElementById('oscar-win').value;if(!id)return;await supabase.from('league_config').update({best_picture_winner:id}).eq('league_id',league?.id);for(const op of oscarPreds)await supabase.from('oscar_predictions').update({correct:op.best_picture_film_id===id}).eq('player_id',op.player_id);notify(`🏆 ${films.find(f=>f.id===id)?.title}`,T.gold);loadData(league?.id)}}>Set Winner</Btn>
          </div>
        </div>
        <div style={{...S.card,marginBottom:'12px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
            <div style={{...S.sectionTitle,color:T.gold}}>Film Management</div>
            <Btn color={T.green} textColor="#0D0A08" size="sm" onClick={()=>setAddFilm(true)}>+ Add Film</Btn>
          </div>
          {[1,2,3,4,5].map(p=>{const pf=films.filter(f=>f.phase===p);if(!pf.length)return null;return(
            <div key={p} style={{marginBottom:'16px'}}>
              <div style={{...S.label,color:p===ph?T.gold:T.textDim,marginBottom:'8px'}}>Phase {p} — {PHASE_NAMES[p]}</div>
              {pf.map(film=>(
                <div key={film.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 0',borderBottom:`1px solid ${T.border}`,flexWrap:'wrap'}}>
                  <FilmPoster film={film} width={24} height={36} radius={4}/>
                  <div style={{flex:2,minWidth:'100px'}}><div style={{fontSize:'12px'}}>{film.title}</div><div style={{fontSize:'10px',color:T.textSub}}>W{film.week}</div></div>
                  {[['IPO','basePrice',50],['EST','estM',50],['RT%','rt',44]].map(([lbl,fld,w])=><div key={fld}><div style={{fontSize:'9px',color:T.textDim,marginBottom:'2px'}}>{lbl}</div><input type="number" defaultValue={film[fld]||''} id={`${fld}-${film.id}`} style={{...S.inp,width:`${w}px`,fontSize:'11px',padding:'4px 6px'}}/></div>)}
                  <div><div style={{fontSize:'9px',color:T.textDim,marginBottom:'2px'}}>TMDB ID</div><input type="text" defaultValue={film.tmdbId||''} id={`tmdb-${film.id}`} style={{...S.inp,width:'70px',fontSize:'10px',padding:'4px 6px'}}/></div>
                  <div><div style={{fontSize:'9px',color:T.textDim,marginBottom:'2px'}}>Trailer</div><input type="text" defaultValue={film.trailer||''} id={`trailer-${film.id}`} style={{...S.inp,width:'80px',fontSize:'10px',padding:'4px 6px'}}/></div>
                  <Btn size="sm" variant="outline" color={T.gold} onClick={async()=>{
                    const ni=parseInt(document.getElementById(`basePrice-${film.id}`).value)
                    const ne=parseInt(document.getElementById(`estM-${film.id}`).value)
                    const nr=parseInt(document.getElementById(`rt-${film.id}`).value)||null
                    const nt=document.getElementById(`trailer-${film.id}`).value.trim()
                    const ntmdb=document.getElementById(`tmdb-${film.id}`).value.trim()||null
                    await supabase.from('films').update({base_price:ni,est_m:ne,rt:nr,trailer:nt,tmdb_id:ntmdb}).eq('id',film.id)
                    // Clear poster cache so it re-fetches with new tmdb_id
                    delete posterCache[film.title];delete posterCache[`id:${film.tmdbId}`]
                    notify(`Updated ${film.title}`,T.green);loadData(league?.id)
                  }}>Save</Btn>
                  <Btn size="sm" variant="outline" color={T.red} onClick={async()=>{if(!confirm(`Remove ${film.title}?`))return;await supabase.from('films').update({active:false}).eq('id',film.id);notify(`Removed ${film.title}`,T.red);loadData(league?.id)}}>✕</Btn>
                </div>
              ))}
            </div>
          )})}
        </div>
        <div style={S.card}>
          <div style={{...S.sectionTitle,color:T.gold,marginBottom:'14px'}}>Chip Overrides</div>
          {!allChips.length&&<div style={{fontSize:'13px',color:T.textSub}}>No chips activated yet.</div>}
          {allChips.map(c=>{const p=players.find(pl=>pl.id===c.player_id);return(
            <div key={c.id} style={{padding:'12px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:600,color:p?.color||T.gold,marginBottom:'8px'}}>{p?.name}</div>
              {c.short_film_id&&<div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginBottom:'6px'}}><span style={{fontSize:'12px',color:T.red}}>📉 {films.find(f=>f.id===c.short_film_id)?.title}</span><span style={{fontSize:'12px',color:T.textSub}}>→ {c.short_result||'pending'}</span>{!c.short_result&&<><Btn color={T.green} textColor="#0D0A08" size="sm" onClick={async()=>{await supabase.from('chips').update({short_result:'win'}).eq('player_id',c.player_id);notify('Short WIN',T.green);loadData(league?.id)}}>Win</Btn><Btn color={T.red} textColor="#fff" size="sm" onClick={async()=>{await supabase.from('chips').update({short_result:'lose'}).eq('player_id',c.player_id);notify('Short LOSE',T.red);loadData(league?.id)}}>Lose</Btn></>}</div>}
              {c.analyst_film_id&&<div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:'12px',color:T.blue}}>🎯 {films.find(f=>f.id===c.analyst_film_id)?.title} · ${c.analyst_prediction}M</span><span style={{fontSize:'12px',color:T.textSub}}>→ {c.analyst_result||'pending'}</span>{!c.analyst_result&&<><Btn color={T.green} textColor="#0D0A08" size="sm" onClick={async()=>{await supabase.from('chips').update({analyst_result:'win'}).eq('player_id',c.player_id);notify('Analyst WIN',T.green);loadData(league?.id)}}>Win</Btn><Btn color={T.red} textColor="#fff" size="sm" onClick={async()=>{await supabase.from('chips').update({analyst_result:'lose'}).eq('player_id',c.player_id);notify('Analyst LOSE',T.red);loadData(league?.id)}}>Lose</Btn></>}</div>}
            </div>
          )})}
        </div>
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
      case 'commissioner': return <CommissionerPage/>
      case 'distributor':  return <DistributorPage/>
      default:           return <MarketPage/>
    }
  }

  const navigate=(id)=>{setPage(id);setMoreOpen(false);window.scrollTo({top:0,behavior:'smooth'})}

  const draftBannerVisible=draftWindowOpen&&draftShortfall>0

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:T.mono,fontSize:'14px'}}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={{position:'sticky',top:0,zIndex:200,background:`${T.bg}F0`,backdropFilter:'blur(12px)',borderBottom:`1px solid ${T.border}`,padding:'0 16px',height:'54px',display:'flex',alignItems:'center',gap:'12px'}}>
        <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:'none',border:'none',color:T.textSub,cursor:'pointer',fontSize:'18px',padding:'4px',flexShrink:0,display:isMobile?'none':'block'}}>☰</button>
        <div style={{fontSize:'22px',fontWeight:900,color:T.gold,letterSpacing:'-1px',lineHeight:1,flexShrink:0,cursor:'pointer'}} onClick={()=>navigate('market')}>BOXD</div>
        {league&&<div style={{fontSize:'12px',color:T.textSub,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{league.name}</div>}
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexShrink:0}}>
          {draftWindowOpen&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1,cursor:'pointer'}} onClick={()=>navigate('market')}>
            <DraftTimer deadline={draftDeadline} shortfall={draftShortfall} draftMin={DRAFT_MIN}/>
          </div>}
          <div style={{background:myBudget<20?`${T.red}22`:`${T.gold}18`,border:`1px solid ${myBudget<20?T.red+'44':T.gold+'44'}`,borderRadius:'20px',padding:'5px 12px',fontSize:'13px',fontWeight:700,color:myBudget<20?T.red:T.gold,whiteSpace:'nowrap',cursor:'pointer'}} onClick={()=>navigate('roster')}>
            {cur}{myBudget}M
          </div>
          {pendingForMe.length>0&&<div style={{background:`${T.blue}22`,border:`1px solid ${T.blue}55`,borderRadius:'20px',padding:'5px 10px',fontSize:'12px',color:T.blue,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>navigate('trades')}>
            🔄 {pendingForMe.length}
          </div>}
          <div onClick={()=>goToProfile(profile)} style={{width:'32px',height:'32px',borderRadius:'50%',background:profile?.color||T.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:900,color:'#0D0A08',cursor:'pointer',flexShrink:0}}>
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
          <div style={{width:'200px',flexShrink:0,borderRight:`1px solid ${T.border}`,padding:'16px 10px',display:'flex',flexDirection:'column',gap:'2px',position:'sticky',top:'54px',height:'calc(100vh - 54px)',overflowY:'auto'}}>
            {ALL_PAGES.map(({id,icon,label})=>{
              const active=page===id
              const badge=id==='trades'&&pendingForMe.length>0?pendingForMe.length:null
              return(
                <button key={id} onClick={()=>navigate(id)} style={{...S.btn,width:'100%',justifyContent:'flex-start',background:active?`${T.gold}18`:'transparent',color:active?T.gold:T.textSub,border:`1px solid ${active?T.gold+'44':'transparent'}`,padding:'10px 14px',fontSize:'12px',gap:'10px',textTransform:'none',letterSpacing:0,fontWeight:active?700:400,position:'relative'}}>
                  <span style={{fontSize:'15px'}}>{icon}</span>
                  <span>{label}</span>
                  {badge&&<span style={{marginLeft:'auto',background:T.blue,color:'#fff',borderRadius:'20px',fontSize:'10px',padding:'1px 7px',fontWeight:700}}>{badge}</span>}
                </button>
              )
            })}
            <div style={{marginTop:'auto',paddingTop:'16px',borderTop:`1px solid ${T.border}`}}>
              <button onClick={()=>supabase.auth.signOut()} style={{...S.btn,width:'100%',background:'none',color:T.textDim,padding:'8px 14px',fontSize:'11px',textTransform:'none',letterSpacing:0,justifyContent:'flex-start',gap:'8px'}}>→ Sign out</button>
              <button onClick={()=>{setLeague(null);supabase.from('profiles').update({active_league_id:null}).eq('id',profile.id)}} style={{...S.btn,width:'100%',background:'none',color:T.textDim,padding:'8px 14px',fontSize:'11px',textTransform:'none',letterSpacing:0,justifyContent:'flex-start',gap:'8px'}}>← Switch league</button>
            </div>
          </div>
        )}

        {/* ── PAGE CONTENT ────────────────────────────────────────────────── */}
        <div style={{flex:1,minWidth:0,padding:isMobile?'16px 14px 100px':'24px 28px 48px',maxWidth:isMobile?'100%':'880px'}}>
          {renderPage()}
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
          anonKey={supabase.supabaseKey}
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
    </div>
  )
}
