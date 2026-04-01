import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZjA0OTBiOGU0OWQxNjFmYmIzMjBmYjg5NGJhOTQ1MyIsIm5iZiI6MTc3NTA4Mjg0Mi4xNzcsInN1YiI6IjY5Y2Q5ZDVhZGE4ZjEwZmZmNTJmNmE3MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.fxBTZG1YMdHkUUgz55l2TUWGa7YKsDUz8JbuFgr84q0'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w300'

const S = {
  app: { minHeight:'100vh', background:'#07080B', color:'#F2EEE8', fontFamily:'DM Mono, monospace' },
  topbar: { background:'#0C0E12', borderBottom:'1px solid #1E222C', padding:'0 16px', height:'52px', display:'flex', alignItems:'center', gap:'10px', position:'sticky', top:0, zIndex:100 },
  main: { flex:1, padding:'16px', overflowY:'auto', minWidth:0 },
  card: { background:'#0C0E12', border:'1px solid #1E222C', borderRadius:'11px', padding:'14px', marginBottom:'10px' },
  btn: { border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'11px', letterSpacing:'1px', fontFamily:'DM Mono, monospace', cursor:'pointer', textTransform:'uppercase' },
  inp: { background:'#12141A', border:'1px solid #2A2F3C', color:'#F2EEE8', borderRadius:'7px', padding:'9px 12px', fontSize:'12px', fontFamily:'DM Mono, monospace', width:'100%', outline:'none' },
  gold:'#F0B429', green:'#2DD67A', red:'#FF4757', blue:'#4D9EFF', purple:'#A855F7', orange:'#FF8C3D',
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
const PHASE_NAMES = { 1:'Dead Zone', 2:'Summer Slate', 3:'Horror Window', 4:'Awards Season', 5:'Oscar Sprint' }
const EMOJI_OPTIONS = ['🔥','💀','😂','🎯','📈','📉','👑','💸','🍿','😬']

const FILMS_DEFAULT = [
  {id:'f001',title:'We Bury the Dead',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,phase:1,week:1,basePrice:8,estM:14,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f002',title:'Greenland 2: Migration',dist:'Lionsgate',genre:'Action',franchise:'Greenland',starActor:'Gerard Butler',phase:1,week:1,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f003',title:'Primate',dist:'Universal',genre:'Thriller',franchise:null,starActor:null,phase:1,week:1,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f004',title:'28 Years Later: The Bone Temple',dist:'Sony',genre:'Horror',franchise:'28 Days',starActor:"Jack O'Connell",phase:1,week:2,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f005',title:"Dead Man's Wire",dist:'WB',genre:'Thriller',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f006',title:'Killer Whale',dist:'Paramount',genre:'Thriller',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f007',title:'Night Patrol',dist:'Sony',genre:'Action',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f008',title:'Return to Silent Hill',dist:'Sony',genre:'Horror',franchise:'Silent Hill',starActor:null,phase:1,week:3,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f009',title:'Mercy',dist:'Netflix',genre:'Thriller',franchise:null,starActor:null,phase:1,week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f010',title:'Send Help',dist:'Universal',genre:'Horror',franchise:null,starActor:'Rachel McAdams',phase:1,week:3,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f011',title:'Iron Lung',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:1,week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f012',title:'The Strangers: Chapter 3',dist:'Lionsgate',genre:'Horror',franchise:'The Strangers',starActor:null,phase:1,week:5,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f013',title:'Dracula: A Love Tale',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,week:5,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f014',title:'Whistle',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:1,week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f015',title:"Good Luck Have Fun Don't Die",dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:null,phase:1,week:5,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f016',title:'Cold Storage',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:1,week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f017',title:'GOAT',dist:'Sony Animation',genre:'Animation',franchise:null,starActor:null,phase:1,week:5,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f018',title:'Wuthering Heights',dist:'WB',genre:'Drama',franchise:null,starActor:'Margot Robbie',phase:1,week:6,basePrice:32,estM:58,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f019',title:'Crime 101',dist:'A24',genre:'Thriller',franchise:null,starActor:'Glen Powell',phase:1,week:6,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f020',title:'Psycho Killer',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,week:7,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f021',title:'I Can Only Imagine 2',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:7,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f022',title:'Dreams',dist:'Universal',genre:'Drama',franchise:null,starActor:'Glen Powell',phase:1,week:7,basePrice:18,estM:34,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f023',title:'Scream 7',dist:'Paramount',genre:'Horror',franchise:'Scream',starActor:'Neve Campbell',phase:1,week:8,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f024',title:"Dr Seuss' The Cat in the Hat",dist:'WB',genre:'Animation',franchise:null,starActor:'Bill Hader',phase:1,week:8,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f025',title:'Hoppers',dist:'Disney/Pixar',genre:'Animation',franchise:null,starActor:null,phase:1,week:9,basePrice:26,estM:50,rt:97,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f026',title:'The Bride!',dist:'Universal',genre:'Horror',franchise:null,starActor:'Christian Bale',phase:1,week:9,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f027',title:'Peaky Blinders: The Immortal Man',dist:'Netflix',genre:'Drama',franchise:'Peaky Blinders',starActor:'Cillian Murphy',phase:1,week:9,basePrice:14,estM:26,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f028',title:'The Breadwinner',dist:'GKIDS',genre:'Animation',franchise:null,starActor:null,phase:1,week:10,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f029',title:'Reminders of Him',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:1,week:10,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f030',title:'Project Hail Mary',dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:'Ryan Gosling',phase:1,week:11,basePrice:55,estM:80,rt:95,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f031',title:'They Will Kill You',dist:'Amazon MGM',genre:'Horror',franchise:null,starActor:'Zazie Beetz',phase:1,week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f032',title:'Romeo + Juliet (30th Anniversary)',dist:'Paramount',genre:'Drama',franchise:null,starActor:null,phase:1,week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f033',title:'Splittsville',dist:'Lionsgate',genre:'Comedy',franchise:null,starActor:null,phase:1,week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f034',title:'The Magic Faraway Tree',dist:'StudioCanal',genre:'Family',franchise:null,starActor:null,phase:1,week:11,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f035',title:'Bluey At The Cinema',dist:'Lionsgate',genre:'Family',franchise:'Bluey',starActor:null,phase:1,week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f036',title:'Ready or Not 2: Here I Come',dist:'Searchlight',genre:'Horror',franchise:null,starActor:'Samara Weaving',phase:1,week:11,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f037',title:'Forbidden Fruits',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:'Lola Tung',phase:1,week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f038',title:'The Super Mario Galaxy Movie',dist:'Universal/Illumination',genre:'Animation',franchise:'Mario',starActor:'Jack Black',phase:1,week:13,basePrice:52,estM:100,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f039',title:'The Drama',dist:'A24',genre:'Drama',franchise:null,starActor:null,phase:1,week:13,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f040',title:'Fuze',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:1,week:13,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f041',title:'Amelie (25th Anniversary)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:13,basePrice:6,estM:10,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f042',title:'You Me & Tuscany',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:1,week:14,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f043',title:'Undertone',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:1,week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f044',title:"California Schemin'",dist:'A24',genre:'Drama',franchise:null,starActor:null,phase:1,week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f045',title:'Father Mother Sister Brother',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f046',title:"Lee Cronin's The Mummy",dist:'Universal',genre:'Horror',franchise:'Mummy',starActor:'Jack Reynor',phase:1,week:15,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f047',title:'Glenorchy',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:1,week:15,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f048',title:'Michael',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jaafar Jackson',phase:1,week:16,basePrice:26,estM:48,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f049',title:'Exit 8',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:1,week:16,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f050',title:'Mother Mary',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:16,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f051',title:'Hiroyuki',dist:'Sony',genre:'Family',franchise:null,starActor:null,phase:1,week:16,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f052',title:'The Devil Wears Prada 2',dist:'Disney/20th',genre:'Comedy',franchise:'Prada',starActor:'Meryl Streep',phase:2,week:17,basePrice:50,estM:80,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f053',title:'Hokum',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:2,week:17,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f054',title:'Iron Maiden: Burning Ambition',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Iron Maiden',phase:2,week:17,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f055',title:'Mortal Kombat II',dist:'WB/New Line',genre:'Action',franchise:'Mortal Kombat',starActor:'Lewis Tan',phase:2,week:18,basePrice:28,estM:52,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f056',title:'The Sheep Detectives',dist:'Lionsgate',genre:'Family',franchise:null,starActor:null,phase:2,week:18,basePrice:10,estM:18,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f057',title:'Billie Eilish: Hit Me Hard And Soft Tour',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Billie Eilish',phase:2,week:18,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f058',title:'Top Gun (40th Anniversary)',dist:'Paramount',genre:'Action',franchise:'Top Gun',starActor:'Tom Cruise',phase:2,week:19,basePrice:14,estM:26,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f059',title:'Obsession',dist:'Focus',genre:'Thriller',franchise:null,starActor:null,phase:2,week:19,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f060',title:'Normal',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:2,week:19,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f061',title:'The Christophers',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,week:19,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f062',title:'500 Miles (Ireland)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,week:19,basePrice:6,estM:10,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f063',title:'Charlie The Wonderdog',dist:'Universal',genre:'Family',franchise:null,starActor:null,phase:2,week:20,basePrice:8,estM:14,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f064',title:'The Mandalorian & Grogu',dist:'Disney/Lucasfilm',genre:'Action',franchise:'Star Wars',starActor:'Pedro Pascal',phase:2,week:20,basePrice:70,estM:135,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f065',title:'Finding Emily',dist:'Paramount',genre:'Comedy',franchise:null,starActor:null,phase:2,week:20,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f066',title:'Passenger',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,week:20,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f067',title:'Tom & Jerry: Forbidden Compass HFSS',dist:'WB',genre:'Animation',franchise:'Tom & Jerry',starActor:null,phase:2,week:20,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f068',title:'Power Ballad',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:2,week:21,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f069',title:'Tuner',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,week:21,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f070',title:'Savage House',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:null,phase:2,week:22,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f071',title:'Masters of the Universe',dist:'Amazon MGM',genre:'Action',franchise:'MOTU',starActor:'Nicholas Galitzine',phase:2,week:22,basePrice:35,estM:65,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f072',title:'Scary Movie 6',dist:'Paramount',genre:'Comedy',franchise:'Scary Movie',starActor:null,phase:2,week:22,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f073',title:'Animal Friends',dist:'Universal',genre:'Animation',franchise:null,starActor:null,phase:2,week:22,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f074',title:'Disclosure Day',dist:'Sony',genre:'Sci-Fi',franchise:null,starActor:null,phase:2,week:23,basePrice:20,estM:38,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f075',title:'Toy Story 5',dist:'Disney/Pixar',genre:'Animation',franchise:'Toy Story',starActor:'Tom Hanks',phase:2,week:24,basePrice:75,estM:145,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f076',title:'Supergirl',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Milly Alcock',phase:2,week:25,basePrice:52,estM:98,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f077',title:'Untitled Jackass Event Film',dist:'Paramount',genre:'Comedy',franchise:'Jackass',starActor:null,phase:2,week:25,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f078',title:'500 Miles (England/Scotland/Wales)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,week:25,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f079',title:'Minions & Monsters',dist:'Universal/Illumination',genre:'Animation',franchise:'Despicable Me',starActor:'Steve Carell',phase:2,week:26,basePrice:58,estM:110,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f080',title:'The Movie',dist:'TBC',genre:'Action',franchise:null,starActor:null,phase:2,week:27,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f081',title:'Moana (Live Action)',dist:'Disney',genre:'Family',franchise:'Moana',starActor:'Dwayne Johnson',phase:2,week:27,basePrice:62,estM:118,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f082',title:'Alpha',dist:'Sony',genre:'Action',franchise:null,starActor:'Michael B Jordan',phase:2,week:27,basePrice:18,estM:32,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f083',title:'The Odyssey',dist:'Universal/Nolan',genre:'Drama',franchise:null,starActor:'Matt Damon',phase:2,week:27,basePrice:60,estM:115,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f084',title:'Cut Off',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:2,week:27,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f085',title:'Evil Dead Burn',dist:'Sony',genre:'Horror',franchise:'Evil Dead',starActor:null,phase:2,week:27,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f086',title:'Spider-Man: Brand New Day',dist:'Sony/Marvel',genre:'Action',franchise:'Spider-Man',starActor:'Tom Holland',phase:2,week:27,basePrice:85,estM:165,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f087',title:'Super Troopers 3',dist:'Fox',genre:'Comedy',franchise:'Super Troopers',starActor:null,phase:2,week:31,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f088',title:'Fall 2',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:2,week:31,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f089',title:'Paw Patrol: The Dino Movie HFSS',dist:'Paramount',genre:'Family',franchise:'Paw Patrol',starActor:null,phase:2,week:32,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f090',title:'Flowervale Street',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:2,week:32,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f091',title:'The End of Oak Street',dist:'Universal',genre:'Adventure',franchise:null,starActor:null,phase:2,week:33,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f092',title:'Insidious: The Bleeding World',dist:'Sony/Blumhouse',genre:'Horror',franchise:'Insidious',starActor:'Lin Shaye',phase:2,week:33,basePrice:14,estM:28,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f093',title:'Mutiny',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,week:33,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f094',title:'Spa Weekend',dist:'Sony',genre:'Comedy',franchise:null,starActor:null,phase:2,week:33,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f095',title:'Teenage Sex and Death at Camp Miasma',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:2,week:33,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f096',title:'The Dog Stars',dist:'20th Century',genre:'Sci-Fi',franchise:null,starActor:'Jacob Elordi',phase:2,week:33,basePrice:18,estM:34,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f097',title:'Cliffhanger',dist:'Sony',genre:'Action',franchise:null,starActor:null,phase:2,week:33,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f098',title:'One Night Only',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:2,week:33,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f099',title:'How to Rob a Bank',dist:'Netflix',genre:'Comedy',franchise:null,starActor:null,phase:3,week:35,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f100',title:'Pressure',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:3,week:36,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f101',title:'A Practical Magic Film',dist:'WB',genre:'Horror',franchise:'Practical Magic',starActor:'Sandra Bullock',phase:3,week:36,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f102',title:'Clayface',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Tom Rhys Harries',phase:3,week:36,basePrice:30,estM:55,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f103',title:'Resident Evil',dist:'Sony',genre:'Horror',franchise:'Resident Evil',starActor:null,phase:3,week:37,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f104',title:'Bad Apples',dist:'Paramount',genre:'Horror',franchise:null,starActor:null,phase:3,week:37,basePrice:8,estM:16,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f105',title:'Sense and Sensibility',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:3,week:38,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f106',title:'Avengers: Endgame (Re-release)',dist:'Disney',genre:'Action',franchise:'MCU',starActor:'Robert Downey Jr',phase:3,week:38,basePrice:15,estM:28,rt:96,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f107',title:'Verity',dist:'Amazon MGM',genre:'Thriller',franchise:null,starActor:'Blake Lively',phase:3,week:39,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f108',title:'Digger',dist:'Paramount',genre:'Comedy',franchise:null,starActor:'Tom Cruise',phase:3,week:39,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f109',title:'The Social Reckoning',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jeremy Strong',phase:3,week:40,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f110',title:'Other Mommy',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:null,phase:3,week:40,basePrice:8,estM:16,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f111',title:'The Legend of Aang',dist:'Paramount',genre:'Animation',franchise:'Avatar: TLA',starActor:'Eric Nam',phase:3,week:40,basePrice:35,estM:65,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f112',title:'Street Fighter',dist:'Paramount',genre:'Action',franchise:'Street Fighter',starActor:'Andrew Koji',phase:3,week:41,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f113',title:'Whalefall',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:3,week:41,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f114',title:'Wildwood',dist:'Focus',genre:'Adventure',franchise:null,starActor:null,phase:3,week:41,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f115',title:'Forgotten Island',dist:'Universal',genre:'Family',franchise:null,starActor:null,phase:3,week:42,basePrice:16,estM:28,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f116',title:'Wife & Dog',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f117',title:'Clayface (Wide)',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Naomi Ackie',phase:3,week:42,basePrice:28,estM:52,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f118',title:'Ghosts: The Possession of Button House',dist:'Lionsgate',genre:'Horror',franchise:'Ghosts',starActor:null,phase:3,week:42,basePrice:10,estM:18,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f119',title:'Animal',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f120',title:'Tad and the Magic Lamp',dist:'Paramount',genre:'Animation',franchise:'Tad',starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f121',title:'Remain',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f122',title:'Terrifier 4',dist:'Cineverse',genre:'Horror',franchise:'Terrifier',starActor:null,phase:3,week:42,basePrice:10,estM:20,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f123',title:'Wild Horse Nine',dist:'WDi',genre:'Drama',franchise:null,starActor:null,phase:4,week:43,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f124',title:'The Cat in the Hat HFSS',dist:'WB',genre:'Animation',franchise:null,starActor:'Bill Hader',phase:4,week:43,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f125',title:'The Great Beyond',dist:'Searchlight',genre:'Drama',franchise:null,starActor:null,phase:4,week:45,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f126',title:'Ebenezer: A Christmas Carol',dist:'Disney',genre:'Animation',franchise:null,starActor:null,phase:4,week:45,basePrice:14,estM:26,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f127',title:'The Hunger Games: Sunrise on the Reaping',dist:'Lionsgate',genre:'Action',franchise:'Hunger Games',starActor:'Joseph Zada',phase:4,week:46,basePrice:58,estM:110,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f128',title:'I Play Rocky',dist:'Universal',genre:'Drama',franchise:null,starActor:null,phase:4,week:46,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f129',title:'Focker In-Law',dist:'Paramount',genre:'Comedy',franchise:'Fockers',starActor:'Ben Stiller',phase:4,week:46,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f130',title:"Disney's Hexed HFSS",dist:'Disney',genre:'Horror',franchise:null,starActor:null,phase:4,week:47,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f131',title:"Narnia: The Magician's Nephew",dist:'Netflix/Sony',genre:'Adventure',franchise:'Narnia',starActor:'Daniel Craig',phase:4,week:47,basePrice:50,estM:95,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f132',title:'Violent Night 2',dist:'Universal',genre:'Action',franchise:'Violent Night',starActor:'David Harbour',phase:4,week:48,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f133',title:'Jumanji 3',dist:'Sony',genre:'Action',franchise:'Jumanji',starActor:'Dwayne Johnson',phase:4,week:49,basePrice:44,estM:82,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f134',title:'Dune: Part Three',dist:'WB',genre:'Sci-Fi',franchise:'Dune',starActor:'Timothée Chalamet',phase:4,week:49,basePrice:80,estM:155,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f135',title:'Avengers: Doomsday',dist:'Marvel/Disney',genre:'Action',franchise:'MCU',starActor:'Robert Downey Jr',phase:4,week:50,basePrice:98,estM:210,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f136',title:'The Angry Birds Movie 3 HFSS',dist:'Paramount',genre:'Animation',franchise:'Angry Birds',starActor:null,phase:4,week:51,basePrice:14,estM:28,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f137',title:'King',dist:'Fox',genre:'Drama',franchise:null,starActor:null,phase:4,week:51,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f138',title:'Werwulf',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,phase:4,week:52,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f139',title:'The Beekeeper 2',dist:'Amazon MGM',genre:'Action',franchise:null,starActor:'Jason Statham',phase:4,week:53,basePrice:18,estM:35,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f140',title:'Children of Blood and Bone',dist:'Paramount',genre:'Action',franchise:null,starActor:null,phase:4,week:54,basePrice:22,estM:42,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f141',title:'The Rescue',dist:'Disney',genre:'Drama',franchise:null,starActor:null,phase:4,week:55,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f142',title:'The Thomas Crown Affair',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:5,week:57,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f143',title:'Ice Age: Boiling Point HFSS',dist:'Disney/20th',genre:'Animation',franchise:'Ice Age',starActor:null,phase:5,week:58,basePrice:30,estM:58,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f144',title:'The Nightingale',dist:'Universal',genre:'Drama',franchise:null,starActor:null,phase:5,week:58,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f145',title:'Star Wars: A New Hope (50th Anniversary)',dist:'Disney',genre:'Action',franchise:'Star Wars',starActor:null,phase:5,week:59,basePrice:22,estM:42,rt:99,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f146',title:'Sonic the Hedgehog 4 HFSS',dist:'Paramount',genre:'Family',franchise:'Sonic',starActor:'Jim Carrey',phase:5,week:60,basePrice:34,estM:65,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f147',title:'Untitled Mike Flanagan Exorcist Film',dist:'Lionsgate',genre:'Horror',franchise:'Exorcist',starActor:null,phase:5,week:61,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
  {id:'f148',title:'The Resurrection of The Christ: Part One',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:5,week:62,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'',affiliateUrl:'',tmdbId:null},
]

// ── SCORING ──
function calcMarketValue(film,actualM){
  if(actualM==null)return film.basePrice
  const ratio=actualM/film.estM
  let m=ratio>=2?2:ratio>=1.5?1.6:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1:ratio>=0.8?0.85:ratio>=0.6?0.65:ratio>=0.4?0.45:0.25
  let rtMod=film.rt>=90?1.15:film.rt>=75?1.08:(film.rt<50&&film.rt!=null)?0.9:1
  return Math.round(Math.max(film.basePrice*0.15,Math.min(film.basePrice*3,film.basePrice*m*rtMod)))
}
function calcOpeningPts(film,actualM,isEB=false,isAnalyst=false){
  if(actualM==null)return 0
  const ratio=actualM/film.estM
  let perf=ratio>=2?2:ratio>=1.5?1.6:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1:ratio>=0.8?0.85:ratio>=0.6?0.65:0.45
  let rtMod=film.rt>=90?1.25:film.rt>=75?1.1:(film.rt<50&&film.rt!=null)?0.85:1
  let pts=Math.round(actualM*perf*rtMod)
  if(isEB&&ratio>=1.1)pts=Math.round(pts*1.1)
  if(isAnalyst)pts+=60
  return pts
}
function calcLegsBonus(actualM,week2M){if(actualM==null||week2M==null)return 0;return((actualM-week2M)/actualM)<0.3?25:0}
function calcWeeklyPts(weeksMap){return Object.entries(weeksMap).reduce((s,[wk,g])=>s+Number(g)*(Number(wk)>=4?1.1:1),0)}
function calcDemandMultiplier(film,rosters,phase,total){
  if(!total)return 1
  const pct=rosters.filter(r=>r.film_id===film.id&&r.phase===phase&&r.active).length/total
  return pct>0.4?1.4:pct>0.25?1.25:pct>0.15?1.1:pct<0.05?0.9:1
}
function timeAgo(ts){
  const d=Date.now()-new Date(ts).getTime(),m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000)
  return d<60000?'just now':m<60?`${m}m ago`:h<24?`${h}h ago`:`${dy}d ago`
}

// ── TMDB ──
const posterCache={}
async function fetchPoster(title,year){
  const key=`${title}-${year}`
  if(posterCache[key]!==undefined)return posterCache[key]
  try{
    const q=encodeURIComponent(title)
    const yr=year?`&primary_release_year=${year}`:''
    const res=await fetch(`https://api.themoviedb.org/3/search/movie?query=${q}${yr}&language=en-US&page=1`,{headers:{Authorization:`Bearer ${TMDB_TOKEN}`,'Content-Type':'application/json'}})
    const data=await res.json()
    const path=data.results?.[0]?.poster_path||null
    posterCache[key]=path?`${TMDB_IMG}${path}`:null
  }catch{posterCache[key]=null}
  return posterCache[key]
}

// ── DB HELPERS ──
async function dbUpsert(table,matchCol,matchVal,data){
  const{data:ex}=await supabase.from(table).select(matchCol).eq(matchCol,matchVal)
  if(ex&&ex.length>0)return supabase.from(table).update(data).eq(matchCol,matchVal)
  return supabase.from(table).insert({[matchCol]:matchVal,...data})
}
async function dbUpsertWeekly(filmId,weekNum,grossM){
  const{data:ex}=await supabase.from('weekly_grosses').select('id').eq('film_id',filmId).eq('week_num',weekNum)
  if(ex&&ex.length>0)return supabase.from('weekly_grosses').update({gross_m:grossM}).eq('film_id',filmId).eq('week_num',weekNum)
  return supabase.from('weekly_grosses').insert({film_id:filmId,week_num:weekNum,gross_m:grossM})
}
async function logActivity(userId,type,payload){
  try{await supabase.from('activity_feed').insert({user_id:userId,type,payload})}catch{}
}

// ── POSTER COMPONENT ──
function FilmPoster({film,size=80}){
  const [poster,setPoster]=useState(null)
  const genreCol=GENRE_COL[film.genre]||'#888'
  useEffect(()=>{
    let cancelled=false
    fetchPoster(film.title,2025).then(p=>{if(!cancelled)setPoster(p)})
    return()=>{cancelled=true}
  },[film.title])
  if(!poster)return(
    <div style={{width:size,height:size*1.4,borderRadius:'6px',background:genreCol+'22',border:`1px solid ${genreCol}33`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'10px',color:genreCol,textAlign:'center',padding:'4px'}}>
      {film.genre}
    </div>
  )
  return <img src={poster} alt={film.title} style={{width:size,height:size*1.4,objectFit:'cover',borderRadius:'6px',flexShrink:0}} loading="lazy"/>
}

// ── SCORE BREAKDOWN MODAL ──
function ScoreBreakdownModal({film,holding,results,weeklyGrosses,allChips,auteurDeclarations,weekendWinners,isEarlyBird,onClose}){
  const actual=results[film.id],weeks=weeklyGrosses[film.id]||{},pid=holding.player_id
  const chip=allChips.find(c=>c.player_id===pid)
  const analystWin=chip?.analyst_film_id===film.id&&chip?.analyst_result==='win'
  const shortResult=chip?.short_film_id===film.id?chip?.short_result:null
  const eb=isEarlyBird(holding),auteur=auteurDeclarations.find(a=>a.player_id===pid)?.film_ids?.includes(film.id)
  const isWW=Object.values(weekendWinners).includes(film.id)
  const baseOpen=actual!=null?calcOpeningPts(film,actual,false,false):0
  const ebBonus=(eb&&actual!=null&&actual/film.estM>=1.1)?Math.round(baseOpen*0.1):0
  const analystBonus=analystWin?60:0
  const auteurBonus=auteur?Math.round((baseOpen+ebBonus)*0.1):0
  const openPts=baseOpen+ebBonus+analystBonus+auteurBonus
  const wkPts=Math.round(calcWeeklyPts(weeks))
  const lb=calcLegsBonus(actual,weeks[2]),ww=isWW?15:0
  const sb=shortResult==='win'?100:shortResult==='lose'?-30:0
  const total=openPts+wkPts+lb+ww+sb
  const gc=GENRE_COL[film.genre]||'#888'
  const Row=({label,value,col,sub})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid #1E222C'}}>
      <div><div style={{fontSize:'11px',color:'#9AA0B2'}}>{label}</div>{sub&&<div style={{fontSize:'9px',color:'#4A5168',marginTop:'2px'}}>{sub}</div>}</div>
      <div style={{fontSize:'14px',fontWeight:700,color:col||'#F2EEE8'}}>{value}</div>
    </div>
  )
  return(
    <div style={{position:'fixed',inset:0,background:'#000000DD',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:800}} onClick={onClose}>
      <div style={{background:'#0C0E12',border:'1px solid #1E222C',borderRadius:'16px 16px 0 0',width:'100%',maxWidth:'520px',maxHeight:'88vh',overflowY:'auto',padding:'20px',paddingBottom:'calc(24px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin:'0 auto 16px'}}/>
        <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'16px'}}>
          <FilmPoster film={film} size={60}/>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:700}}>{film.title}</div>
            <div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>{film.dist} · W{film.week} · Phase {film.phase}</div>
            {actual!=null&&<div style={{marginTop:'8px',display:'flex',gap:'12px',flexWrap:'wrap'}}>
              <div><div style={{fontSize:'8px',color:'#4A5168'}}>ACTUAL</div><div style={{fontSize:'14px',color:S.green,fontWeight:700}}>${actual}M</div></div>
              <div><div style={{fontSize:'8px',color:'#4A5168'}}>EST</div><div style={{fontSize:'14px'}}>${film.estM}M</div></div>
              <div><div style={{fontSize:'8px',color:'#4A5168'}}>RATIO</div><div style={{fontSize:'14px',color:actual/film.estM>=1?S.green:S.red,fontWeight:700}}>{(actual/film.estM).toFixed(2)}×</div></div>
              {film.rt!=null&&<div><div style={{fontSize:'8px',color:'#4A5168'}}>RT</div><div style={{fontSize:'14px',color:film.rt>=90?S.green:film.rt>=75?S.gold:S.red,fontWeight:700}}>{film.rt}%</div></div>}
            </div>}
          </div>
        </div>
        {actual==null?<div style={{textAlign:'center',color:'#4A5168',padding:'28px',fontSize:'12px'}}>No results yet.</div>:<>
          <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'6px'}}>POINTS BREAKDOWN</div>
          <Row label="Base opening pts" value={`+${baseOpen}`} sub={`$${actual}M × ${(actual/film.estM).toFixed(2)}× perf`}/>
          {eb&&ebBonus>0&&<Row label="🐦 Early Bird +10%" value={`+${ebBonus}`} col={S.green}/>}
          {analystWin&&<Row label="🎯 Analyst bonus" value="+60" col={S.blue}/>}
          {auteur&&auteurBonus>0&&<Row label="🎭 Auteur +10%" value={`+${auteurBonus}`} col={S.orange}/>}
          {wkPts>0&&<Row label="Weekly grosses" value={`+${wkPts}`} col={S.blue} sub="W1-3: 1pt/$1M · W4+: 1.1pts/$1M"/>}
          {lb>0&&<Row label="🦵 Legs bonus" value="+25" col={S.green}/>}
          {isWW&&<Row label="🥇 Weekend winner" value="+15" col={S.gold}/>}
          {sb!==0&&<Row label={sb>0?'📉 Short WIN':'📉 Short LOSE'} value={sb>0?'+100':'-30'} col={sb>0?S.green:S.red}/>}
          <div style={{marginTop:'14px',background:'#12141A',borderRadius:'10px',padding:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:'11px',color:'#9AA0B2',letterSpacing:'1px'}}>TOTAL POINTS</div>
            <div style={{fontSize:'32px',fontWeight:900,color:S.gold}}>{total}</div>
          </div>
        </>}
        <button style={{...S.btn,width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'#9AA0B2',marginTop:'12px',padding:'13px'}} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ── FILM DETAIL MODAL (comments + reactions) ──
