import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
const S = {
app: { minHeight:'100vh', background:'#07080B', color:'#F2EEE8', fontFamily:'DM Mono, monos
topbar: { background:'#0C0E12', borderBottom:'1px solid #1E222C', padding:'0 16px', height:
main: { flex:1, padding:'16px', overflowY:'auto', minWidth:0 },
card: { background:'#0C0E12', border:'1px solid #1E222C', borderRadius:'11px', padding:'14p
btn: { border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'11px', letterSpacin
inp: { background:'#12141A', border:'1px solid #2A2F3C', color:'#F2EEE8', borderRadius:'7px
gold: '#F0B429', green: '#2DD67A', red: '#FF4757', blue: '#4D9EFF', purple: '#A855F7', oran
}
const GENRE_COL = {
Action:'#F4845F', Horror:'#C77DFF', Drama:'#74C0FC', Family:'#80ED99',
'Sci-Fi':'#4D9EFF', Animation:'#FF9F43', Comedy:'#F5C842', Thriller:'#FF5C8A',
Concert:'#FF8C3D', Adventure:'#2DD67A',
}
const COMMISSIONER_EMAIL = 'mattharris2105@gmail.com'
const EARLY_BIRD_WEEKS = 4
const MAX_ROSTER = 6
const PHASE_BUDGETS = { 1:80, 2:150, 3:80, 4:100, 5:120 }
const PHASE_NAMES = { 1:'Dead Zone', 2:'Summer Slate', 3:'Horror Window', 4:'Awards Season',
const FILMS_DEFAULT = [
{id:'f001',title:'We Bury the Dead',dist:'Lionsgate',genre:'Horror',franchise:null,starActo
{id:'f002',title:'Greenland 2: Migration',dist:'Lionsgate',genre:'Action',franchise:'Greenl
{id:'f003',title:'Primate',dist:'Universal',genre:'Thriller',franchise:null,starActor:null,
{id:'f004',title:'28 Years Later: The Bone Temple',dist:'Sony',genre:'Horror',franchise:'28
{id:'f005',title:"Dead Man's Wire",dist:'WB',genre:'Thriller',franchise:null,starActor:null
{id:'f006',title:'Killer Whale',dist:'Paramount',genre:'Thriller',franchise:null,starActor:
{id:'f007',title:'Night Patrol',dist:'Sony',genre:'Action',franchise:null,starActor:null,ph
{id:'f008',title:'Return to Silent Hill',dist:'Sony',genre:'Horror',franchise:'Silent Hill'
{id:'f009',title:'Mercy',dist:'Netflix',genre:'Thriller',franchise:null,starActor:null,phas
{id:'f010',title:'Send Help',dist:'Universal',genre:'Horror',franchise:null,starActor:'Rach
{id:'f011',title:'Iron Lung',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:
{id:'f012',title:'The Strangers: Chapter 3',dist:'Lionsgate',genre:'Horror',franchise:'The
{id:'f013',title:'Dracula: A Love Tale',dist:'Universal',genre:'Horror',franchise:null,star
{id:'f014',title:'Whistle',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase
{id:'f015',title:"Good Luck Have Fun Don't Die",dist:'Amazon MGM',genre:'Sci-Fi',franchise:
{id:'f016',title:'Cold Storage',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:
{id:'f017',title:'GOAT',dist:'Sony Animation',genre:'Animation',franchise:null,starActor:nu
{id:'f018',title:'Wuthering Heights',dist:'WB',genre:'Drama',franchise:null,starActor:'Marg
{id:'f019',title:'Crime 101',dist:'A24',genre:'Thriller',franchise:null,starActor:'Glen Pow
{id:'f020',title:'Psycho Killer',dist:'Universal',genre:'Horror',franchise:null,starActor:n
{id:'f021',title:'I Can Only Imagine 2',dist:'Lionsgate',genre:'Drama',franchise:null,starA
{id:'f022',title:'Dreams',dist:'Universal',genre:'Drama',franchise:null,starActor:'Glen Pow
{id:'f023',title:'Scream 7',dist:'Paramount',genre:'Horror',franchise:'Scream',starActor:'N
{id:'f024',title:"Dr Seuss' The Cat in the Hat",dist:'WB',genre:'Animation',franchise:null,
{id:'f025',title:'Hoppers',dist:'Disney/Pixar',genre:'Animation',franchise:null,starActor:n
{id:'f026',title:'The Bride!',dist:'Universal',genre:'Horror',franchise:null,starActor:'Chr
{id:'f027',title:'Peaky Blinders: The Immortal Man',dist:'Netflix',genre:'Drama',franchise:
{id:'f028',title:'The Breadwinner',dist:'GKIDS',genre:'Animation',franchise:null,starActor:
{id:'f029',title:'Reminders of Him',dist:'Sony',genre:'Drama',franchise:null,starActor:null
{id:'f030',title:'Project Hail Mary',dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starAc
{id:'f031',title:'They Will Kill You',dist:'Amazon MGM',genre:'Horror',franchise:null,starA
{id:'f032',title:'Romeo + Juliet (30th Anniversary)',dist:'Paramount',genre:'Drama',franchi
{id:'f033',title:'Splittsville',dist:'Lionsgate',genre:'Comedy',franchise:null,starActor:nu
{id:'f034',title:'The Magic Faraway Tree',dist:'StudioCanal',genre:'Family',franchise:null,
{id:'f035',title:'Bluey At The Cinema',dist:'Lionsgate',genre:'Family',franchise:'Bluey',st
{id:'f036',title:'Ready or Not 2: Here I Come',dist:'Searchlight',genre:'Horror',franchise:
{id:'f037',title:'Forbidden Fruits',dist:'Lionsgate',genre:'Thriller',franchise:null,starAc
{id:'f038',title:'The Super Mario Galaxy Movie',dist:'Universal/Illumination',genre:'Animat
{id:'f039',title:'The Drama',dist:'A24',genre:'Drama',franchise:null,starActor:null,phase:1
{id:'f040',title:'Fuze',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,pha
{id:'f041',title:'Amelie (25th Anniversary)',dist:'Lionsgate',genre:'Drama',franchise:null,
{id:'f042',title:'You Me & Tuscany',dist:'Universal',genre:'Comedy',franchise:null,starActo
{id:'f043',title:'Undertone',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,pha
{id:'f044',title:"California Schemin'",dist:'A24',genre:'Drama',franchise:null,starActor:nu
{id:'f045',title:'Father Mother Sister Brother',dist:'Lionsgate',genre:'Drama',franchise:nu
{id:'f046',title:"Lee Cronin's The Mummy",dist:'Universal',genre:'Horror',franchise:'Mummy'
{id:'f047',title:'Glenorchy',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase
{id:'f048',title:'Michael',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jaafar
{id:'f049',title:'Exit 8',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:1
{id:'f050',title:'Mother Mary',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null
{id:'f051',title:'Hiroyuki',dist:'Sony',genre:'Family',franchise:null,starActor:null,phase:
{id:'f052',title:'The Devil Wears Prada 2',dist:'Disney/20th',genre:'Comedy',franchise:'Pra
{id:'f053',title:'Hokum',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phas
{id:'f054',title:'Iron Maiden: Burning Ambition',dist:'Paramount',genre:'Concert',franchise
{id:'f055',title:'Mortal Kombat II',dist:'WB/New Line',genre:'Action',franchise:'Mortal Kom
{id:'f056',title:'The Sheep Detectives',dist:'Lionsgate',genre:'Family',franchise:null,star
{id:'f057',title:'Billie Eilish: Hit Me Hard And Soft Tour',dist:'Paramount',genre:'Concert
{id:'f058',title:'Top Gun (40th Anniversary)',dist:'Paramount',genre:'Action',franchise:'To
{id:'f059',title:'Obsession',dist:'Focus',genre:'Thriller',franchise:null,starActor:null,ph
{id:'f060',title:'Normal',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:2,
{id:'f061',title:'The Christophers',dist:'Lionsgate',genre:'Drama',franchise:null,starActor
{id:'f062',title:'500 Miles (Ireland)',dist:'Lionsgate',genre:'Drama',franchise:null,starAc
{id:'f063',title:'Charlie The Wonderdog',dist:'Universal',genre:'Family',franchise:null,sta
{id:'f064',title:'The Mandalorian & Grogu',dist:'Disney/Lucasfilm',genre:'Action',franchise
{id:'f065',title:'Finding Emily',dist:'Paramount',genre:'Comedy',franchise:null,starActor:n
{id:'f066',title:'Passenger',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,pha
{id:'f067',title:'Tom & Jerry: Forbidden Compass HFSS',dist:'WB',genre:'Animation',franchis
{id:'f068',title:'Power Ballad',dist:'Universal',genre:'Comedy',franchise:null,starActor:nu
{id:'f069',title:'Tuner',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2
{id:'f070',title:'Savage House',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:nu
{id:'f071',title:'Masters of the Universe',dist:'Amazon MGM',genre:'Action',franchise:'MOTU
{id:'f072',title:'Scary Movie 6',dist:'Paramount',genre:'Comedy',franchise:'Scary Movie',st
{id:'f073',title:'Animal Friends',dist:'Universal',genre:'Animation',franchise:null,starAct
{id:'f074',title:'Disclosure Day',dist:'Sony',genre:'Sci-Fi',franchise:null,starActor:null,
{id:'f075',title:'Toy Story 5',dist:'Disney/Pixar',genre:'Animation',franchise:'Toy Story',
{id:'f076',title:'Supergirl',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Milly A
{id:'f077',title:'Untitled Jackass Event Film',dist:'Paramount',genre:'Comedy',franchise:'J
{id:'f078',title:'500 Miles (England/Scotland/Wales)',dist:'Lionsgate',genre:'Drama',franch
{id:'f079',title:'Minions & Monsters',dist:'Universal/Illumination',genre:'Animation',franc
{id:'f080',title:'The Movie',dist:'TBC',genre:'Action',franchise:null,starActor:null,phase:
{id:'f081',title:'Moana (Live Action)',dist:'Disney',genre:'Family',franchise:'Moana',starA
{id:'f082',title:'Alpha',dist:'Sony',genre:'Action',franchise:null,starActor:'Michael B Jor
{id:'f083',title:'The Odyssey',dist:'Universal/Nolan',genre:'Drama',franchise:null,starActo
{id:'f084',title:'Cut Off',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:
{id:'f085',title:'Evil Dead Burn',dist:'Sony',genre:'Horror',franchise:'Evil Dead',starActo
{id:'f086',title:'Spider-Man: Brand New Day',dist:'Sony/Marvel',genre:'Action',franchise:'S
{id:'f087',title:'Super Troopers 3',dist:'Fox',genre:'Comedy',franchise:'Super Troopers',st
{id:'f088',title:'Fall 2',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,p
{id:'f089',title:'Paw Patrol: The Dino Movie HFSS',dist:'Paramount',genre:'Family',franchis
{id:'f090',title:'Flowervale Street',dist:'Focus',genre:'Drama',franchise:null,starActor:nu
{id:'f091',title:'The End of Oak Street',dist:'Universal',genre:'Adventure',franchise:null,
{id:'f092',title:'Insidious: The Bleeding World',dist:'Sony/Blumhouse',genre:'Horror',franc
{id:'f093',title:'Mutiny',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:
{id:'f094',title:'Spa Weekend',dist:'Sony',genre:'Comedy',franchise:null,starActor:null,pha
{id:'f095',title:'Teenage Sex and Death at Camp Miasma',dist:'A24',genre:'Horror',franchise
{id:'f096',title:'The Dog Stars',dist:'20th Century',genre:'Sci-Fi',franchise:null,starActo
{id:'f097',title:'Cliffhanger',dist:'Sony',genre:'Action',franchise:null,starActor:null,pha
{id:'f098',title:'One Night Only',dist:'Lionsgate',genre:'Thriller',franchise:null,starActo
{id:'f099',title:'How to Rob a Bank',dist:'Netflix',genre:'Comedy',franchise:null,starActor
{id:'f100',title:'Pressure',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phas
{id:'f101',title:'A Practical Magic Film',dist:'WB',genre:'Horror',franchise:'Practical Mag
{id:'f102',title:'Clayface',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Tom Rhys
{id:'f103',title:'Resident Evil',dist:'Sony',genre:'Horror',franchise:'Resident Evil',starA
{id:'f104',title:'Bad Apples',dist:'Paramount',genre:'Horror',franchise:null,starActor:null
{id:'f105',title:'Sense and Sensibility',dist:'Sony',genre:'Drama',franchise:null,starActor
{id:'f106',title:'Avengers: Endgame (Re-release)',dist:'Disney',genre:'Action',franchise:'M
{id:'f107',title:'Verity',dist:'Amazon MGM',genre:'Thriller',franchise:null,starActor:'Blak
{id:'f108',title:'Digger',dist:'Paramount',genre:'Comedy',franchise:null,starActor:'Tom Cru
{id:'f109',title:'The Social Reckoning',dist:'Universal',genre:'Drama',franchise:null,starA
{id:'f110',title:'Other Mommy',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:nul
{id:'f111',title:'The Legend of Aang',dist:'Paramount',genre:'Animation',franchise:'Avatar:
{id:'f112',title:'Street Fighter',dist:'Paramount',genre:'Action',franchise:'Street Fighter
{id:'f113',title:'Whalefall',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:
{id:'f114',title:'Wildwood',dist:'Focus',genre:'Adventure',franchise:null,starActor:null,ph
{id:'f115',title:'Forgotten Island',dist:'Universal',genre:'Family',franchise:null,starActo
{id:'f116',title:'Wife & Dog',dist:'Universal',genre:'Comedy',franchise:null,starActor:null
{id:'f117',title:'Clayface (Wide)',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'N
{id:'f118',title:'Ghosts: The Possession of Button House',dist:'Lionsgate',genre:'Horror',f
{id:'f119',title:'Animal',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:
{id:'f120',title:'Tad and the Magic Lamp',dist:'Paramount',genre:'Animation',franchise:'Tad
{id:'f121',title:'Remain',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:3,w
{id:'f122',title:'Terrifier 4',dist:'Cineverse',genre:'Horror',franchise:'Terrifier',starAc
{id:'f123',title:'Wild Horse Nine',dist:'WDi',genre:'Drama',franchise:null,starActor:null,p
{id:'f124',title:'The Cat in the Hat HFSS',dist:'WB',genre:'Animation',franchise:null,starA
{id:'f125',title:'The Great Beyond',dist:'Searchlight',genre:'Drama',franchise:null,starAct
{id:'f126',title:'Ebenezer: A Christmas Carol',dist:'Disney',genre:'Animation',franchise:nu
{id:'f127',title:'The Hunger Games: Sunrise on the Reaping',dist:'Lionsgate',genre:'Action'
{id:'f128',title:'I Play Rocky',dist:'Universal',genre:'Drama',franchise:null,starActor:nul
{id:'f129',title:'Focker In-Law',dist:'Paramount',genre:'Comedy',franchise:'Fockers',starAc
{id:'f130',title:"Disney's Hexed HFSS",dist:'Disney',genre:'Horror',franchise:null,starActo
{id:'f131',title:"Narnia: The Magician's Nephew",dist:'Netflix/Sony',genre:'Adventure',fran
{id:'f132',title:'Violent Night 2',dist:'Universal',genre:'Action',franchise:'Violent Night
{id:'f133',title:'Jumanji 3',dist:'Sony',genre:'Action',franchise:'Jumanji',starActor:'Dway
{id:'f134',title:'Dune: Part Three',dist:'WB',genre:'Sci-Fi',franchise:'Dune',starActor:'Ti
{id:'f135',title:'Avengers: Doomsday',dist:'Marvel/Disney',genre:'Action',franchise:'MCU',s
{id:'f136',title:'The Angry Birds Movie 3 HFSS',dist:'Paramount',genre:'Animation',franchis
{id:'f137',title:'King',dist:'Fox',genre:'Drama',franchise:null,starActor:null,phase:4,week
{id:'f138',title:'Werwulf',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,ph
{id:'f139',title:'The Beekeeper 2',dist:'Amazon MGM',genre:'Action',franchise:null,starActo
{id:'f140',title:'Children of Blood and Bone',dist:'Paramount',genre:'Action',franchise:nul
{id:'f141',title:'The Rescue',dist:'Disney',genre:'Drama',franchise:null,starActor:null,pha
{id:'f142',title:'The Thomas Crown Affair',dist:'Sony',genre:'Thriller',franchise:null,star
{id:'f143',title:'Ice Age: Boiling Point HFSS',dist:'Disney/20th',genre:'Animation',franchi
{id:'f144',title:'The Nightingale',dist:'Universal',genre:'Drama',franchise:null,starActor:
{id:'f145',title:'Star Wars: A New Hope (50th Anniversary)',dist:'Disney',genre:'Action',fr
{id:'f146',title:'Sonic the Hedgehog 4 HFSS',dist:'Paramount',genre:'Family',franchise:'Son
{id:'f147',title:'Untitled Mike Flanagan Exorcist Film',dist:'Lionsgate',genre:'Horror',fra
{id:'f148',title:'The Resurrection of The Christ: Part One',dist:'Lionsgate',genre:'Drama',
]
// ── SCORING FUNCTIONS ──
// UPDATED: Analyst = +60pts flat. Weekly W1-3=1pt/$1M, W4+=1.1pts/$1M
function calcMarketValue(film, actualM) {
if (actualM == null) return film.basePrice
const ratio = actualM / film.estM
let m = ratio>=2?2.00:ratio>=1.5?1.60:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1.00:rati
let rtMod = film.rt>=90?1.15:film.rt>=75?1.08:(film.rt<50&&film.rt!=null)?0.90:1.0
let value = film.basePrice * m * rtMod
return Math.round(Math.max(film.basePrice*0.15, Math.min(film.basePrice*3.0, value)))
}
function calcOpeningPts(film, actualM, isEarlyBird=false, isAnalyst=false) {
if (actualM == null) return 0
const ratio = actualM / film.estM
let perfMult = ratio>=2?2.00:ratio>=1.5?1.60:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1.
let rtMod = film.rt>=90?1.25:film.rt>=75?1.10:(film.rt<50&&film.rt!=null)?0.85:1.0
let pts = Math.round(actualM * perfMult * rtMod)
if (isEarlyBird && ratio>=1.10) pts = Math.round(pts * 1.10)
if (isAnalyst) pts = pts + 60 // UPDATED: flat +60 not triple
return pts
}
function calcLegsBonus(actualM, week2M) {
if (actualM==null||week2M==null) return 0
return ((actualM-week2M)/actualM)<0.30?25:0
}
// UPDATED: W1-3=1pt/$1M, W4+=1.1pts/$1M
function calcWeeklyPtsFromMap(weeksMap) {
return Object.entries(weeksMap).reduce((s,[wk,g])=>{
const rate = Number(wk)>=4?1.1:1.0
return s + Number(g)*rate
},0)
}
async function dbUpsertResult(filmId, actualM) {
const e = await supabase.from('results').select('film_id').eq('film_id',filmId).single()
if (e.data) return supabase.from('results').update({actual_m:actualM}).eq('film_id',filmId)
return supabase.from('results').insert({film_id:filmId,actual_m:actualM})
}
async function dbUpsertFilmValue(filmId, value) {
const e = await supabase.from('film_values').select('film_id').eq('film_id',filmId).single(
if (e.data) return supabase.from('film_values').update({current_value:value}).eq('film_id',
return supabase.from('film_values').insert({film_id:filmId,current_value:value})
}
async function dbUpsertWeekly(filmId, weekNum, grossM) {
const e = await supabase.from('weekly_grosses').select('id').eq('film_id',filmId).eq('week_
if (e.data) return supabase.from('weekly_grosses').update({gross_m:grossM}).eq('film_id',fi
return supabase.from('weekly_grosses').insert({film_id:filmId,week_num:weekNum,gross_m:gros
}
// ── SCORE BREAKDOWN MODAL ──
function ScoreBreakdownModal({film,holding,results,weeklyGrosses,allChips,auteurDeclarations,
const actual = results[film.id]
const weeks = weeklyGrosses[film.id]||{}
const pid = holding.player_id
const chip = allChips.find(c=>c.player_id===pid)
const analystWin = chip?.analyst_film_id===film.id && chip?.analyst_result==='win'
const shortResult = chip?.short_film_id===film.id ? chip?.short_result : null
const earlyBird = isEarlyBird(holding)
const auteur = auteurDeclarations.find(a=>a.player_id===pid)?.film_ids?.includes(film.id)
const isWW = Object.values(weekendWinners).includes(film.id)
const baseOpen = actual!=null ? calcOpeningPts(film,actual,false,false) : 0
const ebBonus = (earlyBird&&actual!=null&&actual/film.estM>=1.10) ? Math.round(baseOpen*0.1
const analystBonus = analystWin ? 60 : 0
const auteurBonus = auteur ? Math.round((baseOpen+ebBonus)*0.10) : 0
const openPts = baseOpen+ebBonus+analystBonus+auteurBonus
const weeklyPts = Math.round(calcWeeklyPtsFromMap(weeks))
const legsBonus = calcLegsBonus(actual, weeks[2])
const wwBonus = isWW?15:0
const shortBonus = shortResult==='win'?100:shortResult==='lose'?-30:0
const total = openPts+weeklyPts+legsBonus+wwBonus+shortBonus
const genreCol = GENRE_COL[film.genre]||'#888'
const Row=({label,value,col,sub})=>(
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9
<div><div style={{fontSize:'11px',color:'#9AA0B2'}}>{label}</div>{sub&&<div style={{fon
<div style={{fontSize:'14px',fontWeight:700,color:col||'#F2EEE8'}}>{value}</div>
</div>
)
return (
<div style={{position:'fixed',inset:0,background:'#000000DD',display:'flex',alignItems:'f
<div style={{background:'#0C0E12',border:'1px solid #1E222C',borderRadius:'16px 16px 0
<div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin
{/* Film header */}
<div style={{position:'relative',overflow:'hidden',borderRadius:'10px',background:'#1
<div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:genre
<div style={{fontSize:'15px',fontWeight:700,marginTop:'4px'}}>{film.title}</div>
<div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>{film.dist} · W{film
{actual!=null&&(
<div style={{marginTop:'10px',display:'flex',gap:'16px',flexWrap:'wrap'}}>
<div><div style={{fontSize:'8px',color:'#4A5168'}}>ACTUAL</div><div style={{fon
<div><div style={{fontSize:'8px',color:'#4A5168'}}>EST</div><div style={{fontSi
<div><div style={{fontSize:'8px',color:'#4A5168'}}>RATIO</div><div style={{font
{film.rt!=null&&<div><div style={{fontSize:'8px',color:'#4A5168'}}>RT</div><div
</div>
)}
</div>
{actual==null?(
<div style={{textAlign:'center',color:'#4A5168',padding:'28px',fontSize:'12px'}}>No
):(
<>
<div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'6px
<Row label="Base opening pts" value={`+${baseOpen}`}
sub={`$${actual}M × ${(actual/film.estM).toFixed(2)}× perf · RT ×${film.rt>=90?
{earlyBird&&ebBonus>0&&<Row label=" Early Bird +10%" value={`+${ebBonus}`} col=
{analystWin&&<Row label=" Analyst chip bonus" value="+60" col="#4D9EFF" sub="Pr
{auteur&&auteurBonus>0&&<Row label=" Auteur +10%" value={`+${auteurBonus}`} col
{weeklyPts>0&&(
<div style={{padding:'9px 0',borderBottom:'1px solid #1E222C'}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center
<div style={{fontSize:'11px',color:'#9AA0B2'}}>Weekly grosses</div>
<div style={{fontSize:'14px',fontWeight:700,color:'#4D9EFF'}}>+{weeklyPts}<
</div>
<div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'4px'}}>
{Object.entries(weeks).sort((a,b)=>Number(a[0])-Number(b[0])).map(([wk,gros
const rate=Number(wk)>=4?1.1:1.0
return(<div key={wk} style={{background:'#12141A',borderRadius:'5px',padd
<span style={{color:'#4A5168'}}>W{wk} ${gross}M → </span>
<span style={{color:'#4D9EFF'}}>+{Math.round(Number(gross)*rate)}</span
{Number(wk)>=4&&<span style={{color:'#4A5168'}}> ×1.1</span>}
</div>)
})}
</div>
</div>
<div style={{fontSize:'9px',color:'#4A5168'}}>W1–W3: 1pt/$1M · W4+: 1.1pts/$1
)}
{legsBonus>0&&<Row label=" {isWW&&<Row label=" Legs bonus" value="+25" col="#2DD67A" sub={`W2 drop
Weekend winner" value="+15" col="#F0B429" sub="#1 film at t
{shortBonus!==0&&<Row label={shortBonus>0?' Short — WIN':' Short — LOSE'} val
<div style={{marginTop:'14px',background:'#12141A',borderRadius:'10px',padding:'1
<div style={{fontSize:'11px',color:'#9AA0B2',letterSpacing:'1px',fontWeight:600
<div style={{fontSize:'32px',fontWeight:900,color:'#F0B429'}}>{total}</div>
</div>
</>
)}
</div>
</div>
<button style={{...S.btn,width:'100%',background:'#12141A',border:'1px solid #2A2F3C'
)
}
// ── MOBILE BOTTOM NAV ──
function BottomNav({page,setPage,isCommissioner,onMore}) {
const items=[['market',' ','Market'],['roster',' ','Roster'],['chips',' ','Chips'],['le
return (
<div style={{position:'fixed',bottom:0,left:0,right:0,background:'#0C0E12',borderTop:'1px
{items.map(([id,ic,lb])=>(
<div key={id} onClick={()=>id==='more'?onMore():setPage(id)} style={{flex:1,display:'
<div style={{fontSize:'18px',lineHeight:1}}>{ic}</div>
<div style={{fontSize:'9px',marginTop:'2px'}}>{lb}</div>
</div>
))}
</div>
)
}
','Re
// ── MORE DRAWER ──
function MoreDrawer({page,setPage,isCommissioner,onClose}) {
const extras=[['forecaster',' ','Forecaster'],['oscar',' ','Oscars'],['results',' return (
<div style={{position:'fixed',inset:0,background:'#000000CC',zIndex:300}} onClick={onClos
<div style={{position:'absolute',bottom:0,left:0,right:0,background:'#0C0E12',borderTop
<div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin
{extras.map(([id,ic,lb])=>(
<div key={id} onClick={()=>{setPage(id);onClose()}} style={{display:'flex',alignIte
<span style={{fontSize:'20px'}}>{ic}</span><span style={{fontSize:'13px'}}>{lb}</
</div>
))}
</div>
</div>
)
}
// ── MAIN APP ──
export default function App() {
const [session,setSession]=useState(null)
const [loading,setLoading]=useState(true)
const [profile,setProfile]=useState(null)
const [page,setPage]=useState('market')
const [players,setPlayers]=useState([])
const [rosters,setRosters]=useState([])
const [results,setResults]=useState({})
const [filmValues,setFilmValues]=useState({})
const [weeklyGrosses,setWeeklyGrosses]=useState({})
const [chips,setChips]=useState(null)
const [allChips,setAllChips]=useState([])
const [films,setFilms]=useState(FILMS_DEFAULT)
const [forecasts,setForecasts]=useState({})
const [allForecasts,setAllForecasts]=useState([])
const [oscarPredictions,setOscarPredictions]=useState([])
const [myOscarPick,setMyOscarPick]=useState(null)
const [auteurDeclarations,setAuteurDeclarations]=useState([])
const [weekendWinners,setWeekendWinners]=useState({})
const [phaseBudgets,setPhaseBudgets]=useState([])
const [leagueConfig,setLeagueConfig]=useState({current_week:1,current_phase:1,currency:'$',
const [notif,setNotif]=useState(null)
const [trailerFilm,setTrailerFilm]=useState(null)
const [chipModal,setChipModal]=useState(null)
const [addFilmModal,setAddFilmModal]=useState(false)
const [newFilm,setNewFilm]=useState({title:'',dist:'',genre:'Action',franchise:'',basePrice
const [now,setNow]=useState(Date.now())
const [scoreModal,setScoreModal]=useState(null)
const [showMore,setShowMore]=useState(false)
const [isMobile,setIsMobile]=useState(window.innerWidth<700)
useEffect(()=>{
const h=()=>setIsMobile(window.innerWidth<700)
window.addEventListener('resize',h)
return()=>window.removeEventListener('resize',h)
},[])
useEffect(()=>{
supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false
supabase.auth.onAuthStateChange((_e,session)=>setSession(session))
},[])
useEffect(()=>{if(session){loadProfile();loadData()}},[session])
useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)}
const notify=(msg,col=S.gold)=>{setNotif({msg,col});setTimeout(()=>setNotif(null),3000)}
const isCommissioner=session?.user?.email===COMMISSIONER_EMAIL
const loadProfile=async()=>{
const{data}=await supabase.from('profiles').select('*').eq('id',session.user.id).single()
if(data)setProfile(data)
}
const loadData=async()=>{
const[{data:ps},{data:rs},{data:res},{data:fv},{data:cfg},{data:wg},{data:ch},{data:fc},{
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
if(ps)setPlayers(ps)
if(rs)setRosters(rs)
if(res){const m={};res.forEach(r=>m[r.film_id]=r.actual_m);setResults(m)}
if(fv){const m={};fv.forEach(v=>m[v.film_id]=v.current_value);setFilmValues(m)}
if(cfg)setLeagueConfig(cfg)
if(wg){const m={};wg.forEach(w=>{if(!m[w.film_id])m[w.film_id]={};m[w.film_id][w.week_num
if(ch){setAllChips(ch);setChips(ch.find(c=>c.player_id===session?.user?.id)||null)}
if(fc){setAllForecasts(fc);const m={};fc.filter(f=>f.player_id===session?.user?.id).forEa
if(op){setOscarPredictions(op);setMyOscarPick(op.find(o=>o.player_id===session?.user?.id)
if(ad)setAuteurDeclarations(ad)
if(ww){const m={};ww.forEach(w=>m[w.week]=w.film_id);setWeekendWinners(m)}
if(pb)setPhaseBudgets(pb)
}
// ── BUDGET ──
const curPhase=()=>leagueConfig.current_phase||1
const isWindow=()=>leagueConfig.phase_window_active||false
const phaseBanked=(pid,ph)=>{
if(ph<=1)return 0
return phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph-1)?.budget_banked||0
}
const phaseAllocated=(pid,ph)=>{
const s=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph)
if(s)return s.budget_allocated
return (PHASE_BUDGETS[ph]||100)+phaseBanked(pid,ph)
}
const phaseSpent=(pid,ph)=>rosters.filter(r=>r.player_id===pid&&r.phase===ph&&r.active).red
const budgetLeft=(pid)=>Math.max(0,phaseAllocated(pid,curPhase())-phaseSpent(pid,curPhase()
const bankBudget=async(pid,ph)=>{
const alloc=phaseAllocated(pid,ph),spent=phaseSpent(pid,ph),banked=Math.max(0,alloc-spent
const ex=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph)
if(ex)await supabase.from('phase_budgets').update({budget_allocated:alloc,budget_spent:sp
else await supabase.from('phase_budgets').insert({player_id:pid,phase:ph,budget_allocated
}
// ── HELPERS ──
const filmVal=(film)=>filmValues[film.id]??film.basePrice
const weeklyPts=(filmId)=>calcWeeklyPtsFromMap(weeklyGrosses[filmId]||{})
const legsBonus=(filmId)=>calcLegsBonus(results[filmId],weeklyGrosses[filmId]?.[2])
const wwBonus=(filmId)=>Object.values(weekendWinners).includes(filmId)?15:0
const isEarlyBird=(holding)=>{
const film=films.find(f=>f.id===holding.film_id)
if(!film)return false
return film.week-(holding.acquired_week||holding.bought_week)>=EARLY_BIRD_WEEKS
}
const auteurBonus=(pid,filmId)=>{
const d=auteurDeclarations.find(a=>a.player_id===pid&&a.phase===curPhase())
return d?.film_ids?.includes(filmId)||false
}
const shortBonus=(pid,filmId)=>{
const c=allChips.find(c=>c.player_id===pid)
if(!c?.short_film_id||c.short_film_id!==filmId)return 0
return c.short_result==='win'?100:c.short_result==='lose'?-30:0
}
const analystActive=(pid,filmId)=>{
const c=allChips.find(c=>c.player_id===pid)
return c?.analyst_film_id===filmId&&c?.analyst_result==='win'
}
const forecasterPhasePts=(pid,ph)=>{
const phFilms=films.filter(f=>f.phase===ph&&results[f.id]!=null)
if(!phFilms.length)return 0
const pfc=allForecasts.filter(f=>f.player_id===pid&&phFilms.find(pf=>pf.id===f.film_id))
if(!pfc.length)return null
return pfc.reduce((s,fc)=>s+Math.abs(fc.predicted_m-results[fc.film_id])/results[fc.film_
}
const forecasterBonusPts=(pid,ph)=>{
const scores=players.map(p=>({id:p.id,score:forecasterPhasePts(p.id,ph)})).filter(x=>x.sc
if(!scores.length)return 0
const best=scores.reduce((a,b)=>a.score<b.score?a:b)
return best.id===pid?15:0
}
const seasonForecasterBonus=(pid)=>{
const ss=players.map(p=>{
const sc=[1,2,3,4,5].map(ph=>forecasterPhasePts(p.id,ph)).filter(s=>s!=null)
if(!sc.length)return{id:p.id,score:null}
return{id:p.id,score:sc.reduce((a,b)=>a+b,0)/sc.length}
}).filter(x=>x.score!=null)
if(!ss.length)return 0
const best=ss.reduce((a,b)=>a.score<b.score?a:b)
return best.id===pid?50:0
}
const calcPhasePoints=(pid,ph)=>{
let total=0
rosters.filter(r=>r.player_id===pid&&r.phase===ph).forEach(h=>{
const film=films.find(f=>f.id===h.film_id);if(!film)return
const actual=results[film.id];if(actual==null)return
const eb=isEarlyBird(h),aw=analystActive(pid,film.id),au=auteurBonus(pid,film.id)
let op=calcOpeningPts(film,actual,eb,aw)
if(au)op=Math.round(op*1.10)
total+=op+Math.round(weeklyPts(film.id))+legsBonus(film.id)+wwBonus(film.id)+shortBonus
})
return total+forecasterBonusPts(pid,ph)
}
const calcPoints=(pid)=>{
let t=[1,2,3,4,5].reduce((s,ph)=>s+calcPhasePoints(pid,ph),0)
if(oscarPredictions.find(o=>o.player_id===pid)?.correct)t+=75
return t+seasonForecasterBonus(pid)
}
notify
// ── BUY / SELL ──
const buyFilm=async(film)=>{
if(!profile)return notify('Create a profile first',S.red)
const ph=curPhase()
if(film.phase!==ph)return notify(`Film is Phase ${film.phase} — you are in Phase ${ph}`,S
if(rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active))return if(rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active).length>=MAX_ROSTER
const price=filmVal(film),left=budgetLeft(profile.id)
if(price>left)return notify(`Not enough budget ($${price}M needed, $${left}M left)`,S.red
const{error}=await supabase.from('rosters').insert({player_id:profile.id,film_id:film.id,
if(error)return notify(error.message,S.red)
await supabase.from('transactions').insert({player_id:profile.id,film_id:film.id,type:'bu
notify(`Acquired ${film.title} for $${price}M`,S.green)
loadData()
}
const sellFilm=async(film)=>{
const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active)
if(!h)return
const win=isWindow(),val=filmVal(film),fee=win?0:leagueConfig.tx_fee,proceeds=Math.max(0,
await supabase.from('rosters').update({active:false,sold_price:proceeds,sold_week:leagueC
await supabase.from('transactions').insert([
{player_id:profile.id,film_id:film.id,type:'sell',price:proceeds,week:leagueConfig.curr
...(fee>0?[{player_id:profile.id,film_id:film.id,type:'fee',price:fee,week:leagueConfig
])
notify(`Sold ${film.title} · $${proceeds}M${win?' (free)':''}`,S.gold)
loadData()
}
// ── CHIPS ──
const activateRecut=async()=>{
if(chips?.recut_used)return notify('Recut already used',S.red)
if(!confirm('Activate THE RECUT? Your roster clears with zero fees.'))return
for(const h of rosters.filter(r=>r.player_id===profile.id&&r.active))
await supabase.from('rosters').update({active:false,sold_price:filmVal(films.find(f=>f.
if(chips)await supabase.from('chips').update({recut_used:true}).eq('player_id',profile.id
else await supabase.from('chips').insert({player_id:profile.id,recut_used:true})
notify(' THE RECUT — roster cleared, zero fees',S.purple)
setChipModal(null);loadData()
}
const activateShort=async(filmId,pred)=>{
if(chips?.short_film_id)return notify('Short already used',S.red)
if(allChips.find(c=>c.short_film_id===filmId))return notify('Film already shorted by anot
if(chips)await supabase.from('chips').update({short_film_id:filmId,short_phase:curPhase()
else await supabase.from('chips').insert({player_id:profile.id,short_film_id:filmId,short
notify(` SHORT — ${films.find(f=>f.id===filmId)?.title}`,S.red)
setChipModal(null);loadData()
}
const activateAnalyst=async(filmId,pred)=>{
if(chips?.analyst_film_id)return notify('Analyst already used',S.red)
if(allChips.find(c=>c.analyst_film_id===filmId))return notify('Film already Analysed by a
if(!rosters.find(r=>r.player_id===profile.id&&r.film_id===filmId&&r.active))return notify
if(chips)await supabase.from('chips').update({analyst_film_id:filmId,analyst_phase:curPha
else await supabase.from('chips').insert({player_id:profile.id,analyst_film_id:filmId,ana
notify(` ANALYST — ${films.find(f=>f.id===filmId)?.title}`,S.blue)
setChipModal(null);loadData()
}
const resolveChips=async(filmId,actualM)=>{
const film=films.find(f=>f.id===filmId);if(!film)return
for(const c of allChips){
if(c.short_film_id===filmId&&!c.short_result)
await supabase.from('chips').update({short_result:(actualM/film.estM)<0.60?'win':'los
if(c.analyst_film_id===filmId&&!c.analyst_result){
const within=c.analyst_prediction&&Math.abs(actualM-c.analyst_prediction)/c.analyst_p
await supabase.from('chips').update({analyst_result:within?'win':'lose'}).eq('player_
}
}
}
const submitOscarPick=async(filmId)=>{
if(myOscarPick)return notify('Oscar pick already submitted',S.red)
await supabase.from('oscar_predictions').insert({player_id:profile.id,best_picture_film_i
notify(` Best Picture locked — ${films.find(f=>f.id===filmId)?.title}`,S.gold);loadData
}
const submitAuteur=async(actor,filmIds)=>{
if(filmIds.length<2)return notify('Select at least 2 films',S.red)
const ph=curPhase(),ex=auteurDeclarations.find(a=>a.player_id===profile.id&&a.phase===ph)
if(ex)await supabase.from('auteur_declarations').update({star_actor:actor,film_ids:filmId
else await supabase.from('auteur_declarations').insert({player_id:profile.id,phase:ph,sta
notify(` Auteur — ${actor} · ${filmIds.length} films · +10%`,S.orange)
setChipModal(null);loadData()
}
const saveForecast=async(filmId,predicted)=>{
const ex=allForecasts.find(f=>f.player_id===profile.id&&f.film_id===filmId)
if(ex)await supabase.from('forecasts').update({predicted_m:predicted}).eq('id',ex.id)
else await supabase.from('forecasts').insert({player_id:profile.id,film_id:filmId,phase:c
notify(`Forecast saved — ${films.find(f=>f.id===filmId)?.title} $${predicted}M`,S.blue);l
}
if(loading)return <div style={{...S.app,display:'flex',alignItems:'center',justifyContent:'
if(!session)return <Login/>
if(!profile)return <CreateProfile session={session} onCreated={()=>{loadProfile();loadData(
const ph=curPhase(),win=isWindow(),cur=leagueConfig.currency||'$'
const myPhaseRoster=rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active)
const myBudgetLeft=budgetLeft(profile.id)
const banked=phaseBanked(profile.id,ph)
const recutUsed=chips?.recut_used||false
const shortUsed=!!chips?.short_film_id
const analystUsed=!!chips?.analyst_film_id
const phaseFilms=films.filter(f=>f.phase===ph)
const wMs=leagueConfig.phase_window_opened_at?Math.max(0,72*3600000-(now-new Date(leagueCon
const wH=Math.floor(wMs/3600000),wM=Math.floor((wMs%3600000)/60000),wS=Math.floor((wMs%6000
const desktopNav=[['market',' ','Market'],['roster',' ','Roster'],['chips',' ','Chips']
// ── MARKET PAGE ──
const MarketPage=()=>(
<div>
<div style={{marginBottom:'14px'}}>
<div style={{fontSize:'17px',fontWeight:800}}>Phase {ph} · {PHASE_NAMES[ph]}</div>
<div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>{cur}{myBudgetLeft}M l
</div>
<div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(auto-fill,minmax(155px
{phaseFilms.map(film=>{
const owned=myPhaseRoster.find(r=>r.film_id===film.id)
const val=filmVal(film),actual=results[film.id],genreCol=GENRE_COL[film.genre]||'#8
const pd=val-film.basePrice,wp=weeklyPts(film.id),op=actual!=null?calcOpeningPts(fi
const lb=legsBonus(film.id),wb=wwBonus(film.id)
const isShorted=chips?.short_film_id===film.id,isAnalyst=chips?.analyst_film_id===f
const isAuteur=auteurBonus(profile.id,film.id),isEB=owned&&isEarlyBird(owned)
return (
<div key={film.id} style={{...S.card,border:`1px solid ${owned?S.gold+'44':'#1E22
<div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:g
<div style={{fontSize:'11px',fontWeight:700,marginBottom:'2px',marginTop:'4px',
<div style={{fontSize:'9px',color:'#4A5168',marginBottom:'5px'}}>{film.dist} ·
<div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end
<div>
<div style={{fontSize:'16px',fontWeight:800,color:owned?S.gold:'#F2EEE8'}}>
<div style={{fontSize:'9px',color:pd>0?S.green:pd<0?S.red:'#4A5168'}}>{pd==
</div>
<div style={{textAlign:'right'}}>
{film.rt!=null&&<div style={{fontSize:'9px',color:film.rt>=90?S.green:film.
<div style={{fontSize:'9px',color:'#4A5168'}}>Est ${film.estM}M</div>
</div>
</div>
<div style={{display:'flex',gap:'3px',flexWrap:'wrap',marginBottom:'5px'}}>
<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:
{film.franchise&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:
{film.sleeper&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4
{isShorted&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px'
{isAnalyst&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px'
{isAuteur&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',
{isEB&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',back
</div>
{actual!=null&&(
<div style={{marginBottom:'6px',background:'#12141A',borderRadius:'6px',paddi
onClick={()=>{if(owned)setScoreModal({film,holding:owned})}}>
<div style={{fontSize:'10px',color:S.green}}>${actual}M actual</div>
<div style={{fontSize:'9px',color:S.gold}}>{op}pts{wp>0?` +${Math.round(wp)
{owned&&<div style={{fontSize:'8px',color:'#4A5168',marginTop:'2px'}}>Tap f
</div>
)}
{film.starActor&&<div style={{fontSize:'9px',color:'#4A5168',marginBottom:'5px'
{film.trailer&&film.trailer.length>5&&<button style={{...S.btn,background:'#121
{owned
?<button style={{...S.btn,background:'none',border:`1px solid ${S.red}44`,col
:<button style={{...S.btn,background:S.gold,color:'#000',width:'100%',fontSiz
}
</div>
{(()=>{const n=rosters.filter(r=>r.film_id===film.id&&r.phase===ph&&r.active).l
)
})}
</div>
</div>
)
// ── ROSTER PAGE ──
const RosterPage=()=>(
<div>
<div style={{fontSize:'17px',fontWeight:800,marginBottom:'4px'}}>My Roster · Phase {ph}
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'4px'}}>{myPhaseRoster.length
<div style={{display:'flex',gap:'6px',marginBottom:'12px',overflowX:'auto',paddingBotto
{[1,2,3,4,5].map(p=>{
const pts=calcPhasePoints(profile.id,p),nr=rosters.filter(r=>r.player_id===profile.
return(<div key={p} style={{background:p===ph?S.gold+'22':'#12141A',border:`1px sol
<div style={{fontSize:'8px',color:p===ph?S.gold:'#4A5168'}}>PH{p}</div>
<div style={{fontSize:'12px',fontWeight:700,color:p===ph?S.gold:'#F2EEE8'}}>{pts}
<div style={{fontSize:'8px',color:'#4A5168'}}>{nr.length} films</div>
</div>)
})}
</div>
{myPhaseRoster.length===0
films
?<div style={{...S.card,textAlign:'center',color:'#4A5168',padding:'32px'}}>No :myPhaseRoster.map(h=>{
const film=films.find(f=>f.id===h.film_id);if(!film)return null
const val=filmVal(film),actual=results[film.id],pnl=val-h.bought_price
const genreCol=GENRE_COL[film.genre]||'#888'
const wp=weeklyPts(film.id),eb=isEarlyBird(h),aw=analystActive(profile.id,film.id),
const op=calcOpeningPts(film,actual,eb,aw),fop=au?Math.round(op*1.10):op
const lb=legsBonus(film.id),wb=wwBonus(film.id),sb=shortBonus(profile.id,film.id)
const weeks=weeklyGrosses[film.id]||{},total=fop+Math.round(wp)+lb+wb+sb
return(
<div key={h.id} style={{...S.card,cursor:actual!=null?'pointer':'default'}} onCli
<div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
<div style={{width:'3px',height:'36px',borderRadius:'2px',background:genreCol
<div style={{flex:2,minWidth:'110px'}}>
<div style={{fontSize:'13px',fontWeight:600}}>{film.title}</div>
<div style={{fontSize:'9px',color:'#4A5168'}}>{film.dist} · W{film.week}</d
<div style={{display:'flex',gap:'4px',marginTop:'2px',flexWrap:'wrap'}}>
{eb&&<span style={{fontSize:'7px',color:S.green,padding:'1px 4px',backgro
{aw&&<span style={{fontSize:'7px',color:S.blue,padding:'1px 4px',backgrou
{au&&<span style={{fontSize:'7px',color:S.orange,padding:'1px 4px',backgr
</div>
</div>
<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'
<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'
<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'
{actual!=null&&<div style={{textAlign:'center'}}><div style={{fontSize:'7px',
{wp>0&&<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#
{(lb>0||wb>0||sb!==0)&&<div style={{textAlign:'center'}}><div style={{fontSiz
{actual!=null&&<div style={{textAlign:'center'}}><div style={{fontSize:'7px',
</div>
{Object.keys(weeks).length>0&&(
<div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid #1E222C',d
{Object.entries(weeks).sort((a,b)=>Number(a[0])-Number(b[0])).map(([wk,gros
const rate=Number(wk)>=4?1.1:1.0
return(<div key={wk} style={{background:'#12141A',borderRadius:'5px',padd
<span style={{color:'#4A5168'}}>W{wk} </span><span style={{color:S.blue
<span style={{color:'#4A5168'}}> +{Math.round(Number(gross)*rate)}{Numb
</div>)
})}
</div>
)}
</div>
{actual!=null&&<div style={{fontSize:'8px',color:'#4A5168',marginTop:'5px',text
)
})
}
</div>
)
per se
// ── CHIPS PAGE ──
const ChipsPage=()=>{
const myAuteur=auteurDeclarations.find(a=>a.player_id===profile.id&&a.phase===ph)
return(
<div>
<div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>My Chips</div>
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>One of each {/* RECUT */}
<div style={{...S.card,border:`1px solid ${recutUsed?'#2A2F3C':S.purple+'44'}`,margin
<div style={{display:'flex',alignItems:'center',gap:'12px'}}>
<div style={{fontSize:'22px'}}> </div>
<div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:recutUsed
{recutUsed?<span style={{fontSize:'10px',color:'#4A5168',padding:'3px 10px',borde
:<button style={{...S.btn,background:S.purple,color:'#fff',fontSize:'10px',padd
</div>
</div>
{/* SHORT */}
<div style={{...S.card,border:`1px solid ${shortUsed?'#2A2F3C':S.red+'44'}`,marginBot
<div style={{display:'flex',alignItems:'center',gap:'12px'}}>
<div style={{fontSize:'22px'}}> </div>
<div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:shortUsed
{shortUsed?<span style={{fontSize:'10px',color:'#4A5168',padding:'3px 10px',borde
:<button style={{...S.btn,background:S.red,color:'#fff',fontSize:'10px',padding
</div>
</div>
{/* ANALYST */}
<div style={{...S.card,border:`1px solid ${analystUsed?'#2A2F3C':S.blue+'44'}`,margin
<div style={{display:'flex',alignItems:'center',gap:'12px'}}>
<div style={{fontSize:'22px'}}> </div>
<div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:analystUs
{analystUsed?<span style={{fontSize:'10px',color:'#4A5168',padding:'3px 10px',bor
:<button style={{...S.btn,background:S.blue,color:'#fff',fontSize:'10px',paddin
</div>
</div>
{/* AUTEUR */}
<div style={{...S.card,border:`1px solid ${myAuteur?'#2A2F3C':S.orange+'44'}`,marginB
<div style={{display:'flex',alignItems:'center',gap:'12px'}}>
<div style={{fontSize:'22px'}}> </div>
<div style={{flex:1}}>
<div style={{fontSize:'13px',fontWeight:700,color:myAuteur?'#4A5168':S.orange}}
<div style={{fontSize:'10px',color:'#4A5168'}}>Declare 2+ films same star actor
{myAuteur&&<div style={{fontSize:'10px',color:S.orange,marginTop:'3px'}}> {my
</div>
<button style={{...S.btn,background:myAuteur?'#12141A':S.orange,border:myAuteur?'
</div>
</div>
{allChips.filter(c=>c.player_id!==profile.id&&(c.short_film_id||c.analyst_film_id)).l
<div style={{marginTop:'14px'}}>
<div style={{fontSize:'10px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8p
{allChips.filter(c=>c.player_id!==profile.id).map(c=>{
const p=players.find(pl=>pl.id===c.player_id)
return(<div key={c.id} style={{display:'flex',gap:'8px',flexWrap:'wrap',marginB
{c.short_film_id&&<div style={{background:'#12141A',borderRadius:'6px',paddin
{c.analyst_film_id&&<div style={{background:'#12141A',borderRadius:'6px',padd
</div>)
})}
</div>
)}
</div>
)
}
// ── LEAGUE PAGE ──
const LeaguePage=()=>(
<div>
<div style={{fontSize:'17px',fontWeight:800,marginBottom:'4px'}}>League Standings</div>
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'14px'}}>Grand League · Phase
<div style={{...S.card,marginBottom:'16px',overflowX:'auto'}}>
<div style={{fontSize:'10px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px'}
<div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px',minWidth:'2
{[1,2,3,4,5].map(p=>{
const sc=[...players].map(pl=>({pl,pts:calcPhasePoints(pl.id,p)})).sort((a,b)=>b.
const leader=sc[0]
return(<div key={p} style={{background:p===ph?S.gold+'15':'#12141A',border:`1px s
<div style={{fontSize:'8px',color:p===ph?S.gold:'#4A5168',letterSpacing:'1px',m
{leader?.pts>0?(<><div style={{fontSize:'9px',fontWeight:600,color:players.find
</div>)
})}
</div>
</div>
{players.length===0&&<div style={{...S.card,textAlign:'center',color:'#4A5168'}}>No pla
{[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id)).map((player,i)=>{
const pts=calcPoints(player.id),rank=i===0?' ':i===1?' ':i===2?' ':`#${i+1}`
const pc=allChips.find(c=>c.player_id===player.id),pa=auteurDeclarations.find(a=>a.pl
const po=oscarPredictions.find(o=>o.player_id===player.id),phPts=calcPhasePoints(play
return(<div key={player.id} style={{...S.card,display:'flex',alignItems:'center',gap:
<div style={{fontSize:'20px',minWidth:'28px'}}>{rank}</div>
<div style={{width:'8px',height:'8px',borderRadius:'50%',background:player.color||S
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:'13px',fontWeight:600,color:player.color||S.gold,overflow:'
<div style={{display:'flex',gap:'4px',marginTop:'3px',flexWrap:'wrap'}}>
<span style={{fontSize:'9px',color:'#4A5168'}}>Ph{ph}: {phPts}pts · {cur}{budge
{pc?.short_film_id&&<span style={{fontSize:'8px',color:S.red,padding:'1px 4px',
{pc?.analyst_film_id&&<span style={{fontSize:'8px',color:S.blue,padding:'1px 4p
{pc?.recut_used&&<span style={{fontSize:'8px',color:S.purple,padding:'1px 4px',
{pa&&<span style={{fontSize:'8px',color:S.orange,padding:'1px 4px',background:S
{po&&<span style={{fontSize:'8px',color:S.gold,padding:'1px 4px',background:S.g
</div>
</div>
<div style={{textAlign:'right',flexShrink:0}}>
<div style={{fontSize:'24px',fontWeight:800,color:i===0?S.gold:'#F2EEE8'}}>{pts}<
<div style={{fontSize:'8px',color:'#4A5168'}}>GRAND PTS</div>
</div>
</div>)
})}
</div>
)
// ── FORECASTER PAGE ──
const ForecasterPage=()=>(
<div>
<div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>Forecaster</div>
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Best phase accuracy
{films.filter(f=>!results[f.id]).map(film=>{
const mf=forecasts[film.id]
return(<div key={film.id} style={{...S.card,display:'flex',alignItems:'center',gap:'1
<div style={{flex:2,minWidth:'120px'}}><div style={{fontSize:'12px',fontWeight:500}
<input type="number" step="0.1" defaultValue={mf||''} placeholder="$M" id={`fc-${fi
<button style={{...S.btn,background:S.blue,color:'#fff',fontSize:'10px'}} onClick={
{mf&&<div style={{fontSize:'11px',color:S.blue}}>${mf}M</div>}
</div>)
})}
{films.filter(f=>results[f.id]).length>0&&(
<div style={{marginTop:'20px'}}>
<div style={{fontSize:'13px',fontWeight:700,marginBottom:'10px'}}>Forecast Results<
{films.filter(f=>results[f.id]).map(film=>{
const actual=results[film.id],pfc=allForecasts.filter(f=>f.film_id===film.id)
return(<div key={film.id} style={{...S.card,marginBottom:'8px'}}>
<div style={{fontSize:'11px',fontWeight:600,marginBottom:'8px'}}>{film.title} <
<div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
{pfc.map(fc=>{const p=players.find(pl=>pl.id===fc.player_id),pct=Math.round((
{!pfc.length&&<div style={{fontSize:'10px',color:'#4A5168'}}>No predictions</
</div>
</div>)
})}
</div>
)}
</div>
)
// ── OSCAR PAGE ──
const OscarPage=()=>(
<div>
<div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}> Oscar Mini Game</di
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Predict Best Picture
{myOscarPick?(
<div style={{...S.card,border:`1px solid ${S.gold}44`}}>
<div style={{fontSize:'12px',color:'#4A5168',marginBottom:'6px'}}>YOUR PICK</div>
<div style={{fontSize:'18px',fontWeight:700,color:S.gold}}>{films.find(f=>f.id===my
<div style={{fontSize:'10px',color:'#4A5168',marginTop:'4px'}}>{myOscarPick.correct
</div>
):(
<div style={{...S.card}}>
<div style={{fontSize:'12px',color:'#4A5168',marginBottom:'12px'}}>PICK YOUR BEST P
<select id="oscar-pick" style={{...S.inp,marginBottom:'12px'}}><option value="">Sel
<button style={{...S.btn,background:S.gold,color:'#000',fontWeight:700,width:'100%'
</div>
)}
{oscarPredictions.length>0&&(
<div style={{marginTop:'16px'}}>
<div style={{fontSize:'12px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px
{oscarPredictions.map(op=>{const p=players.find(pl=>pl.id===op.player_id),f=films.f
</div>
)}
</div>
)
// ── RESULTS PAGE ──
const ResultsPage=()=>(
<div>
<div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>Enter Results</div>
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Opening weekend + we
{films.map(film=>{
const actual=results[film.id],weeks=weeklyGrosses[film.id]||{},lb=legsBonus(film.id),
return(<div key={film.id} style={{...S.card}}>
<div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBot
<div style={{flex:2,minWidth:'120px'}}>
<div style={{fontSize:'12px',fontWeight:500}}>{film.title} {isWinner&&' <div style={{fontSize:'9px',color:'#4A5168'}}>Est ${film.estM}M · IPO ${film.ba
</div>
<input type="number" step="0.1" defaultValue={actual||''} placeholder="Opening $M
<button style={{...S.btn,background:S.green,color:'#000',fontSize:'10px',padding:
const v=parseFloat(document.getElementById(`res-${film.id}`).value)
if(isNaN(v))return notify('Enter a number',S.red)
const nv=calcMarketValue(film,v)
const{error:e1}=await dbUpsertResult(film.id,v);if(e1)return notify(e1.message,
'}</di
const{error:e2}=await dbUpsertFilmValue(film.id,nv);if(e2)return notify(e2.mess
await resolveChips(film.id,v)
notify(` }}>Save</button>
${film.title} · $${nv} · ${calcOpeningPts(film,v)}pts`,S.gold);loadD
<button style={{...S.btn,background:isWinner?S.gold:'#12141A',border:isWinner?'no
onClick={async()=>{
if(isWinner){await supabase.from('weekend_winners').delete().eq('week',film.w
else{const ex=await supabase.from('weekend_winners').select('id').eq('week',f
notify(isWinner?'Winner removed':` ${film.title} · +15pts all owners`,S.gol
}}>{isWinner?' #1':'#1?'}</button>
{actual!=null&&<div style={{fontSize:'10px',color:S.green}}>${actual}M → $${filmV
</div>
{actual!=null&&(
<div style={{borderTop:'1px solid #1E222C',paddingTop:'8px'}}>
<div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px',fl
<div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px'}}>WEEKLY · 1p
{lb>0&&<span style={{fontSize:'9px',color:S.green,padding:'1px 6px',backgroun
</div>
<div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
{[2,3,4,5,6,7,8].map(wk=>{
const rate=wk>=4?1.1:1.0
return(<div key={wk} style={{display:'flex',flexDirection:'column',gap:'3px
<div style={{fontSize:'8px',color:'#4A5168'}}>W{wk}{wk>=4?' ×1.1':''}</di
<input type="number" step="0.1" placeholder="$M" defaultValue={weeks[wk]|
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',
onClick={async()=>{const v=parseFloat(document.getElementById(`wk-${fil
{weeks[wk]&&<div style={{fontSize:'8px',color:S.blue}}>+{Math.round(Numbe
</div>)
})}
</div>
</div>
)}
</div>)
})}
</div>
)
// ── COMMISSIONER PAGE ──
const CommissionerPage=()=>(
<div>
<div style={{fontSize:'17px',fontWeight:800,marginBottom:'16px'}}> Commissioner Panel
<div style={{...S.card,marginBottom:'12px'}}>
<div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSp
<div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
<div style={{fontSize:'11px'}}>W{leagueConfig.current_week} · Ph{ph} · {PHASE_NAMES
<button style={{...S.btn,background:S.gold,color:'#000',fontSize:'10px'}} onClick={
<button style={{...S.btn,background:win?S.orange:S.purple,color:'#fff',fontSize:'10
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:S.go
</div>
<div style={{marginTop:'10px',display:'flex',gap:'6px',flexWrap:'wrap'}}>
{players.map(p=>(
<div key={p.id} style={{background:'#12141A',borderRadius:'6px',padding:'5px 10px
<span style={{color:p.color||S.gold}}>{p.name}</span>
<span style={{color:'#4A5168'}}> · {cur}{budgetLeft(p.id)}M left</span>
{phaseBanked(p.id,ph)>0&&<span style={{color:S.orange}}> +{cur}{phaseBanked(p.i
</div>
))}
</div>
</div>
<div style={{...S.card,marginBottom:'12px'}}>
<div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSp
<div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
<select id="oscar-winner-select" style={{...S.inp,flex:1,minWidth:'180px'}}><option
<button style={{...S.btn,background:S.gold,color:'#000',fontSize:'10px'}} onClick={
</div>
</div>
<div style={{...S.card,marginBottom:'12px'}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin
<div style={{fontSize:'11px',fontWeight:600,color:S.gold,letterSpacing:'1px'}}>FILM
<button style={{...S.btn,background:S.green,color:'#000',fontSize:'10px'}} onClick=
</div>
{[1,2,3,4,5].map(p=>{
const pf=films.filter(f=>f.phase===p);if(!pf.length)return null
return(<div key={p} style={{marginBottom:'12px'}}>
<div style={{fontSize:'10px',color:p===ph?S.gold:'#4A5168',letterSpacing:'1px',ma
{pf.map(film=>(<div key={film.id} style={{display:'flex',alignItems:'center',gap:
<div style={{flex:2,minWidth:'100px'}}><div style={{fontSize:'11px'}}>{film.tit
<div style={{display:'flex',gap:'4px',alignItems:'center',flexWrap:'wrap'}}>
<div><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>IPO</di
<div><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>EST</di
<div><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>RT%</di
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',colo
<button style={{...S.btn,background:'none',border:`1px solid ${S.red}33`,colo
</div>
</div>))}
</div>)
})}
</div>
<div style={{...S.card}}>
<div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSp
{!allChips.length&&<div style={{fontSize:'11px',color:'#4A5168'}}>No chips activated
{allChips.map(c=>{const p=players.find(pl=>pl.id===c.player_id);return(<div key={c.id
<div style={{fontSize:'11px',fontWeight:600,color:p?.color||S.gold,marginBottom:'4p
{c.short_film_id&&(<div style={{display:'flex',gap:'8px',alignItems:'center',margin
<span style={{fontSize:'10px',color:S.red}}> {films.find(f=>f.id===c.short_film
<span style={{fontSize:'10px',color:'#4A5168'}}>→ {c.short_result||'pending'}</sp
{!c.short_result&&<><button style={{...S.btn,background:S.green,color:'#000',font
</div>)}
{c.analyst_film_id&&(<div style={{display:'flex',gap:'8px',alignItems:'center',flex
<span style={{fontSize:'10px',color:S.blue}}> {films.find(f=>f.id===c.analyst_f
<span style={{fontSize:'10px',color:'#4A5168'}}>→ {c.analyst_result||'pending'}</
{!c.analyst_result&&<><button style={{...S.btn,background:S.green,color:'#000',fo
</div>)}
</div>)})}
</div>
</div>
)
return (
<div style={S.app}>
{/* TOPBAR */}
<div style={S.topbar}>
<div style={{fontFamily:'sans-serif',fontSize:'20px',fontWeight:900,color:S.gold,lett
{win&&wMs>0&&<div style={{background:S.orange+'22',border:`1px solid ${S.orange}44`,b
<div style={{background:'#12141A',border:'1px solid #2A2F3C',borderRadius:'7px',paddi
<div style={{fontSize:'7px',color:'#4A5168'}}>Ph{ph} BUDGET</div>
<div style={{fontSize:'13px',fontWeight:700,color:myBudgetLeft<20?S.red:S.green}}>{
</div>
{banked>0&&!isMobile&&<div style={{fontSize:'9px',color:S.orange}}>+{cur}{banked}M ba
<div style={{fontSize:'9px',color:'#4A5168'}}>W{leagueConfig.current_week}</div>
<div style={{marginLeft:'auto',display:'flex',gap:'6px',alignItems:'center'}}>
<div style={{fontSize:'10px',color:'#4A5168'}}>{profile.name}</div>
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A
</div>
</div>
<div style={{display:'flex',minHeight:'calc(100vh - 52px)'}}>
{/* DESKTOP SIDEBAR */}
{!isMobile&&(
<div style={{width:'180px',background:'#0C0E12',borderRight:'1px solid #1E222C',pad
{desktopNav.map(([id,ic,lb])=>(
<div key={id} onClick={()=>setPage(id)} style={{display:'flex',alignItems:'cent
<span>{ic}</span>{lb}
</div>
))}
</div>
)}
<div style={{...S.main,paddingBottom:isMobile?'80px':'24px'}}>
{page==='market'&&<MarketPage/>}
{page==='roster'&&<RosterPage/>}
{page==='chips'&&<ChipsPage/>}
{page==='forecaster'&&<ForecasterPage/>}
{page==='oscar'&&<OscarPage/>}
{page==='league'&&<LeaguePage/>}
{page==='results'&&<ResultsPage/>}
{page==='commissioner'&&isCommissioner&&<CommissionerPage/>}
</div>
</div>
{/* MOBILE BOTTOM NAV */}
{isMobile&&<BottomNav page={page} setPage={setPage} isCommissioner={isCommissioner} onM
{isMobile&&showMore&&<MoreDrawer page={page} setPage={setPage} isCommissioner={isCommis
{/* NOTIFICATIONS */}
{notif&&<div style={{position:'fixed',bottom:isMobile?'72px':'20px',right:'16px',backgr
{/* SCORE BREAKDOWN MODAL */}
{scoreModal&&<ScoreBreakdownModal film={scoreModal.film} holding={scoreModal.holding} r
{/* TRAILER MODAL */}
{trailerFilm&&(
<div style={{position:'fixed',inset:0,background:'#000000EE',display:'flex',alignItem
<div style={{width:'100%',maxWidth:'800px'}} onClick={e=>e.stopPropagation()}>
<div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
<div style={{fontSize:'14px',fontWeight:700}}>{trailerFilm.title}</div>
<button style={{background:'none',border:'1px solid #2A2F3C',color:'#4A5168',bo
</div>
<div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden
<iframe src={`${trailerFilm.trailer}?autoplay=1`} style={{position:'absolute',t
</div>
</div>
</div>
)}
{/* ADD FILM MODAL */}
{addFilmModal&&(
<div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItem
<div style={{background:'#0C0E12',border:'1px solid #2A2F3C',borderRadius:'14px',pa
<div style={{fontSize:'15px',fontWeight:800,marginBottom:'14px',color:S.green}}>+
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom
{[['Title','title','text',''],['Distributor','dist','text',''],['Franchise','fr
<div key={field} style={{gridColumn:field==='title'||field==='dist'?'1/-1':'a
<div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBotto
<input type={type} placeholder={ph} value={newFilm[field]||''} style={{...S
</div>
))}
<div><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBott
<div style={{display:'flex',alignItems:'center',gap:'8px',paddingTop:'16px'}}><
<div style={{gridColumn:'1/-1'}}><div style={{fontSize:'8px',color:'#4A5168',le
</div>
<div style={{display:'flex',gap:'8px'}}>
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:
<button style={{...S.btn,background:S.green,color:'#000',flex:1,fontWeight:700}
if(!newFilm.title||!newFilm.dist)return notify('Title and distributor require
const id='f'+Date.now().toString(36)
const film={...newFilm,id,basePrice:Number(newFilm.basePrice)||20,estM:Number
setFilms(prev=>[...prev,film])
setNewFilm({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30
setAddFilmModal(false);notify(` ${film.title} added`,S.green)
}}>Add Film</button>
</div>
</div>
</div>
)}
{/* CHIP MODALS */}
{chipModal&&(
<div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItem
<div style={{background:'#0C0E12',border:'1px solid #2A2F3C',borderRadius:'16px 16p
<div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',ma
{chipModal==='short'&&(
<div>
<div style={{fontSize:'16px',fontWeight:800,color:S.red,marginBottom:'6px'}}>
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px',lineHeight:1
<div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168
<select id="short-film" style={{...S.inp}}>{films.filter(f=>!results[f.id]&
<div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168
<div style={{display:'flex',gap:'8px'}}>
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',co
<button style={{...S.btn,background:S.red,color:'#fff',flex:1,padding:'12px
</div>
</div>
)}
{chipModal==='analyst'&&(
<div>
<div style={{fontSize:'16px',fontWeight:800,color:S.blue,marginBottom:'6px'}}
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px',lineHeight:1
<div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168
<select id="analyst-film" style={{...S.inp}}>{myPhaseRoster.filter(r=>!resu
<div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168
<div style={{display:'flex',gap:'8px'}}>
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',co
<button style={{...S.btn,background:S.blue,color:'#fff',flex:1,padding:'12p
</div>
</div>
)}
{chipModal==='auteur'&&(
<div>
<div style={{fontSize:'16px',fontWeight:800,color:S.orange,marginBottom:'6px'
<div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px',lineHeight:1
<div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168
<div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168
<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
{myPhaseRoster.map(r=>{const f=films.find(fl=>fl.id===r.film_id);if(!f)re
</div>
</div>
<div style={{display:'flex',gap:'8px'}}>
<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',co
<button style={{...S.btn,background:S.orange,color:'#000',flex:1,fontWeight
</div>
</div>
)}
</div>
</div>
)}
</div>
)
}
function Login() {
const [email,setEmail]=useState('')
const [sent,setSent]=useState(false)
const [loading,setLoading]=useState(false)
const handleLogin=async(e)=>{
e.preventDefault();setLoading(true)
const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'https://b
if(error)alert(error.message);else setSent(true)
setLoading(false)
}
if(sent)return(
<div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',ju
<div style={{textAlign:'center'}}>
<div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'16px'}}>BOX
<div style={{color:'#F2EEE8',marginBottom:'8px'}}>Check your email</div>
<div style={{color:'#4A5168',fontSize:'12px'}}>Magic link sent to {email}</div>
</div>
</div>
)
return(
<div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',ju
<div style={{width:'100%',maxWidth:'320px'}}>
<div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'8px'}}>BOXD
<div style={{color:'#4A5168',fontSize:'11px',letterSpacing:'3px',marginBottom:'32px'}
<form onSubmit={handleLogin}>
<input type="email" placeholder="Enter your email" value={email} onChange={e=>setEm
style={{width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'white
<button type="submit" disabled={loading}
style={{width:'100%',background:'#F0B429',color:'#000',border:'none',borderRadius
{loading?'SENDING...':'SEND MAGIC LINK'}
</button>
</form>
</div>
</div>
)
}
function CreateProfile({session,onCreated,notify}) {
const [name,setName]=useState('')
const [loading,setLoading]=useState(false)
const COLORS=['#F0B429','#2DD67A','#FF5C8A','#4D9EFF','#FF8C3D','#A855F7']
const [color,setColor]=useState(COLORS[0])
const handleCreate=async(e)=>{
e.preventDefault();if(!name.trim())return;setLoading(true)
const{error}=await supabase.from('profiles').insert({id:session.user.id,name:name.trim(),
if(error){notify(error.message,'#FF4757');setLoading(false);return}
onCreated()
}
return(
<div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',ju
<div style={{width:'100%',maxWidth:'320px'}}>
<div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'8px'}}>BOXD
<div style={{color:'#F2EEE8',marginBottom:'6px',fontSize:'14px'}}>Create your player
<div style={{color:'#4A5168',fontSize:'11px',marginBottom:'24px'}}>{session.user.emai
<form onSubmit={handleCreate}>
<input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} r
style={{width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'white
<div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px'
<div style={{display:'flex',gap:'10px',marginBottom:'24px'}}>
{COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:'32px',height
</div>
<button type="submit" disabled={loading}
style={{width:'100%',background:'#F0B429',color:'#000',border:'none',borderRadius
{loading?'CREATING...':'JOIN LEAGUE'}
</button>
</form>
</div>
</div>
)
}