function FilmDetailModal({film,profile,players,results,allChips,onClose}){
  const [comments,setComments]=useState([])
  const [reactions,setReactions]=useState([])
  const [newComment,setNewComment]=useState('')
  const actual=results[film.id]
  const gc=GENRE_COL[film.genre]||'#888'

  useEffect(()=>{
    loadComments();loadReactions()
    const ch=supabase.channel(`film-${film.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'film_comments',filter:`film_id=eq.${film.id}`},loadComments)
      .on('postgres_changes',{event:'*',schema:'public',table:'reactions',filter:`target_id=eq.${film.id}`},loadReactions)
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[])

  const loadComments=async()=>{const{data}=await supabase.from('film_comments').select('*').eq('film_id',film.id).order('created_at',{ascending:true});if(data)setComments(data)}
  const loadReactions=async()=>{const{data}=await supabase.from('reactions').select('*').eq('target_type','film').eq('target_id',film.id);if(data)setReactions(data)}

  const postComment=async()=>{
    if(!newComment.trim())return
    await supabase.from('film_comments').insert({user_id:profile.id,film_id:film.id,comment:newComment.trim()})
    setNewComment('');loadComments()
  }
  const toggleReaction=async(emoji)=>{
    const mine=reactions.find(r=>r.user_id===profile.id&&r.emoji===emoji)
    if(mine)await supabase.from('reactions').delete().eq('id',mine.id)
    else await supabase.from('reactions').insert({user_id:profile.id,target_type:'film',target_id:film.id,emoji})
    loadReactions()
  }

  const emojiCounts=EMOJI_OPTIONS.reduce((acc,e)=>({...acc,[e]:reactions.filter(r=>r.emoji===e).length}),{})
  const myReactions=reactions.filter(r=>r.user_id===profile.id).map(r=>r.emoji)

  return(
    <div style={{position:'fixed',inset:0,background:'#000000DD',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:800}} onClick={onClose}>
      <div style={{background:'#0C0E12',border:'1px solid #1E222C',borderRadius:'16px 16px 0 0',width:'100%',maxWidth:'540px',maxHeight:'90vh',overflowY:'auto',padding:'20px',paddingBottom:'calc(20px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin:'0 auto 14px'}}/>
        <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'14px'}}>
          <FilmPoster film={film} size={70}/>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:700,lineHeight:1.3}}>{film.title}</div>
            <div style={{fontSize:'10px',color:'#4A5168',marginTop:'3px'}}>{film.dist} · {film.genre} · W{film.week}</div>
            {film.starActor&&<div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>⭐ {film.starActor}</div>}
            {actual!=null&&<div style={{marginTop:'6px',fontSize:'12px',color:S.green,fontWeight:700}}>${actual}M actual · Est ${film.estM}M</div>}
          </div>
        </div>

        {/* Reactions */}
        <div style={{marginBottom:'14px'}}>
          <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>REACTIONS</div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {EMOJI_OPTIONS.map(emoji=>{
              const count=emojiCounts[emoji],mine=myReactions.includes(emoji)
              return(
                <button key={emoji} onClick={()=>toggleReaction(emoji)}
                  style={{background:mine?'#F0B42922':'#12141A',border:`1px solid ${mine?S.gold+'66':'#2A2F3C'}`,borderRadius:'20px',padding:'4px 10px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'4px',fontFamily:'DM Mono,monospace'}}>
                  {emoji}{count>0&&<span style={{fontSize:'10px',color:mine?S.gold:'#4A5168'}}>{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Comments */}
        <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>COMMENTS ({comments.length})</div>
        <div style={{maxHeight:'200px',overflowY:'auto',marginBottom:'12px'}}>
          {comments.length===0&&<div style={{fontSize:'11px',color:'#4A5168',padding:'8px 0'}}>No comments yet — be first!</div>}
          {comments.map(c=>{
            const p=players.find(pl=>pl.id===c.user_id)
            return(
              <div key={c.id} style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
                <div style={{width:'22px',height:'22px',borderRadius:'50%',background:p?.color||S.gold,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,color:'#000'}}>{p?.name?.[0]||'?'}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:'6px',alignItems:'baseline',marginBottom:'2px'}}>
                    <span style={{fontSize:'10px',fontWeight:700,color:p?.color||S.gold}}>{p?.name}</span>
                    <span style={{fontSize:'9px',color:'#4A5168'}}>{timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{fontSize:'11px',color:'#C8C4BE',lineHeight:1.5}}>{c.comment}</div>
                </div>
                {c.user_id===profile.id&&<button onClick={async()=>{await supabase.from('film_comments').delete().eq('id',c.id);loadComments()}} style={{background:'none',border:'none',color:'#4A5168',cursor:'pointer',fontSize:'10px',padding:'0 4px'}}>✕</button>}
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <input value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==='Enter'&&postComment()} placeholder="Add a comment…" style={{...S.inp,flex:1,fontSize:'11px'}}/>
          <button style={{...S.btn,background:S.blue,color:'#fff',padding:'8px 14px',fontSize:'10px'}} onClick={postComment}>Post</button>
        </div>
        <button style={{...S.btn,width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',marginTop:'10px',padding:'11px'}} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ── PLAYER PROFILE MODAL ──
function PlayerProfileModal({player,films,rosters,results,weeklyGrosses,allChips,auteurDeclarations,weekendWinners,oscarPredictions,calcPoints,calcPhasePoints,onClose}){
  const totalPts=calcPoints(player.id)
  const chip=allChips.find(c=>c.player_id===player.id)
  const auteur=auteurDeclarations.find(a=>a.player_id===player.id)
  const oscar=oscarPredictions.find(o=>o.player_id===player.id)
  const allHoldings=rosters.filter(r=>r.player_id===player.id)
  const bestFilm=allHoldings.reduce((best,h)=>{
    const film=films.find(f=>f.id===h.film_id);if(!film||results[film.id]==null)return best
    const pts=calcOpeningPts(film,results[film.id])
    return pts>(best?.pts||0)?{film,pts}:best
  },null)

  return(
    <div style={{position:'fixed',inset:0,background:'#000000DD',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:800}} onClick={onClose}>
      <div style={{background:'#0C0E12',border:'1px solid #1E222C',borderRadius:'16px 16px 0 0',width:'100%',maxWidth:'520px',maxHeight:'88vh',overflowY:'auto',padding:'20px',paddingBottom:'calc(24px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin:'0 auto 16px'}}/>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'18px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'50%',background:player.color||S.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:900,color:'#000',flexShrink:0}}>{player.name?.[0]||'?'}</div>
          <div>
            <div style={{fontSize:'18px',fontWeight:800,color:player.color||S.gold}}>{player.name}</div>
            <div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>{player.email||'League member'}</div>
          </div>
          <div style={{marginLeft:'auto',textAlign:'right'}}>
            <div style={{fontSize:'28px',fontWeight:900,color:S.gold}}>{totalPts}</div>
            <div style={{fontSize:'8px',color:'#4A5168'}}>GRAND PTS</div>
          </div>
        </div>

        {/* Phase pts grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px',marginBottom:'16px'}}>
          {[1,2,3,4,5].map(ph=>(
            <div key={ph} style={{background:'#12141A',borderRadius:'7px',padding:'7px',textAlign:'center'}}>
              <div style={{fontSize:'8px',color:'#4A5168'}}>PH{ph}</div>
              <div style={{fontSize:'13px',fontWeight:700,color:'#F2EEE8'}}>{calcPhasePoints(player.id,ph)}</div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
          <div style={{background:'#12141A',borderRadius:'8px',padding:'10px 14px',flex:1,minWidth:'80px'}}>
            <div style={{fontSize:'8px',color:'#4A5168',marginBottom:'4px'}}>FILMS HELD</div>
            <div style={{fontSize:'18px',fontWeight:700}}>{allHoldings.filter(h=>h.active).length}</div>
          </div>
          <div style={{background:'#12141A',borderRadius:'8px',padding:'10px 14px',flex:1,minWidth:'80px'}}>
            <div style={{fontSize:'8px',color:'#4A5168',marginBottom:'4px'}}>TOTAL HELD</div>
            <div style={{fontSize:'18px',fontWeight:700}}>{allHoldings.length}</div>
          </div>
          {bestFilm&&<div style={{background:'#12141A',borderRadius:'8px',padding:'10px 14px',flex:2,minWidth:'120px'}}>
            <div style={{fontSize:'8px',color:'#4A5168',marginBottom:'4px'}}>BEST PICK</div>
            <div style={{fontSize:'11px',fontWeight:700,color:S.gold}}>{bestFilm.film.title}</div>
            <div style={{fontSize:'10px',color:S.green}}>+{bestFilm.pts}pts</div>
          </div>}
        </div>

        {/* Chips used */}
        <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>CHIPS</div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'16px'}}>
          {chip?.recut_used&&<span style={{fontSize:'10px',color:S.purple,padding:'3px 8px',background:S.purple+'15',borderRadius:'5px'}}>🎬 Recut used</span>}
          {chip?.short_film_id&&<span style={{fontSize:'10px',color:S.red,padding:'3px 8px',background:S.red+'15',borderRadius:'5px'}}>📉 Shorted {films.find(f=>f.id===chip.short_film_id)?.title}</span>}
          {chip?.analyst_film_id&&<span style={{fontSize:'10px',color:S.blue,padding:'3px 8px',background:S.blue+'15',borderRadius:'5px'}}>🎯 Analyst {films.find(f=>f.id===chip.analyst_film_id)?.title}</span>}
          {auteur&&<span style={{fontSize:'10px',color:S.orange,padding:'3px 8px',background:S.orange+'15',borderRadius:'5px'}}>🎭 Auteur: {auteur.star_actor}</span>}
          {oscar&&<span style={{fontSize:'10px',color:S.gold,padding:'3px 8px',background:S.gold+'15',borderRadius:'5px'}}>🏆 {films.find(f=>f.id===oscar.best_picture_film_id)?.title}</span>}
          {!chip&&!auteur&&!oscar&&<span style={{fontSize:'10px',color:'#4A5168'}}>No chips used yet</span>}
        </div>

        {/* Current roster */}
        <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>CURRENT HOLDINGS</div>
        {allHoldings.filter(h=>h.active).map(h=>{
          const film=films.find(f=>f.id===h.film_id);if(!film)return null
          const actual=results[film.id]
          return(
            <div key={h.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid #1E222C'}}>
              <div style={{width:'3px',height:'28px',background:GENRE_COL[film.genre]||'#888',borderRadius:'2px',flexShrink:0}}/>
              <div style={{flex:1,fontSize:'11px'}}>{film.title}</div>
              <div style={{fontSize:'10px',color:'#4A5168'}}>${h.bought_price}M</div>
              {actual!=null&&<div style={{fontSize:'10px',color:S.gold,fontWeight:700}}>{calcOpeningPts(film,actual)}pts</div>}
            </div>
          )
        })}
        <button style={{...S.btn,width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',marginTop:'14px',padding:'12px'}} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ── TRADE MODAL ──
function TradeModal({profile,players,rosters,films,filmVal,curPhase,onClose,notify,onDone}){
  const [targetPlayer,setTargetPlayer]=useState('')
  const [myFilmId,setMyFilmId]=useState('')
  const [theirFilmId,setTheirFilmId]=useState('')
  const ph=curPhase()
  const myRoster=rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id))
  const theirRoster=rosters.filter(r=>r.player_id===targetPlayer&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id))

  const proposeTrade=async()=>{
    if(!targetPlayer||!myFilmId||!theirFilmId)return notify('Fill all fields',S.red)
    const{error}=await supabase.from('trades').insert({proposer_id:profile.id,receiver_id:targetPlayer,proposer_film_id:myFilmId,receiver_film_id:theirFilmId,status:'pending',phase:ph})
    if(error)return notify(error.message,S.red)
    await logActivity(profile.id,'trade_proposed',{player_name:profile.name,my_film:films.find(f=>f.id===myFilmId)?.title,their_film:films.find(f=>f.id===theirFilmId)?.title})
    notify('Trade proposal sent!',S.blue);onDone()
  }

  return(
    <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:700}} onClick={onClose}>
      <div style={{background:'#0C0E12',border:'1px solid #2A2F3C',borderRadius:'16px 16px 0 0',padding:'20px',width:'100%',maxWidth:'480px',maxHeight:'85vh',overflowY:'auto',paddingBottom:'calc(20px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin:'0 auto 16px'}}/>
        <div style={{fontSize:'16px',fontWeight:800,color:S.blue,marginBottom:'6px'}}>🔄 Propose Trade</div>
        <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Phase {ph} films only · Both rosters update on acceptance</div>

        <div style={{marginBottom:'12px'}}>
          <div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>TRADE WITH</div>
          <select value={targetPlayer} onChange={e=>{setTargetPlayer(e.target.value);setTheirFilmId('')}} style={{...S.inp}}>
            <option value="">Select player…</option>
            {players.filter(p=>p.id!==profile.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>
          <div>
            <div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>YOU GIVE</div>
            <select value={myFilmId} onChange={e=>setMyFilmId(e.target.value)} style={{...S.inp,fontSize:'10px'}}>
              <option value="">Your film…</option>
              {myRoster.map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title} (${filmVal(f)}M)</option>:null})}
            </select>
          </div>
          <div>
            <div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>YOU GET</div>
            <select value={theirFilmId} onChange={e=>setTheirFilmId(e.target.value)} style={{...S.inp,fontSize:'10px'}} disabled={!targetPlayer}>
              <option value="">Their film…</option>
              {theirRoster.map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title} (${filmVal(f)}M)</option>:null})}
            </select>
          </div>
        </div>

        {myFilmId&&theirFilmId&&(
          <div style={{background:'#12141A',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'10px',color:'#9AA0B2'}}>
            You give <span style={{color:S.gold}}>{films.find(f=>f.id===myFilmId)?.title}</span> · You get <span style={{color:S.blue}}>{films.find(f=>f.id===theirFilmId)?.title}</span>
          </div>
        )}

        <div style={{display:'flex',gap:'8px'}}>
          <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,padding:'12px'}} onClick={onClose}>Cancel</button>
          <button style={{...S.btn,background:S.blue,color:'#fff',flex:1,padding:'12px',fontWeight:700}} onClick={proposeTrade}>Send Proposal</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN APP ──
export default function App(){
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
  const [trades,setTrades]=useState([])
  const [leagueConfig,setLeagueConfig]=useState({current_week:1,current_phase:1,currency:'$',tx_fee:5,phase_window_active:false,phase_window_opened_at:null,best_picture_winner:null})
  const [activityFeed,setActivityFeed]=useState([])
  const [notif,setNotif]=useState(null)
  const [trailerFilm,setTrailerFilm]=useState(null)
  const [chipModal,setChipModal]=useState(null)
  const [scoreModal,setScoreModal]=useState(null)
  const [filmDetailModal,setFilmDetailModal]=useState(null)
  const [profileModal,setProfileModal]=useState(null)
  const [tradeModal,setTradeModal]=useState(false)
  const [addFilmModal,setAddFilmModal]=useState(false)
  const [newFilm,setNewFilm]=useState({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:'',affiliateUrl:'',tmdbId:''})
  const [now,setNow]=useState(Date.now())
  const [auteurActor,setAuteurActor]=useState('')
  const [auteurFilms,setAuteurFilms]=useState([])
  const [sidebarOpen,setSidebarOpen]=useState(false)
  const [isMobile]=useState(()=>/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))
  const [marketSearch,setMarketSearch]=useState('')
  const [marketGenre,setMarketGenre]=useState('All')

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false)})
    supabase.auth.onAuthStateChange((_,s)=>setSession(s))
  },[])
  useEffect(()=>{if(session){loadProfile();loadData();loadFeed()}},[session])
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[])
  useEffect(()=>{
    if(!session)return
    const ch=supabase.channel('realtime-all')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'activity_feed'},()=>loadFeed())
      .on('postgres_changes',{event:'*',schema:'public',table:'trades'},()=>loadTrades())
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[session])

  const notify=(msg,col=S.gold)=>{setNotif({msg,col});setTimeout(()=>setNotif(null),3200)}
  const isCommissioner=session?.user?.email===COMMISSIONER_EMAIL

  const loadProfile=async()=>{const{data}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();if(data)setProfile(data)}
  const loadFeed=async()=>{const{data}=await supabase.from('activity_feed').select('*').order('created_at',{ascending:false}).limit(60);if(data)setActivityFeed(data)}
  const loadTrades=async()=>{const{data}=await supabase.from('trades').select('*').order('created_at',{ascending:false});if(data)setTrades(data)}

  const loadData=async()=>{
    const[{data:ps},{data:rs},{data:res},{data:fv},{data:cfg},{data:wg},{data:ch},{data:fc},{data:op},{data:ad},{data:ww},{data:pb}]=await Promise.all([
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
    if(wg){const m={};wg.forEach(w=>{if(!m[w.film_id])m[w.film_id]={};m[w.film_id][w.week_num]=w.gross_m});setWeeklyGrosses(m)}
    if(ch){setAllChips(ch);setChips(ch.find(c=>c.player_id===session?.user?.id)||null)}
    if(fc){setAllForecasts(fc);const m={};fc.filter(f=>f.player_id===session?.user?.id).forEach(f=>m[f.film_id]=f.predicted_m);setForecasts(m)}
    if(op){setOscarPredictions(op);setMyOscarPick(op.find(o=>o.player_id===session?.user?.id)||null)}
    if(ad)setAuteurDeclarations(ad)
    if(ww){const m={};ww.forEach(w=>m[w.week]=w.film_id);setWeekendWinners(m)}
    if(pb)setPhaseBudgets(pb)
    loadTrades()
  }

  // ── BUDGET ──
  const curPhase=()=>leagueConfig.current_phase||1
  const isWindow=()=>leagueConfig.phase_window_active||false
  const phaseBanked=(pid,ph)=>ph<=1?0:phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph-1)?.budget_banked||0
  const phaseAllocated=(pid,ph)=>{const s=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph);return s?s.budget_allocated:(PHASE_BUDGETS[ph]||100)+phaseBanked(pid,ph)}
  const phaseSpent=(pid,ph)=>rosters.filter(r=>r.player_id===pid&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).reduce((s,r)=>s+r.bought_price,0)
  const budgetLeft=(pid)=>Math.max(0,phaseAllocated(pid,curPhase())-phaseSpent(pid,curPhase()))
  const bankBudget=async(pid,ph)=>{
    const alloc=phaseAllocated(pid,ph),spent=phaseSpent(pid,ph),banked=Math.max(0,alloc-spent)
    const ex=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph)
    if(ex)await supabase.from('phase_budgets').update({budget_allocated:alloc,budget_spent:spent,budget_banked:banked}).eq('id',ex.id)
    else await supabase.from('phase_budgets').insert({player_id:pid,phase:ph,budget_allocated:alloc,budget_spent:spent,budget_banked:banked})
  }

  // ── HELPERS ──
  const filmVal=(film)=>Math.round((filmValues[film.id]??film.basePrice)*calcDemandMultiplier(film,rosters,curPhase(),players.length))
  const isEarlyBird=(h)=>{const f=films.find(fl=>fl.id===h.film_id);return f?f.week-(h.acquired_week||h.bought_week)>=EARLY_BIRD_WEEKS:false}
  const auteurBonus=(pid,fid)=>auteurDeclarations.find(a=>a.player_id===pid&&a.phase===curPhase())?.film_ids?.includes(fid)||false
  const shortBonus=(pid,fid)=>{const c=allChips.find(c=>c.player_id===pid);if(!c?.short_film_id||c.short_film_id!==fid)return 0;return c.short_result==='win'?100:c.short_result==='lose'?-30:0}
  const analystActive=(pid,fid)=>{const c=allChips.find(c=>c.player_id===pid);return c?.analyst_film_id===fid&&c?.analyst_result==='win'}
  const wwBonus=(fid)=>Object.values(weekendWinners).includes(fid)?15:0
  const forecasterPhasePts=(pid,ph)=>{
    const phF=films.filter(f=>f.phase===ph&&results[f.id]!=null);if(!phF.length)return 0
    const pfc=allForecasts.filter(f=>f.player_id===pid&&phF.find(pf=>pf.id===f.film_id));if(!pfc.length)return null
    return pfc.reduce((s,fc)=>s+Math.abs(fc.predicted_m-results[fc.film_id])/results[fc.film_id],0)/pfc.length
  }
  const forecasterBonusPts=(pid,ph)=>{
    const sc=players.map(p=>({id:p.id,s:forecasterPhasePts(p.id,ph)})).filter(x=>x.s!=null);if(!sc.length)return 0
    const best=sc.reduce((a,b)=>a.s<b.s?a:b);return best.id===pid?15:0
  }
  const seasonForecasterBonus=(pid)=>{
    const ss=players.map(p=>{const sc=[1,2,3,4,5].map(ph=>forecasterPhasePts(p.id,ph)).filter(s=>s!=null);return{id:p.id,s:sc.length?sc.reduce((a,b)=>a+b,0)/sc.length:null}}).filter(x=>x.s!=null)
    if(!ss.length)return 0;const best=ss.reduce((a,b)=>a.s<b.s?a:b);return best.id===pid?50:0
  }
  const calcPhasePoints=(pid,ph)=>{
    let t=0
    rosters.filter(r=>r.player_id===pid&&r.phase===ph&&films.find(f=>f.id===r.film_id)).forEach(h=>{
      const film=films.find(f=>f.id===h.film_id);if(!film)return
      const actual=results[film.id];if(actual==null)return
      let op=calcOpeningPts(film,actual,isEarlyBird(h),analystActive(pid,film.id))
      if(auteurBonus(pid,film.id))op=Math.round(op*1.1)
      t+=op+Math.round(calcWeeklyPts(weeklyGrosses[film.id]||{}))+calcLegsBonus(actual,weeklyGrosses[film.id]?.[2])+wwBonus(film.id)+shortBonus(pid,film.id)
    })
    return t+forecasterBonusPts(pid,ph)
  }
  const calcPoints=(pid)=>{
    let t=[1,2,3,4,5].reduce((s,ph)=>s+calcPhasePoints(pid,ph),0)
    if(oscarPredictions.find(o=>o.player_id===pid)?.correct)t+=75
    return t+seasonForecasterBonus(pid)
  }

  // ── BUY / SELL ──
  const buyFilm=async(film)=>{
    if(!profile)return notify('Create a profile first',S.red)
    const ph=curPhase()
    if(film.phase!==ph)return notify(`Film is Phase ${film.phase}`,S.red)
    if(rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active))return notify('Already owned',S.red)
    if(rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id)).length>=MAX_ROSTER)return notify(`Roster full (${MAX_ROSTER} max)`,S.red)
    const price=filmVal(film),left=budgetLeft(profile.id)
    if(price>left)return notify(`Not enough budget ($${price}M needed)`,S.red)
    const{error}=await supabase.from('rosters').insert({player_id:profile.id,film_id:film.id,bought_price:price,bought_week:leagueConfig.current_week,acquired_week:leagueConfig.current_week,phase:ph,active:true})
    if(error)return notify(error.message,S.red)
    await supabase.from('transactions').insert({player_id:profile.id,film_id:film.id,type:'buy',price,week:leagueConfig.current_week})
    await logActivity(profile.id,'buy',{film_id:film.id,film_title:film.title,price,player_name:profile.name})
    notify(`Acquired ${film.title} for $${price}M`,S.green);loadData()
  }
  const sellFilm=async(film)=>{
    const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active);if(!h)return
    const win=isWindow(),val=filmVal(film),fee=win?0:leagueConfig.tx_fee,proceeds=Math.max(0,val-fee)
    await supabase.from('rosters').update({active:false,sold_price:proceeds,sold_week:leagueConfig.current_week}).eq('id',h.id)
    await supabase.from('transactions').insert([{player_id:profile.id,film_id:film.id,type:'sell',price:proceeds,week:leagueConfig.current_week},...(fee>0?[{player_id:profile.id,film_id:film.id,type:'fee',price:fee,week:leagueConfig.current_week}]:[])])
    await logActivity(profile.id,'sell',{film_id:film.id,film_title:film.title,proceeds,player_name:profile.name})
    notify(`Sold ${film.title} · $${proceeds}M${win?' (free)':''}`,S.gold);loadData()
  }

  // ── TRADE ACTIONS ──
  const acceptTrade=async(trade)=>{
    // Swap the roster entries
    const myH=rosters.find(r=>r.player_id===trade.receiver_id&&r.film_id===trade.receiver_film_id&&r.active)
    const theirH=rosters.find(r=>r.player_id===trade.proposer_id&&r.film_id===trade.proposer_film_id&&r.active)
    if(!myH||!theirH)return notify('One of the films is no longer available',S.red)
    // Deactivate old
    await supabase.from('rosters').update({active:false,sold_price:0,sold_week:leagueConfig.current_week}).eq('id',myH.id)
    await supabase.from('rosters').update({active:false,sold_price:0,sold_week:leagueConfig.current_week}).eq('id',theirH.id)
    // Insert swapped
    await supabase.from('rosters').insert({player_id:trade.receiver_id,film_id:trade.proposer_film_id,bought_price:theirH.bought_price,bought_week:leagueConfig.current_week,acquired_week:theirH.acquired_week,phase:trade.phase,active:true})
    await supabase.from('rosters').insert({player_id:trade.proposer_id,film_id:trade.receiver_film_id,bought_price:myH.bought_price,bought_week:leagueConfig.current_week,acquired_week:myH.acquired_week,phase:trade.phase,active:true})
    await supabase.from('trades').update({status:'accepted',resolved_at:new Date().toISOString()}).eq('id',trade.id)
    const pf=films.find(f=>f.id===trade.proposer_film_id)?.title,rf=films.find(f=>f.id===trade.receiver_film_id)?.title
    await logActivity(profile.id,'trade_accepted',{player_name:profile.name,film_given:rf,film_received:pf})
    notify('Trade accepted!',S.green);loadData()
  }
  const rejectTrade=async(trade)=>{
    await supabase.from('trades').update({status:'rejected',resolved_at:new Date().toISOString()}).eq('id',trade.id)
    notify('Trade rejected',S.red);loadTrades()
  }
  const cancelTrade=async(trade)=>{
    await supabase.from('trades').update({status:'cancelled',resolved_at:new Date().toISOString()}).eq('id',trade.id)
    notify('Trade cancelled',S.orange);loadTrades()
  }

  // ── CHIPS ──
  const activateRecut=async()=>{
    if(chips?.recut_used)return notify('Recut already used',S.red)
    if(!confirm('Activate THE RECUT? Roster clears with zero fees.'))return
    for(const h of rosters.filter(r=>r.player_id===profile.id&&r.active))
      await supabase.from('rosters').update({active:false,sold_price:filmVal(films.find(f=>f.id===h.film_id)||{}),sold_week:leagueConfig.current_week}).eq('id',h.id)
    if(chips)await supabase.from('chips').update({recut_used:true}).eq('player_id',profile.id)
    else await supabase.from('chips').insert({player_id:profile.id,recut_used:true})
    await logActivity(profile.id,'chip_recut',{player_name:profile.name})
    notify('🎬 RECUT activated',S.purple);setChipModal(null);loadData()
  }
  const activateShort=async(filmId,pred)=>{
    if(chips?.short_film_id)return notify('Short already used',S.red)
    if(allChips.find(c=>c.short_film_id===filmId))return notify('Film already shorted',S.red)
    if(chips)await supabase.from('chips').update({short_film_id:filmId,short_phase:curPhase(),short_prediction:pred}).eq('player_id',profile.id)
    else await supabase.from('chips').insert({player_id:profile.id,short_film_id:filmId,short_phase:curPhase(),short_prediction:pred})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_short',{film_title:ft,prediction:pred,player_name:profile.name})
    notify(`📉 SHORT — ${ft}`,S.red);setChipModal(null);loadData()
  }
  const activateAnalyst=async(filmId,pred)=>{
    if(chips?.analyst_film_id)return notify('Analyst already used',S.red)
    if(allChips.find(c=>c.analyst_film_id===filmId))return notify('Film already Analysed',S.red)
    if(!rosters.find(r=>r.player_id===profile.id&&r.film_id===filmId&&r.active))return notify('You must own this film',S.red)
    if(chips)await supabase.from('chips').update({analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred}).eq('player_id',profile.id)
    else await supabase.from('chips').insert({player_id:profile.id,analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred})
    const ft=films.find(f=>f.id===filmId)?.title
    await logActivity(profile.id,'chip_analyst',{film_title:ft,prediction:pred,player_name:profile.name})
    notify(`🎯 ANALYST — ${ft}`,S.blue);setChipModal(null);loadData()
  }
  const resolveChips=async(filmId,actualM)=>{
    const film=films.find(f=>f.id===filmId);if(!film)return
    for(const c of allChips){
      if(c.short_film_id===filmId&&!c.short_result)await supabase.from('chips').update({short_result:(actualM/film.estM)<0.6?'win':'lose'}).eq('player_id',c.player_id)
      if(c.analyst_film_id===filmId&&!c.analyst_result){const within=c.analyst_prediction&&Math.abs(actualM-c.analyst_prediction)/c.analyst_prediction<=0.1;await supabase.from('chips').update({analyst_result:within?'win':'lose'}).eq('player_id',c.player_id)}
    }
  }
  const submitOscarPick=async(filmId)=>{
    if(myOscarPick)return notify('Already submitted',S.red)
    await supabase.from('oscar_predictions').insert({player_id:profile.id,best_picture_film_id:filmId})
    await logActivity(profile.id,'oscar',{film_title:films.find(f=>f.id===filmId)?.title,player_name:profile.name})
    notify(`🏆 Locked — ${films.find(f=>f.id===filmId)?.title}`,S.gold);loadData()
  }
  const submitAuteur=async(actor,filmIds)=>{
    if(filmIds.length<2)return notify('Select at least 2 films',S.red)
    const ph=curPhase(),ex=auteurDeclarations.find(a=>a.player_id===profile.id&&a.phase===ph)
    if(ex)await supabase.from('auteur_declarations').update({star_actor:actor,film_ids:filmIds}).eq('id',ex.id)
    else await supabase.from('auteur_declarations').insert({player_id:profile.id,phase:ph,star_actor:actor,film_ids:filmIds})
    await logActivity(profile.id,'auteur',{actor,film_count:filmIds.length,player_name:profile.name})
    notify(`🎭 Auteur — ${actor} · ${filmIds.length} films`,S.orange);setChipModal(null);setAuteurActor('');setAuteurFilms([]);loadData()
  }
  const saveForecast=async(filmId,predicted)=>{
    const ex=allForecasts.find(f=>f.player_id===profile.id&&f.film_id===filmId)
    if(ex)await supabase.from('forecasts').update({predicted_m:predicted}).eq('id',ex.id)
    else await supabase.from('forecasts').insert({player_id:profile.id,film_id:filmId,phase:curPhase(),predicted_m:predicted})
    await logActivity(profile.id,'forecast',{film_title:films.find(f=>f.id===filmId)?.title,predicted_m:predicted,player_name:profile.name})
    notify(`Forecast saved — $${predicted}M`,S.blue);loadData()
  }

  if(loading)return <div style={{...S.app,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:S.gold,fontSize:'24px'}}>Loading...</div></div>
  if(!session)return <Login/>
  if(!profile)return <CreateProfile session={session} onCreated={()=>{loadProfile();loadData()}} notify={notify}/>

  const ph=curPhase(),win=isWindow(),cur=leagueConfig.currency||'$'
  const myPhaseRoster=rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active&&films.find(f=>f.id===r.film_id))
  const myBudgetLeft=budgetLeft(profile.id)
  const banked=phaseBanked(profile.id,ph)
  const recutUsed=chips?.recut_used||false
  const shortUsed=!!chips?.short_film_id
  const analystUsed=!!chips?.analyst_film_id
  const phaseFilms=films.filter(f=>f.phase===ph)
  const pendingTradesForMe=trades.filter(t=>t.receiver_id===profile.id&&t.status==='pending')
  const wMs=leagueConfig.phase_window_opened_at?Math.max(0,72*3600000-(now-new Date(leagueConfig.phase_window_opened_at).getTime())):0
  const wH=Math.floor(wMs/3600000),wM=Math.floor((wMs%3600000)/60000),wS=Math.floor((wMs%60000)/1000)

  const allNav=[
    ['market','🎬','Market'],
    ['roster','📁','Roster'],
    ['chips','⚡','Chips'],
    ['trades','🔄','Trades'],
    ['league','🥇','League'],
    ['feed','📡','Feed'],
    ['forecaster','📊','Forecaster'],
    ['oscar','🏆','Oscars'],
    ['results','📋','Results'],
    ...(isCommissioner?[['commissioner','⚙️','Panel']]:[])
  ]

  // ── MARKET PAGE ──
  const MarketPage=()=>{
    const genres=['All',...Object.keys(GENRE_COL)]
    const visible=phaseFilms.filter(f=>{
      const ms=!marketSearch||f.title.toLowerCase().includes(marketSearch.toLowerCase())||f.dist.toLowerCase().includes(marketSearch.toLowerCase())
      return ms&&(marketGenre==='All'||f.genre===marketGenre)
    })
    return(
      <div>
        <div style={{marginBottom:'12px'}}>
          <div style={{fontSize:'17px',fontWeight:800}}>Phase {ph} · {PHASE_NAMES[ph]}</div>
          <div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>{cur}{myBudgetLeft}M left · {myPhaseRoster.length}/{MAX_ROSTER} slots{win?' · 🔓 Free drops':''}</div>
        </div>
        <div style={{display:'flex',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
          <input value={marketSearch} onChange={e=>setMarketSearch(e.target.value)} placeholder="Search…" style={{...S.inp,flex:2,minWidth:'130px',fontSize:'11px',padding:'7px 10px'}}/>
          <select value={marketGenre} onChange={e=>setMarketGenre(e.target.value)} style={{...S.inp,flex:1,minWidth:'90px',fontSize:'11px',padding:'7px 10px'}}>
            {genres.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(auto-fill,minmax(150px,1fr))':'repeat(auto-fill,minmax(200px,1fr))',gap:'10px'}}>
          {visible.map(film=>{
            const owned=myPhaseRoster.find(r=>r.film_id===film.id)
            const val=filmVal(film),actual=results[film.id],gc=GENRE_COL[film.genre]||'#888'
            const pd=(filmValues[film.id]??film.basePrice)-film.basePrice
            const wp=Math.round(calcWeeklyPts(weeklyGrosses[film.id]||{}))
            const op=actual!=null?calcOpeningPts(film,actual,owned?isEarlyBird(owned):false,analystActive(profile.id,film.id)):0
            const isShorted=chips?.short_film_id===film.id,isAnalyst=chips?.analyst_film_id===film.id
            const isAuteur=auteurBonus(profile.id,film.id),isEB=owned&&isEarlyBird(owned)
            const ownerCount=rosters.filter(r=>r.film_id===film.id&&r.phase===ph&&r.active).length
            const demandPct=players.length?Math.round(ownerCount/players.length*100):0
            const commentCount=0 // loaded lazily per film in detail modal
            return(
              <div key={film.id} style={{...S.card,border:`1px solid ${owned?S.gold+'44':'#1E222C'}`,background:owned?'#F0B42908':'#0C0E12',position:'relative',overflow:'hidden',padding:'0'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:gc,zIndex:1}}/>
                {/* Poster area */}
                <div style={{position:'relative',overflow:'hidden',cursor:'pointer'}} onClick={()=>setFilmDetailModal(film)}>
                  <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'6px',background:'#0A0B0F'}}>
                    <FilmPoster film={film} size={isMobile?70:90}/>
                  </div>
                  <div style={{position:'absolute',top:'8px',right:'8px',display:'flex',flexDirection:'column',gap:'3px'}}>
                    {isShorted&&<span style={{fontSize:'9px',background:S.red,color:'#fff',borderRadius:'4px',padding:'1px 5px'}}>📉</span>}
                    {isAnalyst&&<span style={{fontSize:'9px',background:S.blue,color:'#fff',borderRadius:'4px',padding:'1px 5px'}}>🎯</span>}
                    {isAuteur&&<span style={{fontSize:'9px',background:S.orange,color:'#fff',borderRadius:'4px',padding:'1px 5px'}}>🎭</span>}
                    {isEB&&<span style={{fontSize:'9px',background:S.green,color:'#000',borderRadius:'4px',padding:'1px 5px'}}>🐦</span>}
                  </div>
                </div>
                <div style={{padding:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,lineHeight:1.3,marginBottom:'2px',cursor:'pointer'}} onClick={()=>setFilmDetailModal(film)}>{film.title}</div>
                  <div style={{fontSize:'9px',color:'#4A5168',marginBottom:'6px'}}>{film.dist} · W{film.week}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'6px'}}>
                    <div>
                      <div style={{fontSize:'15px',fontWeight:800,color:owned?S.gold:'#F2EEE8'}}>{cur}{val}M</div>
                      <div style={{fontSize:'9px',color:pd>0?S.green:pd<0?S.red:'#4A5168'}}>{pd===0?'—':pd>0?'▲':'▼'} {cur}{film.basePrice}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      {film.rt!=null&&<div style={{fontSize:'9px',color:film.rt>=90?S.green:film.rt>=75?S.gold:S.red}}>🍅{film.rt}%</div>}
                      <div style={{fontSize:'9px',color:'#4A5168'}}>${film.estM}M est</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'3px',flexWrap:'wrap',marginBottom:'6px'}}>
                    <span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:gc+'18',color:gc}}>{film.genre}</span>
                    {film.franchise&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:'#A855F718',color:'#A855F7'}}>{film.franchise}</span>}
                    {film.sleeper&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:'#4D9EFF18',color:'#4D9EFF'}}>💤 sleeper</span>}
                  </div>
                  {ownerCount>0&&<div style={{fontSize:'9px',color:demandPct>=40?S.red:demandPct>=25?S.orange:'#4A5168',marginBottom:'4px'}}>{demandPct>=40?'🔥':demandPct>=15?'📈':''} {ownerCount} own · {demandPct}%</div>}
                  {actual!=null&&(
                    <div style={{marginBottom:'6px',background:'#12141A',borderRadius:'6px',padding:'5px 8px',cursor:owned?'pointer':'default'}} onClick={()=>{if(owned)setScoreModal({film,holding:owned})}}>
                      <div style={{fontSize:'10px',color:S.green}}>${actual}M actual</div>
                      <div style={{fontSize:'9px',color:S.gold}}>{op}pts{wp>0?` +${wp}w`:''}{calcLegsBonus(actual,weeklyGrosses[film.id]?.[2])>0?' 🦵':''}{wwBonus(film.id)>0?' 🥇':''}</div>
                      {owned&&<div style={{fontSize:'8px',color:'#4A5168',marginTop:'1px'}}>Tap for breakdown →</div>}
                    </div>
                  )}
                  <div style={{display:'flex',gap:'4px',marginBottom:'0'}}>
                    <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,fontSize:'8px',padding:'4px'}} onClick={()=>setFilmDetailModal(film)}>💬 Chat</button>
                    {film.trailer&&film.trailer.length>5&&<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,fontSize:'8px',padding:'4px'}} onClick={e=>{e.stopPropagation();setTrailerFilm(film)}}>▶ Trailer</button>}
                  </div>
                  {film.affiliateUrl&&film.week<=leagueConfig.current_week&&<a href={film.affiliateUrl} target="_blank" rel="noopener noreferrer" style={{display:'block',textAlign:'center',background:'#1E222C',borderRadius:'6px',padding:'4px',fontSize:'9px',color:S.gold,margin:'5px 0',textDecoration:'none'}}>🎟 Book Tickets</a>}
                  <div style={{marginTop:'6px'}}>
                    {owned
                      ?<button style={{...S.btn,background:'none',border:`1px solid ${S.red}44`,color:S.red,width:'100%',fontSize:'9px',padding:'6px'}} onClick={()=>sellFilm(film)}>Drop{win?' FREE':` · $${Math.max(0,val-leagueConfig.tx_fee)}M`}</button>
                      :<button style={{...S.btn,background:S.gold,color:'#000',width:'100%',fontSize:'9px',padding:'6px',fontWeight:700}} onClick={()=>buyFilm(film)}>Acquire · {cur}{val}M</button>
                    }
                  </div>
                </div>
              </div>
            )
          })}
          {visible.length===0&&<div style={{...S.card,gridColumn:'1/-1',textAlign:'center',color:'#4A5168',padding:'32px'}}>No films match.</div>}
        </div>
      </div>
    )
  }

  // ── ROSTER PAGE ──
  const RosterPage=()=>(
    <div>
      <div style={{fontSize:'17px',fontWeight:800,marginBottom:'4px'}}>My Roster · Phase {ph}</div>
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'8px'}}>{myPhaseRoster.length}/{MAX_ROSTER} films · {cur}{myBudgetLeft}M remaining{banked>0?` (incl. ${cur}${banked}M banked)`:''}</div>
      <div style={{display:'flex',gap:'6px',marginBottom:'12px',overflowX:'auto',paddingBottom:'4px'}}>
        {[1,2,3,4,5].map(p=>{
          const pts=calcPhasePoints(profile.id,p),nr=rosters.filter(r=>r.player_id===profile.id&&r.phase===p&&films.find(f=>f.id===r.film_id))
          return(<div key={p} style={{background:p===ph?S.gold+'22':'#12141A',border:`1px solid ${p===ph?S.gold+'44':'#2A2F3C'}`,borderRadius:'7px',padding:'5px 10px',textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:'8px',color:p===ph?S.gold:'#4A5168'}}>PH{p}</div>
            <div style={{fontSize:'12px',fontWeight:700,color:p===ph?S.gold:'#F2EEE8'}}>{pts}pts</div>
            <div style={{fontSize:'8px',color:'#4A5168'}}>{nr.length} films</div>
          </div>)
        })}
      </div>
      {myPhaseRoster.length===0?<div style={{...S.card,textAlign:'center',color:'#4A5168',padding:'32px'}}>No films this phase.</div>
        :myPhaseRoster.map(h=>{
          const film=films.find(f=>f.id===h.film_id);if(!film)return null
          const val=filmVal(film),actual=results[film.id],pnl=val-h.bought_price
          const gc=GENRE_COL[film.genre]||'#888'
          const wp=Math.round(calcWeeklyPts(weeklyGrosses[film.id]||{}))
          const eb=isEarlyBird(h),aw=analystActive(profile.id,film.id),au=auteurBonus(profile.id,film.id)
          let op=calcOpeningPts(film,actual,eb,aw);if(au)op=Math.round(op*1.1)
          const lb=calcLegsBonus(actual,weeklyGrosses[film.id]?.[2]),wb=wwBonus(film.id),sb=shortBonus(profile.id,film.id)
          const total=op+wp+lb+wb+sb
          return(
            <div key={h.id} style={{...S.card,cursor:actual!=null?'pointer':'default',display:'flex',gap:'10px',alignItems:'flex-start'}} onClick={()=>actual!=null&&setScoreModal({film,holding:h})}>
              <FilmPoster film={film} size={44}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'12px',fontWeight:600}}>{film.title}</div>
                <div style={{fontSize:'9px',color:'#4A5168',marginBottom:'4px'}}>{film.dist} · W{film.week}</div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <div style={{fontSize:'10px'}}><span style={{color:'#4A5168'}}>Paid </span><span>{cur}{h.bought_price}</span></div>
                  <div style={{fontSize:'10px'}}><span style={{color:'#4A5168'}}>Now </span><span style={{color:pnl>=0?S.green:S.red}}>{cur}{val}</span></div>
                  <div style={{fontSize:'10px',fontWeight:700,color:pnl>=0?S.green:S.red}}>{pnl>=0?'+':''}{pnl}</div>
                  {actual!=null&&<div style={{fontSize:'10px',color:S.gold,fontWeight:700}}>{total}pts</div>}
                </div>
                <div style={{display:'flex',gap:'4px',marginTop:'4px',flexWrap:'wrap'}}>
                  {eb&&<span style={{fontSize:'7px',color:S.green,padding:'1px 4px',background:S.green+'15',borderRadius:'3px'}}>🐦</span>}
                  {aw&&<span style={{fontSize:'7px',color:S.blue,padding:'1px 4px',background:S.blue+'15',borderRadius:'3px'}}>🎯+60</span>}
                  {au&&<span style={{fontSize:'7px',color:S.orange,padding:'1px 4px',background:S.orange+'15',borderRadius:'3px'}}>🎭+10%</span>}
                  {actual!=null&&<span style={{fontSize:'7px',color:'#4A5168'}}>Tap for breakdown</span>}
                </div>
              </div>
            </div>
          )
        })
      }
    </div>
  )

  // ── TRADES PAGE ──
  const TradesPage=()=>{
    const myProposed=trades.filter(t=>t.proposer_id===profile.id)
    const myReceived=trades.filter(t=>t.receiver_id===profile.id)
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div>
            <div style={{fontSize:'17px',fontWeight:800}}>Trades</div>
            <div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>Phase {ph} films only · swaps are instant on acceptance</div>
          </div>
          <button style={{...S.btn,background:S.blue,color:'#fff',fontSize:'10px',padding:'8px 14px'}} onClick={()=>setTradeModal(true)}>+ Propose</button>
        </div>

        {pendingTradesForMe.length>0&&(
          <div style={{...S.card,border:`1px solid ${S.blue}44`,marginBottom:'16px'}}>
            <div style={{fontSize:'10px',color:S.blue,letterSpacing:'1px',marginBottom:'10px'}}>INCOMING PROPOSALS</div>
            {pendingTradesForMe.map(t=>{
              const proposer=players.find(p=>p.id===t.proposer_id)
              const theirFilm=films.find(f=>f.id===t.proposer_film_id)
              const myFilm=films.find(f=>f.id===t.receiver_film_id)
              return(
                <div key={t.id} style={{marginBottom:'12px',padding:'12px',background:'#12141A',borderRadius:'8px'}}>
                  <div style={{fontSize:'11px',marginBottom:'8px'}}>
                    <span style={{color:proposer?.color||S.gold,fontWeight:700}}>{proposer?.name}</span>
                    <span style={{color:'#4A5168'}}> wants to trade </span>
                    <span style={{color:S.blue,fontWeight:600}}>{theirFilm?.title}</span>
                    <span style={{color:'#4A5168'}}> for your </span>
                    <span style={{color:S.gold,fontWeight:600}}>{myFilm?.title}</span>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button style={{...S.btn,background:S.green,color:'#000',flex:1,fontSize:'10px',padding:'8px'}} onClick={()=>acceptTrade(t)}>Accept</button>
                    <button style={{...S.btn,background:'#12141A',border:`1px solid ${S.red}44`,color:S.red,flex:1,fontSize:'10px',padding:'8px'}} onClick={()=>rejectTrade(t)}>Reject</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {myProposed.length>0&&(
          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'10px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>MY PROPOSALS</div>
            {myProposed.map(t=>{
              const receiver=players.find(p=>p.id===t.receiver_id)
              const mf=films.find(f=>f.id===t.proposer_film_id)
              const tf=films.find(f=>f.id===t.receiver_film_id)
              const statusCol=t.status==='accepted'?S.green:t.status==='rejected'?S.red:t.status==='cancelled'?'#4A5168':S.blue
              return(
                <div key={t.id} style={{...S.card,padding:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                    <span style={{fontSize:'10px',color:receiver?.color||S.gold,fontWeight:700}}>{receiver?.name}</span>
                    <span style={{fontSize:'9px',color:statusCol,padding:'2px 7px',background:statusCol+'18',borderRadius:'4px',textTransform:'uppercase'}}>{t.status}</span>
                  </div>
                  <div style={{fontSize:'10px',color:'#9AA0B2'}}>
                    Give <span style={{color:'#F2EEE8'}}>{mf?.title}</span> · Get <span style={{color:'#F2EEE8'}}>{tf?.title}</span>
                  </div>
                  <div style={{fontSize:'9px',color:'#4A5168',marginTop:'3px'}}>{timeAgo(t.created_at)}</div>
                  {t.status==='pending'&&<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',fontSize:'9px',padding:'5px 10px',marginTop:'8px'}} onClick={()=>cancelTrade(t)}>Cancel</button>}
                </div>
              )
            })}
          </div>
        )}

        {myProposed.length===0&&pendingTradesForMe.length===0&&(
          <div style={{...S.card,textAlign:'center',padding:'40px'}}>
            <div style={{fontSize:'24px',marginBottom:'8px'}}>🔄</div>
            <div style={{fontSize:'12px',color:'#4A5168'}}>No trades yet — propose one above!</div>
          </div>
        )}
      </div>
    )
  }

  // ── CHIPS PAGE ──
  const ChipsPage=()=>{
    const myAuteur=auteurDeclarations.find(a=>a.player_id===profile.id&&a.phase===ph)
    return(
      <div>
        <div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>My Chips</div>
        <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>One of each per season · Shorts and Analyst first-come first-served</div>
        {[
          {key:'recut',icon:'🎬',label:'THE RECUT',desc:'Full free roster rebuild · zero fees · anytime',used:recutUsed,col:S.purple,usedLabel:chips?.recut_used?'USED':null,action:activateRecut},
          {key:'short',icon:'📉',label:'THE SHORT',desc:'Bomb call · under 60% est = +100pts · hit = −30pts',used:shortUsed,col:S.red,usedLabel:shortUsed?(chips?.short_result==='win'?'✅ +100':chips?.short_result==='lose'?'❌ -30':`📉 ${films.find(f=>f.id===chips?.short_film_id)?.title||'Active'}`):null,action:()=>setChipModal('short')},
          {key:'analyst',icon:'🎯',label:'THE ANALYST',desc:'Predict opening ±10% · correct = +60pts flat',used:analystUsed,col:S.blue,usedLabel:analystUsed?(chips?.analyst_result==='win'?'✅ +60pts':chips?.analyst_result==='lose'?'❌ Missed':`🎯 ${films.find(f=>f.id===chips?.analyst_film_id)?.title||'Active'}`):null,action:()=>setChipModal('analyst')},
        ].map(({key,icon,label,desc,used,col,usedLabel,action})=>(
          <div key={key} style={{...S.card,border:`1px solid ${used?'#2A2F3C':col+'44'}`,marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{fontSize:'22px'}}>{icon}</div>
              <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:used?'#4A5168':col}}>{label}</div><div style={{fontSize:'10px',color:'#4A5168'}}>{desc}</div></div>
              {used?<span style={{fontSize:'10px',color:'#4A5168',padding:'3px 10px',border:'1px solid #2A2F3C',borderRadius:'6px'}}>{usedLabel}</span>
                :<button style={{...S.btn,background:col,color:col===S.purple||col===S.red||col===S.blue?'#fff':'#000',fontSize:'10px',padding:'6px 14px'}} onClick={action}>Activate</button>}
            </div>
          </div>
        ))}
        <div style={{...S.card,border:`1px solid ${myAuteur?'#2A2F3C':S.orange+'44'}`,marginBottom:'10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'22px'}}>🎭</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',fontWeight:700,color:myAuteur?'#4A5168':S.orange}}>THE AUTEUR</div>
              <div style={{fontSize:'10px',color:'#4A5168'}}>Declare 2+ films same star actor · +10% each</div>
              {myAuteur&&<div style={{fontSize:'10px',color:S.orange,marginTop:'3px'}}>⭐ {myAuteur.star_actor} · {myAuteur.film_ids.length} films</div>}
            </div>
            <button style={{...S.btn,background:myAuteur?'#12141A':S.orange,border:myAuteur?'1px solid #2A2F3C':'none',color:myAuteur?'#4A5168':'#000',fontSize:'10px',padding:'6px 14px'}} onClick={()=>setChipModal('auteur')}>{myAuteur?'Update':'Declare'}</button>
          </div>
        </div>
        {allChips.filter(c=>c.player_id!==profile.id&&(c.short_film_id||c.analyst_film_id)).length>0&&(
          <div style={{marginTop:'14px'}}>
            <div style={{fontSize:'10px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>LEAGUE CHIP ACTIVITY</div>
            {allChips.filter(c=>c.player_id!==profile.id).map(c=>{
              const p=players.find(pl=>pl.id===c.player_id)
              return(<div key={c.id} style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'6px'}}>
                {c.short_film_id&&<div style={{background:'#12141A',borderRadius:'6px',padding:'4px 10px',fontSize:'10px'}}><span style={{color:S.red}}>📉 {p?.name}</span><span style={{color:'#4A5168'}}> → {films.find(f=>f.id===c.short_film_id)?.title}</span>{c.short_result&&<span style={{color:c.short_result==='win'?S.green:S.red}}> {c.short_result==='win'?'✅':'❌'}</span>}</div>}
                {c.analyst_film_id&&<div style={{background:'#12141A',borderRadius:'6px',padding:'4px 10px',fontSize:'10px'}}><span style={{color:S.blue}}>🎯 {p?.name}</span><span style={{color:'#4A5168'}}> → {films.find(f=>f.id===c.analyst_film_id)?.title}</span>{c.analyst_result&&<span style={{color:c.analyst_result==='win'?S.green:S.red}}> {c.analyst_result==='win'?'✅':'❌'}</span>}</div>}
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
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'14px'}}>Grand League · Phase {ph} · W{leagueConfig.current_week}</div>
      <div style={{...S.card,marginBottom:'16px',overflowX:'auto'}}>
        <div style={{fontSize:'10px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px'}}>PHASE LEADERS</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px',minWidth:'260px'}}>
          {[1,2,3,4,5].map(p=>{
            const sc=[...players].map(pl=>({pl,pts:calcPhasePoints(pl.id,p)})).sort((a,b)=>b.pts-a.pts),leader=sc[0]
            return(<div key={p} style={{background:p===ph?S.gold+'15':'#12141A',border:`1px solid ${p===ph?S.gold+'33':'#2A2F3C'}`,borderRadius:'8px',padding:'7px',textAlign:'center'}}>
              <div style={{fontSize:'8px',color:p===ph?S.gold:'#4A5168',marginBottom:'4px'}}>PH{p}</div>
              {leader?.pts>0?(<><div style={{fontSize:'9px',fontWeight:600,color:players.find(pl=>pl.id===leader?.pl?.id)?.color||S.gold}}>{leader?.pl?.name}</div><div style={{fontSize:'11px',fontWeight:800,color:p===ph?S.gold:'#F2EEE8'}}>{leader?.pts}</div></>):<div style={{fontSize:'9px',color:'#4A5168'}}>—</div>}
            </div>)
          })}
        </div>
      </div>
      {[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id)).map((player,i)=>{
        const pts=calcPoints(player.id),rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`
        const pc=allChips.find(c=>c.player_id===player.id),pa=auteurDeclarations.find(a=>a.player_id===player.id&&a.phase===ph)
        return(
          <div key={player.id} style={{...S.card,display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}} onClick={()=>setProfileModal(player)}>
            <div style={{fontSize:'20px',minWidth:'28px'}}>{rank}</div>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:player.color||S.gold,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'13px',fontWeight:600,color:player.color||S.gold,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.name}</div>
              <div style={{display:'flex',gap:'4px',marginTop:'3px',flexWrap:'wrap'}}>
                <span style={{fontSize:'9px',color:'#4A5168'}}>Ph{ph}: {calcPhasePoints(player.id,ph)}pts · {cur}{budgetLeft(player.id)} left</span>
                {pc?.short_film_id&&<span style={{fontSize:'8px',color:S.red,padding:'1px 4px',background:S.red+'15',borderRadius:'3px'}}>📉</span>}
                {pc?.analyst_film_id&&<span style={{fontSize:'8px',color:S.blue,padding:'1px 4px',background:S.blue+'15',borderRadius:'3px'}}>🎯</span>}
                {pc?.recut_used&&<span style={{fontSize:'8px',color:S.purple,padding:'1px 4px',background:S.purple+'15',borderRadius:'3px'}}>🎬</span>}
                {pa&&<span style={{fontSize:'8px',color:S.orange,padding:'1px 4px',background:S.orange+'15',borderRadius:'3px'}}>🎭</span>}
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:'24px',fontWeight:800,color:i===0?S.gold:'#F2EEE8'}}>{pts}</div>
              <div style={{fontSize:'8px',color:'#4A5168'}}>GRAND PTS</div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── FEED PAGE ──
  const FeedPage=()=>{
    const getItem=(item)=>{
      const p=item.payload||{},pl=players.find(pl=>pl.id===item.user_id)
      const pName=p.player_name||pl?.name||'Someone',pCol=pl?.color||S.gold
      switch(item.type){
        case 'buy':return{icon:'🎬',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> acquired <span style={{color:'#F2EEE8',fontWeight:600}}>{p.film_title}</span> for <span style={{color:S.green}}>${p.price}M</span></>,col:S.green}
        case 'sell':return{icon:'💸',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> dropped <span style={{color:'#F2EEE8',fontWeight:600}}>{p.film_title}</span></>,col:S.gold}
        case 'chip_recut':return{icon:'🎬',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> activated <span style={{color:S.purple,fontWeight:700}}>THE RECUT</span></>,col:S.purple}
        case 'chip_short':return{icon:'📉',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> shorted <span style={{color:'#F2EEE8'}}>{p.film_title}</span> at <span style={{color:S.red}}>${p.prediction}M</span></>,col:S.red}
        case 'chip_analyst':return{icon:'🎯',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> went Analyst on <span style={{color:'#F2EEE8'}}>{p.film_title}</span> at <span style={{color:S.blue}}>${p.prediction}M</span></>,col:S.blue}
        case 'auteur':return{icon:'🎭',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> declared Auteur — <span style={{color:S.orange}}>{p.actor}</span> across {p.film_count} films</>,col:S.orange}
        case 'forecast':return{icon:'📊',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> forecast <span style={{color:'#F2EEE8'}}>{p.film_title}</span> at <span style={{color:S.blue}}>${p.predicted_m}M</span></>,col:S.blue}
        case 'oscar':return{icon:'🏆',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> locked Best Picture — <span style={{color:S.gold}}>{p.film_title}</span></>,col:S.gold}
        case 'trade_proposed':return{icon:'🔄',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> proposed a trade: <span style={{color:'#F2EEE8'}}>{p.my_film}</span> ↔ <span style={{color:S.blue}}>{p.their_film}</span></>,col:S.blue}
        case 'trade_accepted':return{icon:'✅',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> accepted a trade — gave <span style={{color:'#F2EEE8'}}>{p.film_given}</span>, got <span style={{color:S.green}}>{p.film_received}</span></>,col:S.green}
        default:return{icon:'📡',text:<><span style={{color:pCol,fontWeight:700}}>{pName}</span> did something</>,col:'#9AA0B2'}
      }
    }
    const grouped=activityFeed.reduce((acc,item)=>{
      const day=new Date(item.created_at).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})
      if(!acc[day])acc[day]=[];acc[day].push(item);return acc
    },{})
    return(
      <div>
        <div style={{fontSize:'17px',fontWeight:800,marginBottom:'4px'}}>League Feed</div>
        <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Real-time · updates live</div>
        {activityFeed.length===0&&<div style={{...S.card,textAlign:'center',padding:'40px'}}><div style={{fontSize:'28px',marginBottom:'10px'}}>📡</div><div style={{fontSize:'12px',color:'#4A5168'}}>No activity yet!</div></div>}
        {Object.entries(grouped).map(([day,items])=>(
          <div key={day}>
            <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px',marginTop:'16px'}}>{day.toUpperCase()}</div>
            {items.map(item=>{const{icon,text,col}=getItem(item);return(
              <div key={item.id} style={{...S.card,padding:'11px 14px',marginBottom:'6px',borderLeft:`3px solid ${col}44`,display:'flex',gap:'12px',alignItems:'flex-start'}}>
                <div style={{fontSize:'16px',flexShrink:0}}>{icon}</div>
                <div style={{flex:1}}><div style={{fontSize:'12px',lineHeight:1.5,color:'#C8C4BE'}}>{text}</div><div style={{fontSize:'9px',color:'#4A5168',marginTop:'4px'}}>{timeAgo(item.created_at)}</div></div>
              </div>
            )})}
          </div>
        ))}
      </div>
    )
  }

  // ── FORECASTER PAGE ──
  const ForecasterPage=()=>(
    <div>
      <div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>Forecaster</div>
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Best phase accuracy = +15pts · Best season = +50pts</div>
      {films.filter(f=>!results[f.id]).map(film=>{
        const mf=forecasts[film.id]
        return(<div key={film.id} style={{...S.card,display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
          <div style={{flex:2,minWidth:'120px'}}><div style={{fontSize:'12px',fontWeight:500}}>{film.title}</div><div style={{fontSize:'9px',color:'#4A5168'}}>Est ${film.estM}M · Ph{film.phase}</div></div>
          <input type="number" step="0.1" defaultValue={mf||''} placeholder="$M" id={`fc-${film.id}`} style={{...S.inp,width:'90px'}}/>
          <button style={{...S.btn,background:S.blue,color:'#fff',fontSize:'10px'}} onClick={()=>{const v=parseFloat(document.getElementById(`fc-${film.id}`).value);if(isNaN(v))return notify('Enter a number',S.red);saveForecast(film.id,v)}}>Lock In</button>
          {mf&&<div style={{fontSize:'11px',color:S.blue}}>${mf}M</div>}
        </div>)
      })}
      {films.filter(f=>results[f.id]).length>0&&(
        <div style={{marginTop:'20px'}}>
          <div style={{fontSize:'13px',fontWeight:700,marginBottom:'10px'}}>Results</div>
          {films.filter(f=>results[f.id]).map(film=>{
            const actual=results[film.id],pfc=allForecasts.filter(f=>f.film_id===film.id)
            return(<div key={film.id} style={{...S.card}}>
              <div style={{fontSize:'11px',fontWeight:600,marginBottom:'8px'}}>{film.title} <span style={{color:S.green}}>— ${actual}M</span></div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {pfc.map(fc=>{const p=players.find(pl=>pl.id===fc.player_id),pct=Math.round((Math.abs(fc.predicted_m-actual)/actual)*100);return(<div key={fc.id} style={{background:'#12141A',borderRadius:'6px',padding:'4px 10px',fontSize:'10px'}}><span style={{color:p?.color||S.gold}}>{p?.name}</span><span style={{color:'#4A5168'}}> ${fc.predicted_m}M </span><span style={{color:pct<=10?S.green:S.red}}>{pct<=10?'✅':''} {pct}% off</span></div>)})}
                {!pfc.length&&<div style={{fontSize:'10px',color:'#4A5168'}}>No predictions</div>}
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
      <div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>🏆 Oscar Mini Game</div>
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Predict Best Picture · correct = +75pts grand league</div>
      {myOscarPick?(
        <div style={{...S.card,border:`1px solid ${S.gold}44`}}>
          <div style={{fontSize:'12px',color:'#4A5168',marginBottom:'6px'}}>YOUR PICK</div>
          <div style={{fontSize:'18px',fontWeight:700,color:S.gold}}>{films.find(f=>f.id===myOscarPick.best_picture_film_id)?.title||'—'}</div>
          <div style={{fontSize:'10px',color:'#4A5168',marginTop:'4px'}}>{myOscarPick.correct===true?'✅ CORRECT +75pts':myOscarPick.correct===false?'❌ Incorrect':'Awaiting Oscar night'}</div>
        </div>
      ):(
        <div style={{...S.card}}>
          <div style={{fontSize:'12px',color:'#4A5168',marginBottom:'12px'}}>Locks immediately — cannot be changed</div>
          <select id="oscar-pick" style={{...S.inp,marginBottom:'12px'}}><option value="">Select a film...</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
          <button style={{...S.btn,background:S.gold,color:'#000',fontWeight:700,width:'100%',padding:'12px'}} onClick={()=>{const id=document.getElementById('oscar-pick').value;if(!id)return notify('Select a film',S.red);submitOscarPick(id)}}>🏆 Lock In</button>
        </div>
      )}
      {oscarPredictions.length>0&&(
        <div style={{marginTop:'16px'}}>
          <div style={{fontSize:'12px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px'}}>ALL PICKS</div>
          {oscarPredictions.map(op=>{const p=players.find(pl=>pl.id===op.player_id),f=films.find(fl=>fl.id===op.best_picture_film_id);return(<div key={op.id} style={{...S.card,display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:p?.color||S.gold}}/><div style={{flex:1,fontSize:'12px',color:p?.color||S.gold}}>{p?.name}</div><div style={{fontSize:'12px'}}>{f?.title||'—'}</div>{op.correct===true&&<span style={{color:S.green}}>✅ +75pts</span>}{op.correct===false&&<span style={{color:S.red}}>❌</span>}</div>)})}
        </div>
      )}
    </div>
  )

  // ── RESULTS PAGE ──
  const ResultsPage=()=>(
    <div>
      <div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>Enter Results</div>
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Opening weekend + weekly grosses + weekend winner</div>
      {films.map(film=>{
        const actual=results[film.id],weeks=weeklyGrosses[film.id]||{},lb=calcLegsBonus(actual,weeks[2]),isWinner=weekendWinners[film.week]===film.id
        return(<div key={film.id} style={{...S.card}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:actual!=null?'10px':'0'}}>
            <div style={{flex:2,minWidth:'120px'}}>
              <div style={{fontSize:'12px',fontWeight:500}}>{film.title} {isWinner&&'🥇'}</div>
              <div style={{fontSize:'9px',color:'#4A5168'}}>Est ${film.estM}M · IPO ${film.basePrice} · Ph{film.phase}</div>
            </div>
            <input type="number" step="0.1" defaultValue={actual||''} placeholder="Opening $M" id={`res-${film.id}`} style={{...S.inp,width:'85px'}}/>
            <button style={{...S.btn,background:S.green,color:'#000',fontSize:'10px',padding:'6px 10px'}} onClick={async()=>{
              const v=parseFloat(document.getElementById(`res-${film.id}`).value);if(isNaN(v))return notify('Enter a number',S.red)
              const nv=calcMarketValue(film,v)
              await dbUpsert('results','film_id',film.id,{actual_m:v})
              await dbUpsert('film_values','film_id',film.id,{current_value:nv})
              await resolveChips(film.id,v)
              await logActivity(session.user.id,'result',{film_title:film.title,actual_m:v})
              notify(`✅ ${film.title} · $${nv} · ${calcOpeningPts(film,v)}pts`,S.gold);loadData()
            }}>Save</button>
            <button style={{...S.btn,background:isWinner?S.gold:'#12141A',border:isWinner?'none':'1px solid #2A2F3C',color:isWinner?'#000':'#4A5168',fontSize:'9px',padding:'6px 8px'}}
              onClick={async()=>{
                if(isWinner){await supabase.from('weekend_winners').delete().eq('week',film.week)}
                else{const ex=await supabase.from('weekend_winners').select('id').eq('week',film.week).single();if(ex.data)await supabase.from('weekend_winners').update({film_id:film.id,phase:ph}).eq('week',film.week);else await supabase.from('weekend_winners').insert({film_id:film.id,week:film.week,phase:ph})}
                notify(isWinner?'Removed':`🥇 ${film.title} · +15pts`,S.gold);loadData()
              }}>{isWinner?'🥇 #1':'#1?'}</button>
            {actual!=null&&<div style={{fontSize:'10px',color:S.green}}>${actual}M → ${filmVal(film)} · {calcOpeningPts(film,actual)}pts</div>}
          </div>
          {actual!=null&&(
            <div style={{borderTop:'1px solid #1E222C',paddingTop:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px',flexWrap:'wrap'}}>
                <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px'}}>WEEKLY · 1pt/$1M (W1-3) · 1.1pts/$1M (W4+)</div>
                {lb>0&&<span style={{fontSize:'9px',color:S.green,padding:'1px 6px',background:S.green+'18',borderRadius:'4px'}}>🦵 Legs +25pts</span>}
              </div>
              <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                {[2,3,4,5,6,7,8].map(wk=>{
                  const rate=wk>=4?1.1:1
                  return(<div key={wk} style={{display:'flex',flexDirection:'column',gap:'3px',alignItems:'center'}}>
                    <div style={{fontSize:'8px',color:'#4A5168'}}>W{wk}{wk>=4?' ×1.1':''}</div>
                    <input type="number" step="0.1" placeholder="$M" defaultValue={weeks[wk]||''} id={`wk-${film.id}-${wk}`} style={{...S.inp,width:'58px',fontSize:'10px',padding:'4px 5px'}}/>
                    <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',fontSize:'8px',padding:'2px 5px'}} onClick={async()=>{const v=parseFloat(document.getElementById(`wk-${film.id}-${wk}`).value);if(isNaN(v))return;const{error}=await dbUpsertWeekly(film.id,wk,v);if(error)return notify(error.message,S.red);notify(`W${wk} saved`,S.gold);loadData()}}>Save</button>
                    {weeks[wk]&&<div style={{fontSize:'8px',color:S.blue}}>+{Math.round(Number(weeks[wk])*rate)}</div>}
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
      <div style={{fontSize:'17px',fontWeight:800,marginBottom:'16px'}}>⚙️ Commissioner Panel</div>
      <div style={{...S.card,marginBottom:'12px'}}>
        <div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSpacing:'1px'}}>LEAGUE CONTROLS</div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
          <div style={{fontSize:'11px'}}>W{leagueConfig.current_week} · Ph{ph} · {PHASE_NAMES[ph]}</div>
          <button style={{...S.btn,background:S.gold,color:'#000',fontSize:'10px'}} onClick={async()=>{await supabase.from('league_config').update({current_week:leagueConfig.current_week+1}).eq('id',1);notify(`Week ${leagueConfig.current_week+1}`,S.green);loadData()}}>Next Week →</button>
          <button style={{...S.btn,background:win?S.orange:S.purple,color:'#fff',fontSize:'10px'}} onClick={async()=>{const ni=new Date().toISOString();await supabase.from('league_config').update({phase_window_active:!win,phase_window_opened_at:!win?ni:null}).eq('id',1);notify(win?'Window closed':'🔓 72hr window open!',S.orange);loadData()}}>{win?'🔒 Close':'🔓 Open 72hr'}</button>
          <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:S.gold,fontSize:'10px'}} onClick={async()=>{if(!confirm(`Advance to Phase ${ph+1}?`))return;for(const p of players)await bankBudget(p.id,ph);await supabase.from('league_config').update({current_phase:ph+1,phase_window_active:false,phase_window_opened_at:null}).eq('id',1);notify(`Phase ${ph+1} started`,S.green);loadData()}}>Next Phase →</button>
        </div>
        <div style={{marginTop:'10px',display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {players.map(p=>(
            <div key={p.id} style={{background:'#12141A',borderRadius:'6px',padding:'5px 10px',fontSize:'10px'}}>
              <span style={{color:p.color||S.gold}}>{p.name}</span><span style={{color:'#4A5168'}}> · {cur}{budgetLeft(p.id)}M</span>
              {phaseBanked(p.id,ph)>0&&<span style={{color:S.orange}}> +{cur}{phaseBanked(p.id,ph)}M</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{...S.card,marginBottom:'12px',border:`1px solid ${S.red}33`}}>
        <div style={{fontSize:'11px',fontWeight:600,color:S.red,marginBottom:'8px',letterSpacing:'1px'}}>ROSTER MAINTENANCE</div>
        <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'10px'}}>Fix orphaned active roster rows from deleted films.</div>
        <button style={{...S.btn,background:'#12141A',border:`1px solid ${S.red}44`,color:S.red,fontSize:'10px'}} onClick={async()=>{
          const ids=new Set(films.map(f=>f.id)),orphans=rosters.filter(r=>r.active&&!ids.has(r.film_id))
          if(!orphans.length)return notify('No orphans found ✅',S.green)
          for(const o of orphans)await supabase.from('rosters').update({active:false}).eq('id',o.id)
          notify(`Fixed ${orphans.length} orphaned row${orphans.length>1?'s':''}`,S.green);loadData()
        }}>Scan & Fix Orphans ({rosters.filter(r=>r.active&&!films.find(f=>f.id===r.film_id)).length} found)</button>
      </div>
      <div style={{...S.card,marginBottom:'12px'}}>
        <div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSpacing:'1px'}}>OSCAR NIGHT</div>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          <select id="oscar-winner-select" style={{...S.inp,flex:1,minWidth:'180px'}}><option value="">Select winner...</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
          <button style={{...S.btn,background:S.gold,color:'#000',fontSize:'10px'}} onClick={async()=>{const id=document.getElementById('oscar-winner-select').value;if(!id)return;await supabase.from('league_config').update({best_picture_winner:id}).eq('id',1);for(const op of oscarPredictions)await supabase.from('oscar_predictions').update({correct:op.best_picture_film_id===id}).eq('player_id',op.player_id);notify(`🏆 ${films.find(f=>f.id===id)?.title}`,S.gold);loadData()}}>Set Winner</button>
        </div>
      </div>
      <div style={{...S.card,marginBottom:'12px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:S.gold,letterSpacing:'1px'}}>FILM MANAGEMENT</div>
          <button style={{...S.btn,background:S.green,color:'#000',fontSize:'10px'}} onClick={()=>setAddFilmModal(true)}>+ Add Film</button>
        </div>
        {[1,2,3,4,5].map(p=>{
          const pf=films.filter(f=>f.phase===p);if(!pf.length)return null
          return(<div key={p} style={{marginBottom:'12px'}}>
            <div style={{fontSize:'10px',color:p===ph?S.gold:'#4A5168',letterSpacing:'1px',marginBottom:'6px'}}>PHASE {p} — {PHASE_NAMES[p]}</div>
            {pf.map(film=>(<div key={film.id} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 0',borderBottom:'1px solid #1E222C',flexWrap:'wrap'}}>
              <div style={{flex:2,minWidth:'100px'}}><div style={{fontSize:'11px'}}>{film.title}</div><div style={{fontSize:'9px',color:'#4A5168'}}>W{film.week}</div></div>
              <div style={{display:'flex',gap:'4px',alignItems:'center',flexWrap:'wrap'}}>
                {[['IPO','basePrice',52],['EST','estM',52],['RT%','rt',45]].map(([lbl,fld,w])=>(
                  <div key={fld}><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>{lbl}</div><input type="number" defaultValue={film[fld]||''} id={`${fld}-${film.id}`} style={{...S.inp,width:`${w}px`,fontSize:'10px',padding:'3px 5px'}}/></div>
                ))}
                <div><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>AFF URL</div><input type="text" defaultValue={film.affiliateUrl||''} id={`aff-${film.id}`} placeholder="https://…" style={{...S.inp,width:'90px',fontSize:'9px',padding:'3px 5px'}}/></div>
                <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:S.gold,fontSize:'8px',marginTop:'10px',padding:'4px 8px'}} onClick={()=>{
                  const ni=parseInt(document.getElementById(`basePrice-${film.id}`).value),ne=parseInt(document.getElementById(`estM-${film.id}`).value),nr=parseInt(document.getElementById(`rt-${film.id}`).value)||null,na=document.getElementById(`aff-${film.id}`).value.trim()
                  setFilms(prev=>prev.map(f=>f.id===film.id?{...f,basePrice:ni,estM:ne,rt:nr,affiliateUrl:na}:f));notify(`Updated ${film.title}`,S.green)
                }}>Update</button>
                <button style={{...S.btn,background:'none',border:`1px solid ${S.red}33`,color:S.red,fontSize:'8px',marginTop:'10px',padding:'4px 8px'}} onClick={()=>{if(!confirm(`Remove ${film.title}?`))return;setFilms(prev=>prev.filter(f=>f.id!==film.id));notify(`Removed ${film.title}`)}}>Remove</button>
              </div>
            </div>))}
          </div>)
        })}
      </div>
      <div style={{...S.card}}>
        <div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSpacing:'1px'}}>CHIP OVERRIDES</div>
        {!allChips.length&&<div style={{fontSize:'11px',color:'#4A5168'}}>No chips yet.</div>}
        {allChips.map(c=>{const p=players.find(pl=>pl.id===c.player_id);return(<div key={c.id} style={{padding:'8px 0',borderBottom:'1px solid #1E222C'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:p?.color||S.gold,marginBottom:'4px'}}>{p?.name}</div>
          {c.short_film_id&&(<div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'4px',flexWrap:'wrap'}}>
            <span style={{fontSize:'10px',color:S.red}}>📉 {films.find(f=>f.id===c.short_film_id)?.title}</span>
            <span style={{fontSize:'10px',color:'#4A5168'}}>→ {c.short_result||'pending'}</span>
            {!c.short_result&&<><button style={{...S.btn,background:S.green,color:'#000',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({short_result:'win'}).eq('player_id',c.player_id);notify('Short WIN',S.green);loadData()}}>Win</button><button style={{...S.btn,background:S.red,color:'#fff',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({short_result:'lose'}).eq('player_id',c.player_id);notify('Short LOSE',S.red);loadData()}}>Lose</button></>}
          </div>)}
          {c.analyst_film_id&&(<div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:'10px',color:S.blue}}>🎯 {films.find(f=>f.id===c.analyst_film_id)?.title} · pred ${c.analyst_prediction}M</span>
            <span style={{fontSize:'10px',color:'#4A5168'}}>→ {c.analyst_result||'pending'}</span>
            {!c.analyst_result&&<><button style={{...S.btn,background:S.green,color:'#000',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({analyst_result:'win'}).eq('player_id',c.player_id);notify('Analyst WIN',S.green);loadData()}}>Win</button><button style={{...S.btn,background:S.red,color:'#fff',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({analyst_result:'lose'}).eq('player_id',c.player_id);notify('Analyst LOSE',S.red);loadData()}}>Lose</button></>}
          </div>)}
        </div>)})}
      </div>
    </div>
  )

  return(
    <div style={S.app}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div onClick={()=>setSidebarOpen(o=>!o)} style={{fontFamily:'sans-serif',fontSize:'20px',fontWeight:900,color:S.gold,letterSpacing:'-1px',cursor:'pointer',userSelect:'none',padding:'4px 6px',borderRadius:'6px',background:sidebarOpen?'#F0B42918':'none'}}>BOXD</div>
        {win&&wMs>0&&<div style={{background:S.orange+'22',border:`1px solid ${S.orange}44`,borderRadius:'6px',padding:'2px 8px',fontSize:'9px',color:S.orange}}>🔓 {wH}h {wM}m {wS}s</div>}
        <div style={{background:'#12141A',border:'1px solid #2A2F3C',borderRadius:'7px',padding:'3px 9px'}}>
          <div style={{fontSize:'7px',color:'#4A5168'}}>Ph{ph} BUDGET</div>
          <div style={{fontSize:'13px',fontWeight:700,color:myBudgetLeft<20?S.red:S.green}}>{cur}{myBudgetLeft}M</div>
        </div>
        {banked>0&&!isMobile&&<div style={{fontSize:'9px',color:S.orange}}>+{cur}{banked}M banked</div>}
        <div style={{fontSize:'9px',color:'#4A5168'}}>W{leagueConfig.current_week}</div>
        <div style={{marginLeft:'auto',display:'flex',gap:'6px',alignItems:'center'}}>
          <div style={{fontSize:'10px',color:'#4A5168',cursor:'pointer'}} onClick={()=>setProfileModal(players.find(p=>p.id===profile.id))}>{profile.name}</div>
          <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',fontSize:'8px',padding:'4px 8px'}} onClick={()=>supabase.auth.signOut()}>Out</button>
        </div>
      </div>

      <div style={{display:'flex',minHeight:'calc(100vh - 52px)'}}>
        {/* SIDEBAR */}
        {(sidebarOpen||!isMobile)&&(
          <div style={{width:'180px',background:'#0C0E12',borderRight:'1px solid #1E222C',padding:'8px',flexShrink:0,zIndex:150,position:isMobile?'fixed':'relative',top:isMobile?'52px':'0',left:0,bottom:0,overflowY:'auto'}}>
            {allNav.map(([id,ic,lb])=>(
              <div key={id} onClick={()=>{setPage(id);if(isMobile)setSidebarOpen(false)}} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px',borderRadius:'7px',cursor:'pointer',fontSize:'11px',marginBottom:'2px',background:page===id?'#F0B42914':'none',color:page===id?S.gold:'#6B7080'}}>
                <span>{ic}</span><span>{lb}</span>
                {id==='trades'&&pendingTradesForMe.length>0&&<span style={{marginLeft:'auto',background:S.red,color:'#fff',fontSize:'9px',padding:'1px 5px',borderRadius:'8px',fontWeight:700}}>{pendingTradesForMe.length}</span>}
                {id==='feed'&&activityFeed.length>0&&<span style={{marginLeft:'auto',background:S.blue+'33',color:S.blue,fontSize:'8px',padding:'1px 5px',borderRadius:'4px'}}>{activityFeed.length}</span>}
              </div>
            ))}
          </div>
        )}
        {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,top:'52px',background:'#00000088',zIndex:140}}/>}

        <div style={{...S.main,paddingBottom:'24px'}}>
          {page==='market'&&<MarketPage/>}
          {page==='roster'&&<RosterPage/>}
          {page==='chips'&&<ChipsPage/>}
          {page==='trades'&&<TradesPage/>}
          {page==='league'&&<LeaguePage/>}
          {page==='feed'&&<FeedPage/>}
          {page==='forecaster'&&<ForecasterPage/>}
          {page==='oscar'&&<OscarPage/>}
          {page==='results'&&<ResultsPage/>}
          {page==='commissioner'&&isCommissioner&&<CommissionerPage/>}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {notif&&<div style={{position:'fixed',bottom:'20px',right:'16px',background:'#0C0E12',border:`1px solid ${notif.col}`,borderRadius:'9px',padding:'10px 14px',fontSize:'11px',zIndex:600,maxWidth:'280px'}}>{notif.msg}</div>}

      {/* MODALS */}
      {scoreModal&&<ScoreBreakdownModal film={scoreModal.film} holding={scoreModal.holding} results={results} weeklyGrosses={weeklyGrosses} allChips={allChips} auteurDeclarations={auteurDeclarations} weekendWinners={weekendWinners} isEarlyBird={isEarlyBird} onClose={()=>setScoreModal(null)}/>}
      {filmDetailModal&&<FilmDetailModal film={filmDetailModal} profile={profile} players={players} results={results} allChips={allChips} onClose={()=>setFilmDetailModal(null)}/>}
      {profileModal&&<PlayerProfileModal player={profileModal} films={films} rosters={rosters} results={results} weeklyGrosses={weeklyGrosses} allChips={allChips} auteurDeclarations={auteurDeclarations} weekendWinners={weekendWinners} oscarPredictions={oscarPredictions} calcPoints={calcPoints} calcPhasePoints={calcPhasePoints} onClose={()=>setProfileModal(null)}/>}
      {tradeModal&&<TradeModal profile={profile} players={players} rosters={rosters} films={films} filmVal={filmVal} curPhase={curPhase} onClose={()=>setTradeModal(false)} notify={notify} onDone={()=>{setTradeModal(false);loadData();setPage('trades')}}/>}

      {/* TRAILER */}
      {trailerFilm&&(
        <div style={{position:'fixed',inset:0,background:'#000000EE',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'16px'}} onClick={()=>setTrailerFilm(null)}>
          <div style={{width:'100%',maxWidth:'800px'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
              <div style={{fontSize:'14px',fontWeight:700}}>{trailerFilm.title}</div>
              <button style={{background:'none',border:'1px solid #2A2F3C',color:'#4A5168',borderRadius:'6px',padding:'4px 12px',cursor:'pointer',fontFamily:'DM Mono,monospace',fontSize:'11px'}} onClick={()=>setTrailerFilm(null)}>✕</button>
            </div>
            <div style={{position:'relative',paddingBottom:'56.25%',height:0,overflow:'hidden',borderRadius:'10px'}}>
              <iframe src={`${trailerFilm.trailer}?autoplay=1`} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none',borderRadius:'10px'}} allow="autoplay; fullscreen" allowFullScreen/>
            </div>
          </div>
        </div>
      )}

      {/* ADD FILM MODAL */}
      {addFilmModal&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'16px'}} onClick={()=>setAddFilmModal(false)}>
          <div style={{background:'#0C0E12',border:'1px solid #2A2F3C',borderRadius:'14px',padding:'20px',width:'480px',maxWidth:'96vw',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'15px',fontWeight:800,marginBottom:'14px',color:S.green}}>+ Add Film</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
              {[['Title','title','text'],['Distributor','dist','text'],['Franchise','franchise','text'],['Star Actor','starActor','text'],['IPO $M','basePrice','number'],['Est $M','estM','number'],['RT%','rt','number'],['Week','week','number'],['Phase','phase','number']].map(([label,field,type])=>(
                <div key={field} style={{gridColumn:field==='title'||field==='dist'?'1/-1':'auto'}}>
                  <div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>{label.toUpperCase()}</div>
                  <input type={type} value={newFilm[field]||''} style={{...S.inp}} onChange={e=>setNewFilm(prev=>({...prev,[field]:type==='number'?parseFloat(e.target.value)||'':e.target.value}))}/>
                </div>
              ))}
              <div><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>GENRE</div><select value={newFilm.genre} style={{...S.inp}} onChange={e=>setNewFilm(prev=>({...prev,genre:e.target.value}))}>{Object.keys(GENRE_COL).map(g=><option key={g} value={g}>{g}</option>)}</select></div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',paddingTop:'16px'}}><input type="checkbox" checked={newFilm.sleeper} onChange={e=>setNewFilm(prev=>({...prev,sleeper:e.target.checked}))}/><label style={{fontSize:'11px',color:'#4A5168'}}>Sleeper</label></div>
              <div style={{gridColumn:'1/-1'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>TRAILER URL</div><input type="text" placeholder="https://youtube.com/embed/…" value={newFilm.trailer} style={{...S.inp}} onChange={e=>setNewFilm(prev=>({...prev,trailer:e.target.value}))}/></div>
              <div style={{gridColumn:'1/-1'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>AFFILIATE URL</div><input type="text" placeholder="https://odeon.co.uk/…" value={newFilm.affiliateUrl} style={{...S.inp}} onChange={e=>setNewFilm(prev=>({...prev,affiliateUrl:e.target.value}))}/></div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1}} onClick={()=>setAddFilmModal(false)}>Cancel</button>
              <button style={{...S.btn,background:S.green,color:'#000',flex:1,fontWeight:700}} onClick={()=>{
                if(!newFilm.title||!newFilm.dist)return notify('Title and distributor required',S.red)
                const film={...newFilm,id:'f'+Date.now().toString(36),basePrice:Number(newFilm.basePrice)||20,estM:Number(newFilm.estM)||30,rt:newFilm.rt!==''?Number(newFilm.rt):null,week:Number(newFilm.week)||1,phase:Number(newFilm.phase)||1,franchise:newFilm.franchise||null,starActor:newFilm.starActor||null,affiliateUrl:newFilm.affiliateUrl||'',tmdbId:null}
                setFilms(prev=>[...prev,film]);setAddFilmModal(false);notify(`✅ ${film.title} added`,S.green)
              }}>Add Film</button>
            </div>
          </div>
        </div>
      )}

      {/* CHIP MODALS */}
      {chipModal&&(
        <div style={{position:'fixed',inset:0,background:'#000000CC',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:700}} onClick={()=>setChipModal(null)}>
          <div style={{background:'#0C0E12',border:'1px solid #2A2F3C',borderRadius:'16px 16px 0 0',padding:'20px',width:'100%',maxWidth:'480px',maxHeight:'85vh',overflowY:'auto',paddingBottom:'calc(20px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin:'0 auto 16px'}}/>
            {chipModal==='short'&&(<div>
              <div style={{fontSize:'16px',fontWeight:800,color:S.red,marginBottom:'6px'}}>📉 The Short</div>
              <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Under 60% of estimate = +100pts. Hits = −30pts.</div>
              <div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>FILM</div><select id="short-film" style={{...S.inp}}>{films.filter(f=>!results[f.id]&&!allChips.find(c=>c.short_film_id===f.id)).map(f=><option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>)}</select></div>
              <div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>PREDICTION ($M)</div><input type="number" id="short-pred" placeholder="e.g. 18" style={{...S.inp}}/></div>
              <div style={{display:'flex',gap:'8px'}}><button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,padding:'12px'}} onClick={()=>setChipModal(null)}>Cancel</button><button style={{...S.btn,background:S.red,color:'#fff',flex:1,padding:'12px'}} onClick={()=>{const fid=document.getElementById('short-film').value,pred=parseFloat(document.getElementById('short-pred').value);activateShort(fid,pred)}}>Confirm</button></div>
            </div>)}
            {chipModal==='analyst'&&(<div>
              <div style={{fontSize:'16px',fontWeight:800,color:S.blue,marginBottom:'6px'}}>🎯 The Analyst</div>
              <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Predict opening ±10%. Correct = +60pts. Must own the film.</div>
              <div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>FILM (owned)</div><select id="analyst-film" style={{...S.inp}}>{myPhaseRoster.filter(r=>!results[r.film_id]&&!allChips.find(c=>c.analyst_film_id===r.film_id)).map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>:null})}</select></div>
              <div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>PREDICTION ($M)</div><input type="number" id="analyst-pred" placeholder="e.g. 92" style={{...S.inp}}/></div>
              <div style={{display:'flex',gap:'8px'}}><button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,padding:'12px'}} onClick={()=>setChipModal(null)}>Cancel</button><button style={{...S.btn,background:S.blue,color:'#fff',flex:1,padding:'12px'}} onClick={()=>{const fid=document.getElementById('analyst-film').value,pred=parseFloat(document.getElementById('analyst-pred').value);if(isNaN(pred))return notify('Enter a prediction',S.red);activateAnalyst(fid,pred)}}>Confirm</button></div>
            </div>)}
            {chipModal==='auteur'&&(<div>
              <div style={{fontSize:'16px',fontWeight:800,color:S.orange,marginBottom:'6px'}}>🎭 The Auteur</div>
              <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>2+ films, same star actor. Each earns +10% opening points.</div>
              <div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>STAR ACTOR</div><input type="text" value={auteurActor} onChange={e=>setAuteurActor(e.target.value)} placeholder="e.g. Tom Cruise" style={{...S.inp}}/></div>
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>SELECT FILMS (min 2)</div>
                {myPhaseRoster.map(r=>{const f=films.find(fl=>fl.id===r.film_id);if(!f)return null;const checked=auteurFilms.includes(f.id);return(
                  <div key={r.film_id} onClick={()=>setAuteurFilms(prev=>prev.includes(f.id)?prev.filter(x=>x!==f.id):[...prev,f.id])} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',fontSize:'12px',padding:'10px',background:checked?S.orange+'22':'#12141A',borderRadius:'7px',border:`1px solid ${checked?S.orange+'66':'#2A2F3C'}`,marginBottom:'6px'}}>
                    <div style={{width:'18px',height:'18px',borderRadius:'4px',background:checked?S.orange:'transparent',border:`2px solid ${checked?S.orange:'#4A5168'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{checked&&<span style={{color:'#000',fontSize:'11px',fontWeight:900}}>✓</span>}</div>
                    {f.title}
                  </div>
                )})}
              </div>
              <div style={{display:'flex',gap:'8px'}}><button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,padding:'12px'}} onClick={()=>{setChipModal(null);setAuteurActor('');setAuteurFilms([])}}>Cancel</button><button style={{...S.btn,background:S.orange,color:'#000',flex:1,fontWeight:700,padding:'12px'}} onClick={()=>{if(!auteurActor.trim())return notify('Enter actor name',S.red);submitAuteur(auteurActor.trim(),auteurFilms)}}>Declare</button></div>
            </div>)}
          </div>
        </div>
      )}
    </div>
  )
}

function Login(){
  const [email,setEmail]=useState(''),[sent,setSent]=useState(false),[loading,setLoading]=useState(false)
  const go=async e=>{e.preventDefault();setLoading(true);const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'https://boxd-league-v2.vercel.app'}});if(error)alert(error.message);else setSent(true);setLoading(false)}
  if(sent)return<div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace'}}><div style={{textAlign:'center'}}><div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'16px'}}>BOXD</div><div style={{color:'#F2EEE8'}}>Check your email</div><div style={{color:'#4A5168',fontSize:'12px',marginTop:'6px'}}>{email}</div></div></div>
  return(
    <div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'320px'}}>
        <div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'8px'}}>BOXD</div>
        <div style={{color:'#4A5168',fontSize:'11px',letterSpacing:'3px',marginBottom:'32px'}}>FANTASY BOX OFFICE</div>
        <form onSubmit={go}>
          <input type="email" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'white',borderRadius:'8px',padding:'14px',fontSize:'13px',fontFamily:'monospace',marginBottom:'10px',outline:'none',boxSizing:'border-box'}}/>
          <button type="submit" disabled={loading} style={{width:'100%',background:'#F0B429',color:'#000',border:'none',borderRadius:'8px',padding:'14px',fontSize:'12px',fontWeight:700,cursor:'pointer',letterSpacing:'1px',fontFamily:'monospace'}}>{loading?'SENDING...':'SEND MAGIC LINK'}</button>
        </form>
      </div>
    </div>
  )
}

function CreateProfile({session,onCreated,notify}){
  const [name,setName]=useState(''),[loading,setLoading]=useState(false)
  const COLORS=['#F0B429','#2DD67A','#FF5C8A','#4D9EFF','#FF8C3D','#A855F7']
  const [color,setColor]=useState(COLORS[0])
  const go=async e=>{
    e.preventDefault();if(!name.trim())return;setLoading(true)
    const{error}=await supabase.from('profiles').insert({id:session.user.id,name:name.trim(),color})
    if(error){notify(error.message,'#FF4757');setLoading(false);return}
    onCreated()
  }
  return(
    <div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'320px'}}>
        <div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'8px'}}>BOXD</div>
        <div style={{color:'#F2EEE8',marginBottom:'6px',fontSize:'14px'}}>Create your profile</div>
        <div style={{color:'#4A5168',fontSize:'11px',marginBottom:'24px'}}>{session.user.email}</div>
        <form onSubmit={go}>
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required style={{width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'white',borderRadius:'8px',padding:'14px',fontSize:'13px',fontFamily:'monospace',marginBottom:'14px',outline:'none',boxSizing:'border-box'}}/>
          <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px'}}>PICK YOUR COLOUR</div>
          <div style={{display:'flex',gap:'10px',marginBottom:'24px'}}>{COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:'32px',height:'32px',borderRadius:'50%',background:c,cursor:'pointer',border:color===c?'3px solid white':'3px solid transparent'}}/>)}</div>
          <button type="submit" disabled={loading} style={{width:'100%',background:'#F0B429',color:'#000',border:'none',borderRadius:'8px',padding:'14px',fontSize:'12px',fontWeight:700,cursor:'pointer',letterSpacing:'1px',fontFamily:'monospace'}}>{loading?'CREATING...':'JOIN LEAGUE'}</button>
        </form>
      </div>
    </div>
  )
}
