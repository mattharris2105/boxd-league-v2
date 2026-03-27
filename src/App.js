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
  gold: '#F0B429', green: '#2DD67A', red: '#FF4757', blue: '#4D9EFF', purple: '#A855F7', orange: '#FF8C3D',
}

const GENRE_COL = {
  Action:'#F4845F', Horror:'#C77DFF', Drama:'#74C0FC', Family:'#80ED99',
  'Sci-Fi':'#4D9EFF', Animation:'#FF9F43', Comedy:'#F5C842', Thriller:'#FF5C8A',
}

const COMMISSIONER_EMAIL = 'mattharris2105@gmail.com'
const EARLY_BIRD_WEEKS = 4
const MAX_ROSTER = 6

// Tiered phase budgets
const PHASE_BUDGETS = { 1: 80, 2: 150, 3: 80, 4: 100, 5: 120 }

const PHASE_NAMES = {
  1: 'Dead Zone', 2: 'Summer Slate', 3: 'Horror Window', 4: 'Awards Season', 5: 'Oscar Sprint'
}

const FILMS_DEFAULT = [
  {id:'f001',title:'We Bury the Dead',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,phase:1,releaseDate:'2 Jan',week:1,basePrice:8,estM:14,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f002',title:'Greenland 2: Migration',dist:'Lionsgate',genre:'Action',franchise:'Greenland',starActor:'Gerard Butler',phase:1,releaseDate:'9 Jan',week:1,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f003',title:'Primate',dist:'Universal',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'9 Jan',week:1,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f004',title:'28 Years Later: The Bone Temple',dist:'Sony',genre:'Horror',franchise:'28 Days',starActor:'Jack O\'Connell',phase:1,releaseDate:'16 Jan',week:2,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f005',title:'Dead Man\'s Wire',dist:'WB',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'16 Jan',week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f006',title:'Killer Whale',dist:'Paramount',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'16 Jan',week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f007',title:'Night Patrol',dist:'Sony',genre:'Action',franchise:null,starActor:null,phase:1,releaseDate:'16 Jan',week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f008',title:'Return to Silent Hill',dist:'Sony',genre:'Horror',franchise:'Silent Hill',starActor:null,phase:1,releaseDate:'23 Jan',week:3,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f009',title:'Mercy',dist:'Netflix',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'23 Jan',week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f010',title:'Send Help',dist:'Universal',genre:'Horror',franchise:null,starActor:'Rachel McAdams',phase:1,releaseDate:'23 Jan',week:3,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f011',title:'Iron Lung',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:1,releaseDate:'30 Jan',week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f012',title:'The Strangers: Chapter 3',dist:'Lionsgate',genre:'Horror',franchise:'The Strangers',starActor:null,phase:1,releaseDate:'6 Feb',week:5,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f013',title:'Dracula: A Love Tale',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,releaseDate:'6 Feb',week:5,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f014',title:'Whistle',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'6 Feb',week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f015',title:'Good Luck Have Fun Don\'t Die',dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:null,phase:1,releaseDate:'13 Feb',week:5,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f016',title:'Cold Storage',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'13 Feb',week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f017',title:'GOAT',dist:'Sony Animation',genre:'Animation',franchise:null,starActor:null,phase:1,releaseDate:'13 Feb',week:5,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f018',title:'Wuthering Heights',dist:'WB',genre:'Drama',franchise:null,starActor:'Margot Robbie',phase:1,releaseDate:'13 Feb',week:6,basePrice:32,estM:58,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f019',title:'Crime 101',dist:'A24',genre:'Thriller',franchise:null,starActor:'Glen Powell',phase:1,releaseDate:'13 Feb',week:6,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f020',title:'Psycho Killer',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,releaseDate:'20 Feb',week:7,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f021',title:'I Can Only Imagine 2',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'20 Feb',week:7,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f022',title:'Dreams',dist:'Universal',genre:'Drama',franchise:null,starActor:'Glen Powell',phase:1,releaseDate:'27 Feb',week:7,basePrice:18,estM:34,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f023',title:'Scream 7',dist:'Paramount',genre:'Horror',franchise:'Scream',starActor:'Neve Campbell',phase:1,releaseDate:'27 Feb',week:8,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f024',title:'Dr Seuss\' The Cat in the Hat',dist:'WB',genre:'Animation',franchise:null,starActor:'Bill Hader',phase:1,releaseDate:'27 Feb',week:8,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f025',title:'Hoppers',dist:'Disney/Pixar',genre:'Animation',franchise:null,starActor:null,phase:1,releaseDate:'6 Mar',week:9,basePrice:26,estM:50,rt:97,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f026',title:'The Bride!',dist:'Universal',genre:'Horror',franchise:null,starActor:'Christian Bale',phase:1,releaseDate:'6 Mar',week:9,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f027',title:'Peaky Blinders: The Immortal Man',dist:'Netflix',genre:'Drama',franchise:'Peaky Blinders',starActor:'Cillian Murphy',phase:1,releaseDate:'6 Mar',week:9,basePrice:14,estM:26,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f028',title:'The Breadwinner',dist:'GKIDS',genre:'Animation',franchise:null,starActor:null,phase:1,releaseDate:'13 Mar',week:10,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f029',title:'Reminders of Him',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'13 Mar',week:10,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f030',title:'Project Hail Mary',dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:'Ryan Gosling',phase:1,releaseDate:'20 Mar',week:11,basePrice:55,estM:80,rt:95,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f031',title:'They Will Kill You',dist:'Amazon MGM',genre:'Horror',franchise:null,starActor:'Zazie Beetz',phase:1,releaseDate:'27 Mar',week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f032',title:'Romeo + Juliet (30th Anniversary)',dist:'Paramount',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'27 Mar',week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f033',title:'Splittsville',dist:'Lionsgate',genre:'Comedy',franchise:null,starActor:null,phase:1,releaseDate:'27 Mar',week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f034',title:'The Magic Faraway Tree',dist:'StudioCanal',genre:'Family',franchise:null,starActor:null,phase:1,releaseDate:'27 Mar',week:11,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f035',title:'Bluey At The Cinema: Playdates With Friends',dist:'Lionsgate',genre:'Family',franchise:'Bluey',starActor:null,phase:1,releaseDate:'27 Mar',week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f036',title:'Ready or Not 2: Here I Come',dist:'Searchlight',genre:'Horror',franchise:null,starActor:'Samara Weaving',phase:1,releaseDate:'27 Mar',week:11,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f037',title:'Forbidden Fruits',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:'Lola Tung',phase:1,releaseDate:'27 Mar',week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f038',title:'The Super Mario Galaxy Movie',dist:'Universal/Illumination',genre:'Animation',franchise:'Mario',starActor:'Jack Black',phase:1,releaseDate:'1 Apr',week:13,basePrice:52,estM:100,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f039',title:'The Drama',dist:'A24',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'3 Apr',week:13,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f040',title:'Fuze',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'3 Apr',week:13,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f041',title:'Amelie (25th Anniversary Re-release)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'3 Apr',week:13,basePrice:6,estM:10,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f042',title:'You Me & Tuscany',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:1,releaseDate:'10 Apr',week:14,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f043',title:'Undertone',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'10 Apr',week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f044',title:'California Schemin\'',dist:'A24',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'10 Apr',week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f045',title:'Father Mother Sister Brother',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'10 Apr',week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f046',title:'Lee Cronin\'s The Mummy',dist:'Universal',genre:'Horror',franchise:'Mummy',starActor:'Jack Reynor',phase:1,releaseDate:'17 Apr',week:15,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f047',title:'Glenorchy',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'17 Apr',week:15,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f048',title:'Michael',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jaafar Jackson',phase:1,releaseDate:'22 Apr',week:16,basePrice:26,estM:48,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f049',title:'Exit 8',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:1,releaseDate:'24 Apr',week:16,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f050',title:'Mother Mary',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,releaseDate:'24 Apr',week:16,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f051',title:'Hiroyuki',dist:'Sony',genre:'Family',franchise:null,starActor:null,phase:1,releaseDate:'24 Apr',week:16,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f052',title:'The Devil Wears Prada 2',dist:'Disney/20th',genre:'Comedy',franchise:'Prada',starActor:'Meryl Streep',phase:2,releaseDate:'1 May',week:17,basePrice:50,estM:80,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f053',title:'Hokum',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:2,releaseDate:'1 May',week:17,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f054',title:'Iron Maiden: Burning Ambition',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Iron Maiden',phase:2,releaseDate:'7 May',week:17,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f055',title:'Mortal Kombat II',dist:'WB/New Line',genre:'Action',franchise:'Mortal Kombat',starActor:'Lewis Tan',phase:2,releaseDate:'8 May',week:18,basePrice:28,estM:52,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f056',title:'The Sheep Detectives',dist:'Lionsgate',genre:'Family',franchise:null,starActor:null,phase:2,releaseDate:'8 May',week:18,basePrice:10,estM:18,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f057',title:'Billie Eilish: Hit Me Hard And Soft Tour',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Billie Eilish',phase:2,releaseDate:'8 May',week:18,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f058',title:'Top Gun (40th Anniversary)',dist:'Paramount',genre:'Action',franchise:'Top Gun',starActor:'Tom Cruise',phase:2,releaseDate:'13 May',week:19,basePrice:14,estM:26,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f059',title:'Obsession',dist:'Focus',genre:'Thriller',franchise:null,starActor:null,phase:2,releaseDate:'15 May',week:19,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f060',title:'Normal',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:2,releaseDate:'15 May',week:19,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f061',title:'The Christophers',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,releaseDate:'15 May',week:19,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f062',title:'500 Miles (Ireland/N.Ireland)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,releaseDate:'15 May',week:19,basePrice:6,estM:10,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f063',title:'Charlie The Wonderdog',dist:'Universal',genre:'Family',franchise:null,starActor:null,phase:2,releaseDate:'22 May',week:20,basePrice:8,estM:14,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f064',title:'The Mandalorian & Grogu',dist:'Disney/Lucasfilm',genre:'Action',franchise:'Star Wars',starActor:'Pedro Pascal',phase:2,releaseDate:'22 May',week:20,basePrice:70,estM:135,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f065',title:'Finding Emily',dist:'Paramount',genre:'Comedy',franchise:null,starActor:null,phase:2,releaseDate:'22 May',week:20,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f066',title:'Passenger',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,releaseDate:'22 May',week:20,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f067',title:'Tom & Jerry: Forbidden Compass HFSS',dist:'WB',genre:'Animation',franchise:'Tom & Jerry',starActor:null,phase:2,releaseDate:'22 May',week:20,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f068',title:'Power Ballad',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:2,releaseDate:'29 May',week:21,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f069',title:'Tuner',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,releaseDate:'29 May',week:21,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f070',title:'Savage House',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:null,phase:2,releaseDate:'5 Jun',week:22,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f071',title:'Masters of the Universe',dist:'Amazon MGM',genre:'Action',franchise:'MOTU',starActor:'Nicholas Galitzine',phase:2,releaseDate:'5 Jun',week:22,basePrice:35,estM:65,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f072',title:'Scary Movie 6',dist:'Paramount',genre:'Comedy',franchise:'Scary Movie',starActor:null,phase:2,releaseDate:'5 Jun',week:22,basePrice:12,estM:22,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f073',title:'Animal Friends',dist:'Universal',genre:'Animation',franchise:null,starActor:null,phase:2,releaseDate:'5 Jun',week:22,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f074',title:'Disclosure Day',dist:'Sony',genre:'Sci-Fi',franchise:null,starActor:null,phase:2,releaseDate:'12 Jun',week:23,basePrice:20,estM:38,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f075',title:'Toy Story 5',dist:'Disney/Pixar',genre:'Animation',franchise:'Toy Story',starActor:'Tom Hanks',phase:2,releaseDate:'19 Jun',week:24,basePrice:75,estM:145,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f076',title:'Supergirl',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Milly Alcock',phase:2,releaseDate:'26 Jun',week:25,basePrice:52,estM:98,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f077',title:'Untitled Jackass Event Film',dist:'Paramount',genre:'Comedy',franchise:'Jackass',starActor:null,phase:2,releaseDate:'26 Jun',week:25,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f078',title:'500 Miles (England/Scotland/Wales)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,releaseDate:'26 Jun',week:25,basePrice:8,estM:16,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f079',title:'Minions & Monsters',dist:'Universal/Illumination',genre:'Animation',franchise:'Despicable Me',starActor:'Steve Carell',phase:2,releaseDate:'1 Jul',week:26,basePrice:58,estM:110,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f080',title:'The Movie',dist:'TBC',genre:'Action',franchise:null,starActor:null,phase:2,releaseDate:'10 Jul',week:27,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f081',title:'Moana (Live Action)',dist:'Disney',genre:'Family',franchise:'Moana',starActor:'Dwayne Johnson',phase:2,releaseDate:'10 Jul',week:27,basePrice:62,estM:118,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f082',title:'Alpha',dist:'Sony',genre:'Action',franchise:null,starActor:'Michael B Jordan',phase:2,releaseDate:'10 Jul',week:27,basePrice:18,estM:32,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f083',title:'The Odyssey',dist:'Universal/Nolan',genre:'Drama',franchise:null,starActor:'Matt Damon',phase:2,releaseDate:'10 Jul',week:27,basePrice:60,estM:115,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f084',title:'Cut Off',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:2,releaseDate:'10 Jul',week:27,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f085',title:'Evil Dead Burn',dist:'Sony',genre:'Horror',franchise:'Evil Dead',starActor:null,phase:2,releaseDate:'10 Jul',week:27,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f086',title:'Spider-Man: Brand New Day',dist:'Sony/Marvel',genre:'Action',franchise:'Spider-Man',starActor:'Tom Holland',phase:2,releaseDate:'10 Jul',week:27,basePrice:85,estM:165,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f087',title:'Super Troopers 3',dist:'Fox',genre:'Comedy',franchise:'Super Troopers',starActor:null,phase:2,releaseDate:'7 Aug',week:31,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f088',title:'Fall 2',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:2,releaseDate:'7 Aug',week:31,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f089',title:'Paw Patrol: The Dino Movie HFSS',dist:'Paramount',genre:'Family',franchise:'Paw Patrol',starActor:null,phase:2,releaseDate:'14 Aug',week:32,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f090',title:'Flowervale Street',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:2,releaseDate:'14 Aug',week:32,basePrice:7,estM:12,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f091',title:'The End of Oak Street',dist:'Universal',genre:'Adventure',franchise:null,starActor:null,phase:2,releaseDate:'21 Aug',week:33,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f092',title:'Insidious: The Bleeding World',dist:'Sony/Blumhouse',genre:'Horror',franchise:'Insidious',starActor:'Lin Shaye',phase:2,releaseDate:'21 Aug',week:33,basePrice:14,estM:28,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f093',title:'Mutiny',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,releaseDate:'21 Aug',week:33,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f094',title:'Spa Weekend',dist:'Sony',genre:'Comedy',franchise:null,starActor:null,phase:2,releaseDate:'21 Aug',week:33,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f095',title:'Teenage Sex and Death at Camp Miasma',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:2,releaseDate:'21 Aug',week:33,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f096',title:'The Dog Stars',dist:'20th Century',genre:'Sci-Fi',franchise:null,starActor:'Jacob Elordi',phase:2,releaseDate:'21 Aug',week:33,basePrice:18,estM:34,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f097',title:'Cliffhanger',dist:'Sony',genre:'Action',franchise:null,starActor:null,phase:2,releaseDate:'21 Aug',week:33,basePrice:18,estM:34,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f098',title:'One Night Only',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:2,releaseDate:'21 Aug',week:33,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f099',title:'How to Rob a Bank',dist:'Netflix',genre:'Comedy',franchise:null,starActor:null,phase:3,releaseDate:'4 Sep',week:35,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f100',title:'Pressure',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:3,releaseDate:'9 Sep',week:36,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f101',title:'A Practical Magic Film',dist:'WB',genre:'Horror',franchise:'Practical Magic',starActor:'Sandra Bullock',phase:3,releaseDate:'11 Sep',week:36,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f102',title:'Clayface',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Tom Rhys Harries',phase:3,releaseDate:'11 Sep',week:36,basePrice:30,estM:55,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f103',title:'Resident Evil',dist:'Sony',genre:'Horror',franchise:'Resident Evil',starActor:null,phase:3,releaseDate:'18 Sep',week:37,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f104',title:'Bad Apples',dist:'Paramount',genre:'Horror',franchise:null,starActor:null,phase:3,releaseDate:'18 Sep',week:37,basePrice:8,estM:16,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f105',title:'Sense and Sensibility',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:3,releaseDate:'25 Sep',week:38,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f106',title:'Avengers: Endgame (Re-release)',dist:'Disney',genre:'Action',franchise:'MCU',starActor:'Robert Downey Jr',phase:3,releaseDate:'25 Sep',week:38,basePrice:15,estM:28,rt:96,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f107',title:'Verity',dist:'Amazon MGM',genre:'Thriller',franchise:null,starActor:'Blake Lively',phase:3,releaseDate:'2 Oct',week:39,basePrice:16,estM:30,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f108',title:'Digger',dist:'Paramount',genre:'Comedy',franchise:null,starActor:'Tom Cruise',phase:3,releaseDate:'2 Oct',week:39,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f109',title:'The Social Reckoning',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jeremy Strong',phase:3,releaseDate:'9 Oct',week:40,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f110',title:'Other Mommy',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:null,phase:3,releaseDate:'9 Oct',week:40,basePrice:8,estM:16,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f111',title:'The Legend of Aang',dist:'Paramount',genre:'Animation',franchise:'Avatar: TLA',starActor:'Eric Nam',phase:3,releaseDate:'9 Oct',week:40,basePrice:35,estM:65,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f112',title:'Street Fighter',dist:'Paramount',genre:'Action',franchise:'Street Fighter',starActor:'Andrew Koji',phase:3,releaseDate:'16 Oct',week:41,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f113',title:'Whalefall',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:3,releaseDate:'16 Oct',week:41,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f114',title:'Wildwood',dist:'Focus',genre:'Adventure',franchise:null,starActor:null,phase:3,releaseDate:'16 Oct',week:41,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f115',title:'Forgotten Island',dist:'Universal',genre:'Family',franchise:null,starActor:null,phase:3,releaseDate:'23 Oct',week:42,basePrice:16,estM:28,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f116',title:'Wife & Dog',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:3,releaseDate:'23 Oct',week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f117',title:'Clayface (Wide)',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Naomi Ackie',phase:3,releaseDate:'23 Oct',week:42,basePrice:28,estM:52,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f118',title:'Ghosts: The Possession of Button House',dist:'Lionsgate',genre:'Horror',franchise:'Ghosts',starActor:null,phase:3,releaseDate:'23 Oct',week:42,basePrice:10,estM:18,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f119',title:'Animal',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:3,releaseDate:'23 Oct',week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f120',title:'Tad and the Magic Lamp',dist:'Paramount',genre:'Animation',franchise:'Tad',starActor:null,phase:3,releaseDate:'23 Oct',week:42,basePrice:8,estM:14,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f121',title:'Remain',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:3,releaseDate:'23 Oct',week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f122',title:'Terrifier 4',dist:'Cineverse',genre:'Horror',franchise:'Terrifier',starActor:null,phase:3,releaseDate:'23 Oct',week:42,basePrice:10,estM:20,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f123',title:'Wild Horse Nine',dist:'WDi',genre:'Drama',franchise:null,starActor:null,phase:4,releaseDate:'6 Nov',week:43,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f124',title:'The Cat in the Hat HFSS',dist:'WB',genre:'Animation',franchise:null,starActor:'Bill Hader',phase:4,releaseDate:'6 Nov',week:43,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f125',title:'The Great Beyond',dist:'Searchlight',genre:'Drama',franchise:null,starActor:null,phase:4,releaseDate:'13 Nov',week:45,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f126',title:'Ebenezer: A Christmas Carol',dist:'Disney',genre:'Animation',franchise:null,starActor:null,phase:4,releaseDate:'13 Nov',week:45,basePrice:14,estM:26,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f127',title:'The Hunger Games: Sunrise on the Reaping',dist:'Lionsgate',genre:'Action',franchise:'Hunger Games',starActor:'Joseph Zada',phase:4,releaseDate:'20 Nov',week:46,basePrice:58,estM:110,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f128',title:'I Play Rocky',dist:'Universal',genre:'Drama',franchise:null,starActor:null,phase:4,releaseDate:'20 Nov',week:46,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f129',title:'Focker In-Law',dist:'Paramount',genre:'Comedy',franchise:'Fockers',starActor:'Ben Stiller',phase:4,releaseDate:'20 Nov',week:46,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f130',title:'Disney\'s Hexed HFSS',dist:'Disney',genre:'Horror',franchise:null,starActor:null,phase:4,releaseDate:'27 Nov',week:47,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f131',title:'Narnia: The Magician\'s Nephew',dist:'Netflix/Sony',genre:'Adventure',franchise:'Narnia',starActor:'Daniel Craig',phase:4,releaseDate:'27 Nov',week:47,basePrice:50,estM:95,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f132',title:'Violent Night 2',dist:'Universal',genre:'Action',franchise:'Violent Night',starActor:'David Harbour',phase:4,releaseDate:'4 Dec',week:48,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f133',title:'Jumanji 3',dist:'Sony',genre:'Action',franchise:'Jumanji',starActor:'Dwayne Johnson',phase:4,releaseDate:'11 Dec',week:49,basePrice:44,estM:82,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f134',title:'Dune: Part Three',dist:'WB',genre:'Sci-Fi',franchise:'Dune',starActor:'Timothée Chalamet',phase:4,releaseDate:'18 Dec',week:49,basePrice:80,estM:155,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f135',title:'Avengers: Doomsday',dist:'Marvel/Disney',genre:'Action',franchise:'MCU',starActor:'Robert Downey Jr',phase:4,releaseDate:'18 Dec',week:50,basePrice:98,estM:210,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f136',title:'The Angry Birds Movie 3 HFSS',dist:'Paramount',genre:'Animation',franchise:'Angry Birds',starActor:null,phase:4,releaseDate:'23 Dec',week:51,basePrice:14,estM:28,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f137',title:'King',dist:'Fox',genre:'Drama',franchise:null,starActor:null,phase:4,releaseDate:'24 Dec',week:51,basePrice:10,estM:18,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f138',title:'Werwulf',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,phase:4,releaseDate:'1 Jan',week:52,basePrice:8,estM:14,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f139',title:'The Beekeeper 2',dist:'Amazon MGM',genre:'Action',franchise:null,starActor:'Jason Statham',phase:4,releaseDate:'15 Jan',week:53,basePrice:18,estM:35,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f140',title:'Children of Blood and Bone',dist:'Paramount',genre:'Action',franchise:null,starActor:null,phase:4,releaseDate:'22 Jan',week:54,basePrice:22,estM:42,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f141',title:'The Rescue',dist:'Disney',genre:'Drama',franchise:null,starActor:null,phase:4,releaseDate:'29 Jan',week:55,basePrice:12,estM:22,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f142',title:'The Thomas Crown Affair',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:5,releaseDate:'5 Feb',week:57,basePrice:24,estM:45,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f143',title:'Ice Age: Boiling Point HFSS',dist:'Disney/20th',genre:'Animation',franchise:'Ice Age',starActor:null,phase:5,releaseDate:'12 Feb',week:58,basePrice:30,estM:58,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f144',title:'The Nightingale',dist:'Universal',genre:'Drama',franchise:null,starActor:null,phase:5,releaseDate:'12 Feb',week:58,basePrice:14,estM:26,rt:null,sleeper:true,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f145',title:'Star Wars: A New Hope (50th Anniversary)',dist:'Disney',genre:'Action',franchise:'Star Wars',starActor:null,phase:5,releaseDate:'19 Feb',week:59,basePrice:22,estM:42,rt:99,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f146',title:'Sonic the Hedgehog 4 HFSS',dist:'Paramount',genre:'Family',franchise:'Sonic',starActor:'Jim Carrey',phase:5,releaseDate:'26 Feb',week:60,basePrice:34,estM:65,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f147',title:'Untitled Mike Flanagan Exorcist Film',dist:'Lionsgate',genre:'Horror',franchise:'Exorcist',starActor:null,phase:5,releaseDate:'12 Mar',week:61,basePrice:20,estM:38,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'},
  {id:'f148',title:'The Resurrection of The Christ: Part One',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:5,releaseDate:'19 Mar',week:62,basePrice:22,estM:42,rt:null,sleeper:false,trailer:'https://www.youtube.com/embed/placeholder'}
]

function calcMarketValue(film, actualM) {
  if (actualM == null) return film.basePrice
  const ratio = actualM / film.estM
  let multiplier
  if (ratio >= 2.0)       multiplier = 2.00
  else if (ratio >= 1.5)  multiplier = 1.60
  else if (ratio >= 1.3)  multiplier = 1.35
  else if (ratio >= 1.1)  multiplier = 1.15
  else if (ratio >= 0.95) multiplier = 1.00
  else if (ratio >= 0.80) multiplier = 0.85
  else if (ratio >= 0.60) multiplier = 0.65
  else if (ratio >= 0.40) multiplier = 0.45
  else multiplier = 0.25
  let rtMod = 1.0
  if (film.rt >= 90)      rtMod = 1.15
  else if (film.rt >= 75) rtMod = 1.08
  else if (film.rt < 50 && film.rt != null) rtMod = 0.90
  let value = film.basePrice * multiplier * rtMod
  value = Math.max(film.basePrice * 0.15, value)
  value = Math.min(film.basePrice * 3.0, value)
  return Math.round(value)
}

function calcOpeningPts(film, actualM, isEarlyBird=false, isAnalyst=false) {
  if (actualM == null) return 0
  const ratio = actualM / film.estM
  let perfMult
  if (ratio >= 2.0)       perfMult = 2.00
  else if (ratio >= 1.5)  perfMult = 1.60
  else if (ratio >= 1.3)  perfMult = 1.35
  else if (ratio >= 1.1)  perfMult = 1.15
  else if (ratio >= 0.95) perfMult = 1.00
  else if (ratio >= 0.80) perfMult = 0.85
  else if (ratio >= 0.60) perfMult = 0.65
  else perfMult = 0.45
  let rtMod = 1.0
  if (film.rt >= 90)      rtMod = 1.25
  else if (film.rt >= 75) rtMod = 1.10
  else if (film.rt < 50 && film.rt != null) rtMod = 0.85
  let pts = Math.round(actualM * perfMult * rtMod)
  if (isEarlyBird && ratio >= 1.10) pts = Math.round(pts * 1.10)
  if (isAnalyst) pts = pts * 3
  return pts
}

function calcLegsBonus(actualM, week2M) {
  if (actualM == null || week2M == null) return 0
  const dropPct = (actualM - week2M) / actualM
  return dropPct < 0.30 ? 25 : 0
}

async function saveResult(filmId, actualM) {
  const existing = await supabase.from('results').select('film_id').eq('film_id', filmId).single()
  if (existing.data) return supabase.from('results').update({ actual_m: actualM }).eq('film_id', filmId)
  return supabase.from('results').insert({ film_id: filmId, actual_m: actualM })
}

async function saveFilmValue(filmId, value) {
  const existing = await supabase.from('film_values').select('film_id').eq('film_id', filmId).single()
  if (existing.data) return supabase.from('film_values').update({ current_value: value }).eq('film_id', filmId)
  return supabase.from('film_values').insert({ film_id: filmId, current_value: value })
}

async function saveWeeklyGross(filmId, weekNum, grossM) {
  const existing = await supabase.from('weekly_grosses').select('id').eq('film_id', filmId).eq('week_num', weekNum).single()
  if (existing.data) return supabase.from('weekly_grosses').update({ gross_m: grossM }).eq('film_id', filmId).eq('week_num', weekNum)
  return supabase.from('weekly_grosses').insert({ film_id: filmId, week_num: weekNum, gross_m: grossM })
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
  const [chips, setChips] = useState(null)
  const [allChips, setAllChips] = useState([])
  const [films, setFilms] = useState(FILMS_DEFAULT)
  const [forecasts, setForecasts] = useState({})
  const [allForecasts, setAllForecasts] = useState([])
  const [oscarPredictions, setOscarPredictions] = useState([])
  const [myOscarPick, setMyOscarPick] = useState(null)
  const [auteurDeclarations, setAuteurDeclarations] = useState([])
  const [weekendWinners, setWeekendWinners] = useState({})
  const [phaseBudgets, setPhaseBudgets] = useState([])
  const [leagueConfig, setLeagueConfig] = useState({ current_week:1, current_phase:1, currency:'$', tx_fee:5, phase_window_active:false, phase_window_opened_at:null, best_picture_winner:null })
  const [notif, setNotif] = useState(null)
  const [trailerFilm, setTrailerFilm] = useState(null)
  const [chipModal, setChipModal] = useState(null)
  const [addFilmModal, setAddFilmModal] = useState(false)
  const [newFilm, setNewFilm] = useState({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:''})
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    supabase.auth.onAuthStateChange((_e, session) => setSession(session))
  }, [])

  useEffect(() => { if (session) { loadProfile(); loadData() } }, [session])

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const notify = (msg, col=S.gold) => { setNotif({ msg, col }); setTimeout(() => setNotif(null), 3000) }
  const isCommissioner = session?.user?.email === COMMISSIONER_EMAIL

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) setProfile(data)
  }

  const loadData = async () => {
    const [
      { data: ps }, { data: rs }, { data: res }, { data: fv }, { data: cfg },
      { data: wg }, { data: ch }, { data: fc }, { data: op }, { data: ad },
      { data: ww }, { data: pb }
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('rosters').select('*'),
      supabase.from('results').select('*'),
      supabase.from('film_values').select('*'),
      supabase.from('league_config').select('*').eq('id', 1).single(),
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
    if (res) { const map = {}; res.forEach(r => map[r.film_id] = r.actual_m); setResults(map) }
    if (fv) { const map = {}; fv.forEach(v => map[v.film_id] = v.current_value); setFilmValues(map) }
    if (cfg) setLeagueConfig(cfg)
    if (wg) {
      const map = {}
      wg.forEach(w => { if (!map[w.film_id]) map[w.film_id] = {}; map[w.film_id][w.week_num] = w.gross_m })
      setWeeklyGrosses(map)
    }
    if (ch) { setAllChips(ch); setChips(ch.find(c => c.player_id === session?.user?.id) || null) }
    if (fc) {
      setAllForecasts(fc)
      const myMap = {}
      fc.filter(f => f.player_id === session?.user?.id).forEach(f => myMap[f.film_id] = f.predicted_m)
      setForecasts(myMap)
    }
    if (op) { setOscarPredictions(op); setMyOscarPick(op.find(o => o.player_id === session?.user?.id) || null) }
    if (ad) setAuteurDeclarations(ad)
    if (ww) { const map = {}; ww.forEach(w => map[w.week] = w.film_id); setWeekendWinners(map) }
    if (pb) setPhaseBudgets(pb)
  }

  // ── PHASE & BUDGET ──
  const getCurrentPhase = () => leagueConfig.current_phase || 1
  const getPhaseWindow = () => leagueConfig.phase_window_active || false

  // Tiered base budget for a phase
  const getPhaseBudgetBase = (phase) => PHASE_BUDGETS[phase] || 100

  // Banking: unspent from previous phase flows forward
  const getPhaseBanked = (pid, phase) => {
    if (phase <= 1) return 0
    const prev = phaseBudgets.find(pb => pb.player_id === pid && pb.phase === phase - 1)
    return prev?.budget_banked || 0
  }

  const getPhaseAllocated = (pid, phase) => {
    const stored = phaseBudgets.find(pb => pb.player_id === pid && pb.phase === phase)
    if (stored) return stored.budget_allocated
    return getPhaseBudgetBase(phase) + getPhaseBanked(pid, phase)
  }

  // Only count rosters from current phase
  const getPhaseSpent = (pid, phase) => {
    return rosters
      .filter(r => r.player_id === pid && r.phase === phase && r.active)
      .reduce((s, r) => s + r.bought_price, 0)
  }

  const getPhaseBudgetLeft = (pid) => {
    const phase = getCurrentPhase()
    return Math.max(0, getPhaseAllocated(pid, phase) - getPhaseSpent(pid, phase))
  }

  // Save banking when phase advances
  const bankUnspentBudget = async (pid, phase) => {
    const allocated = getPhaseAllocated(pid, phase)
    const spent = getPhaseSpent(pid, phase)
    const banked = Math.max(0, allocated - spent)
    const existing = phaseBudgets.find(pb => pb.player_id === pid && pb.phase === phase)
    if (existing) {
      await supabase.from('phase_budgets').update({ budget_allocated: allocated, budget_spent: spent, budget_banked: banked }).eq('id', existing.id)
    } else {
      await supabase.from('phase_budgets').insert({ player_id: pid, phase, budget_allocated: allocated, budget_spent: spent, budget_banked: banked })
    }
  }

  // ── FILM VALUE ──
  const getFilmValue = (film) => filmValues[film.id] ?? film.basePrice

  // ── BONUS HELPERS ──
  const getWeeklyPts = (filmId) => {
    const weeks = weeklyGrosses[filmId] || {}
    return Object.values(weeks).reduce((s, g) => s + Number(g) * 0.5, 0)
  }

  const getLegsBonus = (filmId) => {
    const actual = results[filmId]
    const week2 = weeklyGrosses[filmId]?.[2]
    return calcLegsBonus(actual, week2)
  }

  const getWeekendWinnerBonus = (filmId) => Object.values(weekendWinners).includes(filmId) ? 15 : 0

  const isEarlyBird = (holding) => {
    const film = films.find(f => f.id === holding.film_id)
    if (!film) return false
    return film.week - (holding.acquired_week || holding.bought_week) >= EARLY_BIRD_WEEKS
  }

  const getFlipBonus = (holding) => {
    if (!holding.sold_price || !holding.sold_week) return 0
    const weekHeld = (holding.sold_week || 0) - (holding.acquired_week || holding.bought_week || 0)
    if (weekHeld > 7) return 0
    const profit = holding.sold_price - holding.bought_price
    if (profit <= 0) return 0
    return Math.floor(profit / 10) * 5
  }

  const getAuteurBonus = (pid, filmId) => {
    const decl = auteurDeclarations.find(a => a.player_id === pid && a.phase === getCurrentPhase())
    if (!decl) return false
    return decl.film_ids.includes(filmId)
  }

  const getShortBonus = (pid, filmId) => {
    const playerChip = allChips.find(c => c.player_id === pid)
    if (!playerChip?.short_film_id || playerChip.short_film_id !== filmId) return 0
    if (playerChip.short_result === 'win') return 100
    if (playerChip.short_result === 'lose') return -30
    return 0
  }

  const getAnalystActive = (pid, filmId) => {
    const playerChip = allChips.find(c => c.player_id === pid)
    if (!playerChip?.analyst_film_id || playerChip.analyst_film_id !== filmId) return false
    return playerChip.analyst_result === 'win'
  }

  // ── FORECASTER ACCURACY ──
  const getForecasterPhasePts = (pid, ph) => {
    const phaseFilms = films.filter(f => f.phase === ph && results[f.id] != null)
    if (phaseFilms.length === 0) return 0
    const playerForecasts = allForecasts.filter(f => f.player_id === pid && phaseFilms.find(pf => pf.id === f.film_id))
    if (playerForecasts.length === 0) return null
    const totalPct = playerForecasts.reduce((s, fc) => {
      const actual = results[fc.film_id]
      return s + Math.abs(fc.predicted_m - actual) / actual
    }, 0)
    return totalPct / playerForecasts.length
  }

  const getForecasterBonusPts = (pid, ph) => {
    // +15pts if best forecaster this phase
    const scores = players.map(p => ({ id: p.id, score: getForecasterPhasePts(p.id, ph) })).filter(x => x.score != null)
    if (scores.length === 0) return 0
    const best = scores.reduce((a, b) => a.score < b.score ? a : b)
    return best.id === pid ? 15 : 0
  }

  const getSeasonForecasterBonus = (pid) => {
    // +50pts if best overall forecaster across all phases
    const seasonScores = players.map(p => {
      const phScores = [1,2,3,4,5].map(ph => getForecasterPhasePts(p.id, ph)).filter(s => s != null)
      if (phScores.length === 0) return { id: p.id, score: null }
      return { id: p.id, score: phScores.reduce((a,b) => a+b, 0) / phScores.length }
    }).filter(x => x.score != null)
    if (seasonScores.length === 0) return 0
    const best = seasonScores.reduce((a,b) => a.score < b.score ? a : b)
    return best.id === pid ? 50 : 0
  }

  // ── POINTS ──
  const calcPhasePoints = (pid, ph) => {
    let total = 0
    const phaseRosters = rosters.filter(r => r.player_id === pid && r.phase === ph)
    phaseRosters.forEach(holding => {
      const film = films.find(f => f.id === holding.film_id)
      if (!film) return
      const actual = results[film.id]
      if (actual == null) return
      const earlyBird = isEarlyBird(holding)
      const analystWin = getAnalystActive(pid, film.id)
      const auteur = getAuteurBonus(pid, film.id)
      let openPts = calcOpeningPts(film, actual, earlyBird, analystWin)
      if (auteur) openPts = Math.round(openPts * 1.10)
      total += openPts
      total += Math.round(getWeeklyPts(film.id))
      total += getLegsBonus(film.id)
      total += getWeekendWinnerBonus(film.id)
      total += getShortBonus(pid, film.id)
    })
    total += getForecasterBonusPts(pid, ph)
    return total
  }

  const calcPoints = (pid) => {
    let total = [1,2,3,4,5].reduce((s, ph) => s + calcPhasePoints(pid, ph), 0)
    const oscarPick = oscarPredictions.find(o => o.player_id === pid)
    if (oscarPick?.correct) total += 75
    total += getSeasonForecasterBonus(pid)
    return total
  }

  // ── BUY / SELL ──
  const buyFilm = async (film) => {
    if (!profile) return notify('Create a profile first', S.red)
    const phase = getCurrentPhase()
    const isWindow = getPhaseWindow()
    // Phase-locked: only buy films in current phase
    if (film.phase !== phase) return notify(`This film is in Phase ${film.phase} — you are in Phase ${phase}`, S.red)
    if (rosters.find(r => r.player_id === profile.id && r.film_id === film.id && r.active)) return notify('Already in your roster', S.red)
    const myPhaseRoster = rosters.filter(r => r.player_id === profile.id && r.phase === phase && r.active)
    if (myPhaseRoster.length >= MAX_ROSTER) return notify(`Phase roster full (${MAX_ROSTER} max)`, S.red)
    const price = getFilmValue(film)
    const budgetLeft = getPhaseBudgetLeft(profile.id)
    if (price > budgetLeft) return notify(`Not enough budget ($${price} needed, $${budgetLeft} left)`, S.red)
    const { error } = await supabase.from('rosters').insert({
      player_id: profile.id, film_id: film.id, bought_price: price,
      bought_week: leagueConfig.current_week, acquired_week: leagueConfig.current_week,
      phase, active: true,
    })
    if (error) return notify(error.message, S.red)
    await supabase.from('transactions').insert({ player_id: profile.id, film_id: film.id, type: 'buy', price, week: leagueConfig.current_week })
    notify(`Acquired ${film.title} for $${price}M`, S.green)
    loadData()
  }

  const sellFilm = async (film) => {
    const holding = rosters.find(r => r.player_id === profile.id && r.film_id === film.id && r.active)
    if (!holding) return
    const isWindow = getPhaseWindow()
    const currentVal = getFilmValue(film)
    const fee = isWindow ? 0 : leagueConfig.tx_fee
    const proceeds = Math.max(0, currentVal - fee)
    const flipBonus = getFlipBonus({...holding, sold_price: proceeds, sold_week: leagueConfig.current_week})
    await supabase.from('rosters').update({ active: false, sold_price: proceeds, sold_week: leagueConfig.current_week }).eq('id', holding.id)
    await supabase.from('transactions').insert([
      { player_id: profile.id, film_id: film.id, type: 'sell', price: proceeds, week: leagueConfig.current_week },
      ...(fee > 0 ? [{ player_id: profile.id, film_id: film.id, type: 'fee', price: fee, week: leagueConfig.current_week }] : []),
    ])
    notify(`Sold ${film.title} · $${proceeds}M${isWindow?' (free)':''}${flipBonus>0?` · 🔄 Flip +${flipBonus}pts`:''}`, S.gold)
    loadData()
  }

  // ── CHIPS ──
  const activateRecut = async () => {
    if (chips?.recut_used) return notify('Recut already used this season', S.red)
    if (!confirm('Activate THE RECUT? Your phase roster clears with zero fees.')) return
    const myRoster = rosters.filter(r => r.player_id === profile.id && r.active)
    for (const holding of myRoster) {
      await supabase.from('rosters').update({ active: false, sold_price: getFilmValue(films.find(f=>f.id===holding.film_id)||{}), sold_week: leagueConfig.current_week }).eq('id', holding.id)
    }
    if (chips) await supabase.from('chips').update({ recut_used: true }).eq('player_id', profile.id)
    else await supabase.from('chips').insert({ player_id: profile.id, recut_used: true })
    notify('🎬 THE RECUT — roster cleared, zero fees', S.purple)
    setChipModal(null); loadData()
  }

  const activateShort = async (filmId, prediction) => {
    if (chips?.short_film_id) return notify('Short already used this season', S.red)
    if (allChips.find(c => c.short_film_id === filmId)) return notify('Another player already shorted this film', S.red)
    if (chips) await supabase.from('chips').update({ short_film_id: filmId, short_phase: getCurrentPhase(), short_prediction: prediction }).eq('player_id', profile.id)
    else await supabase.from('chips').insert({ player_id: profile.id, short_film_id: filmId, short_phase: getCurrentPhase(), short_prediction: prediction })
    notify(`📉 SHORT — ${films.find(f=>f.id===filmId)?.title}`, S.red)
    setChipModal(null); loadData()
  }

  const activateAnalyst = async (filmId, prediction) => {
    if (chips?.analyst_film_id) return notify('Analyst already used this season', S.red)
    if (allChips.find(c => c.analyst_film_id === filmId)) return notify('Another player already called Analyst on this film', S.red)
    if (!rosters.find(r => r.player_id === profile.id && r.film_id === filmId && r.active)) return notify('You must own this film', S.red)
    if (chips) await supabase.from('chips').update({ analyst_film_id: filmId, analyst_phase: getCurrentPhase(), analyst_prediction: prediction }).eq('player_id', profile.id)
    else await supabase.from('chips').insert({ player_id: profile.id, analyst_film_id: filmId, analyst_phase: getCurrentPhase(), analyst_prediction: prediction })
    notify(`🎯 ANALYST — ${films.find(f=>f.id===filmId)?.title}`, S.blue)
    setChipModal(null); loadData()
  }

  const resolveChips = async (filmId, actualM) => {
    const film = films.find(f => f.id === filmId)
    if (!film) return
    for (const playerChip of allChips) {
      if (playerChip.short_film_id === filmId && !playerChip.short_result) {
        const result = (actualM / film.estM) < 0.60 ? 'win' : 'lose'
        await supabase.from('chips').update({ short_result: result }).eq('player_id', playerChip.player_id)
      }
      if (playerChip.analyst_film_id === filmId && !playerChip.analyst_result) {
        const pred = playerChip.analyst_prediction
        const withinTen = pred && Math.abs(actualM - pred) / pred <= 0.10
        await supabase.from('chips').update({ analyst_result: withinTen ? 'win' : 'lose' }).eq('player_id', playerChip.player_id)
      }
    }
  }

  const submitOscarPick = async (filmId) => {
    if (myOscarPick) return notify('Oscar pick already submitted', S.red)
    if (new Date().getFullYear() > 2026) return notify('Oscar prediction window closed', S.red)
    await supabase.from('oscar_predictions').insert({ player_id: profile.id, best_picture_film_id: filmId })
    notify(`🏆 Best Picture locked — ${films.find(f=>f.id===filmId)?.title}`, S.gold)
    loadData()
  }

  const submitAuteur = async (actor, filmIds) => {
    if (filmIds.length < 2) return notify('Select at least 2 films', S.red)
    const phase = getCurrentPhase()
    const existing = auteurDeclarations.find(a => a.player_id === profile.id && a.phase === phase)
    if (existing) await supabase.from('auteur_declarations').update({ star_actor: actor, film_ids: filmIds }).eq('id', existing.id)
    else await supabase.from('auteur_declarations').insert({ player_id: profile.id, phase, star_actor: actor, film_ids: filmIds })
    notify(`🎭 Auteur — ${actor} · ${filmIds.length} films · +10%`, S.orange)
    setChipModal(null); loadData()
  }

  const saveForecast = async (filmId, predicted) => {
    const existing = allForecasts.find(f => f.player_id === profile.id && f.film_id === filmId)
    if (existing) await supabase.from('forecasts').update({ predicted_m: predicted }).eq('id', existing.id)
    else await supabase.from('forecasts').insert({ player_id: profile.id, film_id: filmId, phase: getCurrentPhase(), predicted_m: predicted })
    notify(`Forecast saved — ${films.find(f=>f.id===filmId)?.title} $${predicted}M`, S.blue)
    loadData()
  }

  if (loading) return <div style={{...S.app, display:'flex', alignItems:'center', justifyContent:'center'}}><div style={{color:S.gold, fontSize:'24px'}}>Loading...</div></div>
  if (!session) return <Login />
  if (!profile) return <CreateProfile session={session} onCreated={() => { loadProfile(); loadData() }} notify={notify} />

  const phase = getCurrentPhase()
  const isWindow = getPhaseWindow()
  const cur = leagueConfig.currency || '$'
  const myPhaseRoster = rosters.filter(r => r.player_id === profile.id && r.phase === phase && r.active)
  const budgetLeft = getPhaseBudgetLeft(profile.id)
  const bankedFromPrev = getPhaseBanked(profile.id, phase)
  const recutUsed = chips?.recut_used || false
  const shortUsed = !!chips?.short_film_id
  const analystUsed = !!chips?.analyst_film_id

  // Phase window countdown (72hrs)
  const windowMsLeft = leagueConfig.phase_window_opened_at
    ? Math.max(0, 72*60*60*1000 - (now - new Date(leagueConfig.phase_window_opened_at).getTime()))
    : 0
  const windowHrs = Math.floor(windowMsLeft / 3600000)
  const windowMins = Math.floor((windowMsLeft % 3600000) / 60000)
  const windowSecs = Math.floor((windowMsLeft % 60000) / 1000)

  // Phase films — only show current phase films in market
  const phaseFilms = films.filter(f => f.phase === phase)
  const allPhaseFilms = films

  const navItems = [
    ['market','🎬','Market'],
    ['roster','📁','Roster'],
    ['chips','⚡','Chips'],
    ['forecaster','📊','Forecaster'],
    ['oscar','🏆','Oscars'],
    ['league','🥇','League'],
    ['results','📋','Results'],
    ...(isCommissioner ? [['commissioner','⚙️','Panel']] : []),
  ]

  return (
    <div style={S.app}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{fontFamily:'sans-serif', fontSize:'22px', fontWeight:900, color:S.gold, letterSpacing:'-1px'}}>BOXD</div>
        {isWindow && windowMsLeft > 0 && (
          <div style={{background:S.orange+'22', border:`1px solid ${S.orange}44`, borderRadius:'6px', padding:'3px 10px', fontSize:'9px', color:S.orange}}>
            🔓 FREE WINDOW · {windowHrs}h {windowMins}m {windowSecs}s
          </div>
        )}
        {isWindow && windowMsLeft === 0 && (
          <div style={{background:'#FF475722', border:'1px solid #FF475744', borderRadius:'6px', padding:'3px 10px', fontSize:'9px', color:S.red}}>
            ⏰ WINDOW EXPIRED
          </div>
        )}
        <div style={{background:'#12141A', border:'1px solid #2A2F3C', borderRadius:'7px', padding:'4px 10px'}}>
          <div style={{fontSize:'7px', color:'#4A5168', letterSpacing:'1px'}}>Ph{phase} · {PHASE_NAMES[phase]}</div>
          <div style={{fontSize:'14px', fontWeight:700, color:budgetLeft < 20 ? S.red : S.green}}>{cur}{budgetLeft}M left</div>
        </div>
        {bankedFromPrev > 0 && <div style={{fontSize:'9px', color:S.orange}}>+{cur}{bankedFromPrev}M banked</div>}
        <div style={{fontSize:'9px', color:'#4A5168'}}>W{leagueConfig.current_week}</div>
        <div style={{marginLeft:'auto', display:'flex', gap:'6px', alignItems:'center'}}>
          <div style={{fontSize:'10px', color:'#4A5168'}}>{profile.name}</div>
          <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', fontSize:'8px', padding:'5px 10px'}} onClick={() => supabase.auth.signOut()}>Out</button>
        </div>
      </div>

      <div style={{display:'flex'}}>
        <div style={S.sidebar}>
          {navItems.map(([id,ic,lb]) => (
            <div key={id} onClick={() => setPage(id)} style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'7px', cursor:'pointer', fontSize:'11px', marginBottom:'2px', background:page===id?'#F0B42914':'none', color:page===id?S.gold:'#6B7080'}}>
              <span>{ic}</span>{lb}
            </div>
          ))}
        </div>

        <div style={S.main}>

          {/* ── MARKET ── */}
          {page === 'market' && (
            <div>
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'18px', fontWeight:800}}>Phase {phase} Market · {PHASE_NAMES[phase]}</div>
                <div style={{fontSize:'10px', color:'#4A5168', marginTop:'2px'}}>
                  {cur}{budgetLeft}M budget · {myPhaseRoster.length}/{MAX_ROSTER} slots · {phaseFilms.length} films this phase
                  {isWindow ? ' · 🔓 Free drops' : ''}
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:'10px'}}>
                {phaseFilms.map(film => {
                  const owned = myPhaseRoster.find(r => r.film_id === film.id)
                  const val = getFilmValue(film)
                  const actual = results[film.id]
                  const genreCol = GENRE_COL[film.genre] || '#888'
                  const priceDelta = val - film.basePrice
                  const weeklyPts = getWeeklyPts(film.id)
                  const openingPts = actual != null ? calcOpeningPts(film, actual, owned ? isEarlyBird(owned) : false, getAnalystActive(profile.id, film.id)) : 0
                  const legsBonus = getLegsBonus(film.id)
                  const wwBonus = getWeekendWinnerBonus(film.id)
                  const isShorted = chips?.short_film_id === film.id
                  const isAnalyst = chips?.analyst_film_id === film.id
                  const isAuteur = getAuteurBonus(profile.id, film.id)
                  const earlyBirdEligible = owned && isEarlyBird(owned)
                  return (
                    <div key={film.id} style={{...S.card, border:`1px solid ${owned ? S.gold+'44' : '#1E222C'}`, background:owned?'#F0B42908':'#0C0E12', position:'relative', overflow:'hidden'}}>
                      <div style={{position:'absolute', top:0, left:0, right:0, height:'2px', background:genreCol}} />
                      <div style={{fontSize:'12px', fontWeight:700, marginBottom:'2px', marginTop:'4px'}}>{film.title}</div>
                      <div style={{fontSize:'9px', color:'#4A5168', marginBottom:'6px'}}>{film.dist} · W{film.week}</div>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'6px'}}>
                        <div>
                          <div style={{fontSize:'17px', fontWeight:800, color:owned?S.gold:'#F2EEE8'}}>{cur}{val}M</div>
                          <div style={{fontSize:'9px', color:priceDelta>0?S.green:priceDelta<0?S.red:'#4A5168'}}>{priceDelta===0?'—':priceDelta>0?'▲':'▼'} {cur}{film.basePrice}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          {film.rt != null && <div style={{fontSize:'9px', color:film.rt>=90?S.green:film.rt>=75?S.gold:S.red}}>🍅{film.rt}%</div>}
                          <div style={{fontSize:'9px', color:'#4A5168'}}>Est ${film.estM}M</div>
                        </div>
                      </div>
                      <div style={{display:'flex', gap:'3px', flexWrap:'wrap', marginBottom:'6px'}}>
                        <span style={{fontSize:'8px', padding:'1px 5px', borderRadius:'4px', background:genreCol+'18', color:genreCol}}>{film.genre}</span>
                        {film.franchise && <span style={{fontSize:'8px', padding:'1px 5px', borderRadius:'4px', background:'#A855F718', color:'#A855F7'}}>{film.franchise}</span>}
                        {film.sleeper && <span style={{fontSize:'8px', padding:'1px 5px', borderRadius:'4px', background:'#4D9EFF18', color:'#4D9EFF'}}>💤</span>}
                        {isShorted && <span style={{fontSize:'8px', padding:'1px 5px', borderRadius:'4px', background:S.red+'18', color:S.red}}>📉</span>}
                        {isAnalyst && <span style={{fontSize:'8px', padding:'1px 5px', borderRadius:'4px', background:S.blue+'18', color:S.blue}}>🎯</span>}
                        {isAuteur && <span style={{fontSize:'8px', padding:'1px 5px', borderRadius:'4px', background:S.orange+'18', color:S.orange}}>🎭</span>}
                        {earlyBirdEligible && <span style={{fontSize:'8px', padding:'1px 5px', borderRadius:'4px', background:S.green+'18', color:S.green}}>🐦</span>}
                      </div>
                      {actual != null && (
                        <div style={{marginBottom:'6px', background:'#12141A', borderRadius:'6px', padding:'5px 8px'}}>
                          <div style={{fontSize:'10px', color:S.green}}>${actual}M actual</div>
                          <div style={{fontSize:'9px', color:S.gold}}>{openingPts}pts{weeklyPts>0?` +${Math.round(weeklyPts)}w`:''}{ legsBonus>0?' 🦵+25':''}{ wwBonus>0?' 🥇+15':''}</div>
                        </div>
                      )}
                      {film.starActor && <div style={{fontSize:'9px', color:'#4A5168', marginBottom:'6px'}}>⭐ {film.starActor}</div>}
                      {film.trailer && <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', width:'100%', fontSize:'9px', marginBottom:'6px', padding:'5px'}} onClick={e => { e.stopPropagation(); setTrailerFilm(film) }}>▶ Trailer</button>}
                      {owned
                        ? <button style={{...S.btn, background:'none', border:`1px solid ${S.red}44`, color:S.red, width:'100%', fontSize:'9px', padding:'6px'}} onClick={() => sellFilm(film)}>Drop{isWindow?' FREE':` · ${cur}${Math.max(0,val-leagueConfig.tx_fee)}M`}</button>
                        : <button style={{...S.btn, background:S.gold, color:'#000', width:'100%', fontSize:'9px', padding:'6px'}} onClick={() => buyFilm(film)}>Acquire · {cur}{val}M</button>
                      }
                      {(() => {
                        const owners = rosters.filter(r => r.film_id === film.id && r.phase === phase && r.active)
                        return owners.length > 0 ? <div style={{fontSize:'9px', color:'#4A5168', marginTop:'4px', textAlign:'center'}}>{owners.length} own this</div> : null
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ROSTER ── */}
          {page === 'roster' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'4px'}}>My Roster · Phase {phase}</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'4px'}}>
                {myPhaseRoster.length}/{MAX_ROSTER} films · {cur}{budgetLeft}M remaining
                {bankedFromPrev > 0 ? ` (incl. ${cur}${bankedFromPrev}M banked)` : ''}
              </div>
              <div style={{display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap'}}>
                {[1,2,3,4,5].map(ph => {
                  const phPts = calcPhasePoints(profile.id, ph)
                  const phRosters = rosters.filter(r => r.player_id === profile.id && r.phase === ph)
                  return (
                    <div key={ph} style={{background: ph===phase?S.gold+'22':'#12141A', border:`1px solid ${ph===phase?S.gold+'44':'#2A2F3C'}`, borderRadius:'7px', padding:'6px 12px', textAlign:'center'}}>
                      <div style={{fontSize:'8px', color: ph===phase?S.gold:'#4A5168'}}>PH{ph}</div>
                      <div style={{fontSize:'13px', fontWeight:700, color: ph===phase?S.gold:'#F2EEE8'}}>{phPts}pts</div>
                      <div style={{fontSize:'8px', color:'#4A5168'}}>{phRosters.length} films</div>
                    </div>
                  )
                })}
              </div>
              {myPhaseRoster.length === 0
                ? <div style={{...S.card, textAlign:'center', color:'#4A5168', padding:'32px'}}>No films this phase. Go to Market to acquire.</div>
                : myPhaseRoster.map(holding => {
                    const film = films.find(f => f.id === holding.film_id)
                    if (!film) return null
                    const val = getFilmValue(film)
                    const actual = results[film.id]
                    const pnl = val - holding.bought_price
                    const genreCol = GENRE_COL[film.genre] || '#888'
                    const weeklyPts = getWeeklyPts(film.id)
                    const earlyBird = isEarlyBird(holding)
                    const analystWin = getAnalystActive(profile.id, film.id)
                    const auteur = getAuteurBonus(profile.id, film.id)
                    const openingPts = calcOpeningPts(film, actual, earlyBird, analystWin)
                    const finalOpenPts = auteur ? Math.round(openingPts * 1.10) : openingPts
                    const legsBonus = getLegsBonus(film.id)
                    const wwBonus = getWeekendWinnerBonus(film.id)
                    const shortBonus = getShortBonus(profile.id, film.id)
                    const weeks = weeklyGrosses[film.id] || {}
                    const totalPts = finalOpenPts + Math.round(weeklyPts) + legsBonus + wwBonus + shortBonus
                    return (
                      <div key={holding.id} style={{...S.card}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
                          <div style={{width:'3px', height:'36px', borderRadius:'2px', background:genreCol, flexShrink:0}} />
                          <div style={{flex:2, minWidth:'110px'}}>
                            <div style={{fontSize:'13px', fontWeight:600}}>{film.title}</div>
                            <div style={{fontSize:'9px', color:'#4A5168'}}>{film.dist} · W{film.week}</div>
                            <div style={{display:'flex', gap:'4px', marginTop:'2px', flexWrap:'wrap'}}>
                              {earlyBird && <span style={{fontSize:'7px', color:S.green, padding:'1px 4px', background:S.green+'15', borderRadius:'3px'}}>🐦 EARLY</span>}
                              {analystWin && <span style={{fontSize:'7px', color:S.blue, padding:'1px 4px', background:S.blue+'15', borderRadius:'3px'}}>🎯 3×</span>}
                              {auteur && <span style={{fontSize:'7px', color:S.orange, padding:'1px 4px', background:S.orange+'15', borderRadius:'3px'}}>🎭 +10%</span>}
                            </div>
                          </div>
                          <div style={{textAlign:'center'}}><div style={{fontSize:'7px', color:'#4A5168'}}>PAID</div><div style={{fontSize:'11px'}}>{cur}{holding.bought_price}</div></div>
                          <div style={{textAlign:'center'}}><div style={{fontSize:'7px', color:'#4A5168'}}>NOW</div><div style={{fontSize:'11px', color:pnl>=0?S.green:S.red}}>{cur}{val}</div></div>
                          <div style={{textAlign:'center'}}><div style={{fontSize:'7px', color:'#4A5168'}}>P&L</div><div style={{fontSize:'12px', fontWeight:700, color:pnl>=0?S.green:S.red}}>{pnl>=0?'+':''}{pnl}</div></div>
                          {actual != null && <div style={{textAlign:'center'}}><div style={{fontSize:'7px', color:'#4A5168'}}>OPEN</div><div style={{fontSize:'11px', color:S.gold}}>{finalOpenPts}pts</div></div>}
                          {weeklyPts > 0 && <div style={{textAlign:'center'}}><div style={{fontSize:'7px', color:'#4A5168'}}>WEEKLY</div><div style={{fontSize:'11px', color:S.blue}}>+{Math.round(weeklyPts)}</div></div>}
                          {(legsBonus > 0 || wwBonus > 0 || shortBonus !== 0) && <div style={{textAlign:'center'}}><div style={{fontSize:'7px', color:'#4A5168'}}>BONUS</div><div style={{fontSize:'11px', color:S.green}}>+{legsBonus+wwBonus+Math.max(0,shortBonus)}</div></div>}
                          {actual != null && <div style={{textAlign:'center'}}><div style={{fontSize:'7px', color:'#4A5168'}}>TOTAL</div><div style={{fontSize:'13px', fontWeight:700, color:S.gold}}>{totalPts}</div></div>}
                        </div>
                        {Object.keys(weeks).length > 0 && (
                          <div style={{marginTop:'8px', paddingTop:'8px', borderTop:'1px solid #1E222C', display:'flex', gap:'6px', flexWrap:'wrap'}}>
                            {Object.entries(weeks).sort((a,b)=>Number(a[0])-Number(b[0])).map(([wk, gross]) => (
                              <div key={wk} style={{background:'#12141A', borderRadius:'5px', padding:'3px 7px', fontSize:'9px'}}>
                                <span style={{color:'#4A5168'}}>W{wk} </span>
                                <span style={{color:S.blue}}>${gross}M</span>
                                <span style={{color:'#4A5168'}}> +{Math.round(Number(gross)*0.5)}</span>
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

          {/* ── CHIPS ── */}
          {page === 'chips' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'6px'}}>My Chips</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'20px'}}>One of each per season · Shorts and Analyst are first-come first-served per film</div>
              {[
                { key:'recut', icon:'🎬', title:'THE RECUT', desc:'Full free roster rebuild · zero fees · anytime', col:S.purple, used:recutUsed, usedLabel:'USED', action: activateRecut, statusLabel: null },
              ].map(chip => (
                <div key={chip.key} style={{...S.card, border:`1px solid ${chip.used?'#2A2F3C':chip.col+'44'}`, marginBottom:'10px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{fontSize:'22px'}}>{chip.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px', fontWeight:700, color:chip.used?'#4A5168':chip.col}}>{chip.title}</div>
                      <div style={{fontSize:'10px', color:'#4A5168'}}>{chip.desc}</div>
                    </div>
                    {chip.used ? <span style={{fontSize:'10px', color:'#4A5168', padding:'3px 10px', border:'1px solid #2A2F3C', borderRadius:'6px'}}>{chip.usedLabel}</span>
                      : <button style={{...S.btn, background:chip.col, color:'#fff', fontSize:'10px', padding:'6px 14px'}} onClick={chip.action}>Activate</button>}
                  </div>
                </div>
              ))}
              <div style={{...S.card, border:`1px solid ${shortUsed?'#2A2F3C':S.red+'44'}`, marginBottom:'10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  <div style={{fontSize:'22px'}}>📉</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px', fontWeight:700, color:shortUsed?'#4A5168':S.red}}>THE SHORT</div>
                    <div style={{fontSize:'10px', color:'#4A5168'}}>Bomb call · under 60% est = +100pts · hit = −30pts</div>
                  </div>
                  {shortUsed
                    ? <span style={{fontSize:'10px', color:'#4A5168', padding:'3px 10px', border:'1px solid #2A2F3C', borderRadius:'6px'}}>{chips?.short_result==='win'?'✅ +100':chips?.short_result==='lose'?'❌ -30':`📉 ${films.find(f=>f.id===chips?.short_film_id)?.title||'Active'}`}</span>
                    : <button style={{...S.btn, background:S.red, color:'#fff', fontSize:'10px', padding:'6px 14px'}} onClick={() => setChipModal('short')}>Activate</button>}
                </div>
              </div>
              <div style={{...S.card, border:`1px solid ${analystUsed?'#2A2F3C':S.blue+'44'}`, marginBottom:'10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  <div style={{fontSize:'22px'}}>🎯</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px', fontWeight:700, color:analystUsed?'#4A5168':S.blue}}>THE ANALYST</div>
                    <div style={{fontSize:'10px', color:'#4A5168'}}>Predict opening ±10% · correct = triple points</div>
                  </div>
                  {analystUsed
                    ? <span style={{fontSize:'10px', color:'#4A5168', padding:'3px 10px', border:'1px solid #2A2F3C', borderRadius:'6px'}}>{chips?.analyst_result==='win'?'✅ 3×':chips?.analyst_result==='lose'?'❌ Missed':`🎯 ${films.find(f=>f.id===chips?.analyst_film_id)?.title||'Active'}`}</span>
                    : <button style={{...S.btn, background:S.blue, color:'#fff', fontSize:'10px', padding:'6px 14px'}} onClick={() => setChipModal('analyst')}>Activate</button>}
                </div>
              </div>
              {(() => {
                const myAuteur = auteurDeclarations.find(a => a.player_id === profile.id && a.phase === phase)
                return (
                  <div style={{...S.card, border:`1px solid ${myAuteur?'#2A2F3C':S.orange+'44'}`, marginBottom:'10px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                      <div style={{fontSize:'22px'}}>🎭</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px', fontWeight:700, color:myAuteur?'#4A5168':S.orange}}>THE AUTEUR</div>
                        <div style={{fontSize:'10px', color:'#4A5168'}}>Declare 2+ films same star actor · +10% each</div>
                        {myAuteur && <div style={{fontSize:'10px', color:S.orange, marginTop:'3px'}}>⭐ {myAuteur.star_actor} · {myAuteur.film_ids.length} films</div>}
                      </div>
                      <button style={{...S.btn, background:myAuteur?'#12141A':S.orange, border:myAuteur?'1px solid #2A2F3C':'none', color:myAuteur?'#4A5168':'#000', fontSize:'10px', padding:'6px 14px'}} onClick={() => setChipModal('auteur')}>{myAuteur?'Update':'Declare'}</button>
                    </div>
                  </div>
                )
              })()}
              {allChips.filter(c => c.player_id !== profile.id && (c.short_film_id || c.analyst_film_id)).length > 0 && (
                <div style={{marginTop:'16px'}}>
                  <div style={{fontSize:'10px', color:'#4A5168', letterSpacing:'1px', marginBottom:'8px'}}>LEAGUE CHIP ACTIVITY</div>
                  {allChips.filter(c => c.player_id !== profile.id).map(c => {
                    const player = players.find(p => p.id === c.player_id)
                    return (
                      <div key={c.id} style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'6px'}}>
                        {c.short_film_id && <div style={{background:'#12141A', borderRadius:'6px', padding:'4px 10px', fontSize:'10px'}}><span style={{color:S.red}}>📉 {player?.name}</span><span style={{color:'#4A5168'}}> → {films.find(f=>f.id===c.short_film_id)?.title}</span>{c.short_result&&<span style={{color:c.short_result==='win'?S.green:S.red}}> {c.short_result==='win'?'✅':'❌'}</span>}</div>}
                        {c.analyst_film_id && <div style={{background:'#12141A', borderRadius:'6px', padding:'4px 10px', fontSize:'10px'}}><span style={{color:S.blue}}>🎯 {player?.name}</span><span style={{color:'#4A5168'}}> → {films.find(f=>f.id===c.analyst_film_id)?.title}</span>{c.analyst_result&&<span style={{color:c.analyst_result==='win'?S.green:S.red}}> {c.analyst_result==='win'?'✅':'❌'}</span>}</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FORECASTER ── */}
          {page === 'forecaster' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'6px'}}>Forecaster</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'20px'}}>Best phase accuracy = +15pts · Best season accuracy = +50pts grand league bonus. Lock in before phase opens.</div>
              {films.filter(f => f.phase === phase && !results[f.id]).length === 0 && films.filter(f => !results[f.id]).length > 0 && (
                <div style={{...S.card, textAlign:'center', color:'#4A5168', padding:'16px', marginBottom:'16px'}}>All Phase {phase} films have results.</div>
              )}
              {films.filter(f => !results[f.id]).map(film => {
                const myForecast = forecasts[film.id]
                return (
                  <div key={film.id} style={{...S.card, display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
                    <div style={{flex:2, minWidth:'120px'}}>
                      <div style={{fontSize:'12px', fontWeight:500}}>{film.title}</div>
                      <div style={{fontSize:'9px', color:'#4A5168'}}>Est ${film.estM}M · Ph{film.phase}</div>
                    </div>
                    <input type="number" step="0.1" defaultValue={myForecast||''} placeholder="Your prediction $M" id={`fc-${film.id}`} style={{...S.inp, width:'140px'}} />
                    <button style={{...S.btn, background:S.blue, color:'#fff', fontSize:'10px'}} onClick={() => {
                      const val = parseFloat(document.getElementById(`fc-${film.id}`).value)
                      if (isNaN(val)) return notify('Enter a prediction', S.red)
                      saveForecast(film.id, val)
                    }}>Lock In</button>
                    {myForecast && <div style={{fontSize:'11px', color:S.blue}}>${myForecast}M</div>}
                  </div>
                )
              })}
              {films.filter(f => results[f.id]).length > 0 && (
                <div style={{marginTop:'24px'}}>
                  <div style={{fontSize:'14px', fontWeight:700, marginBottom:'12px'}}>Forecast Results</div>
                  {films.filter(f => results[f.id]).map(film => {
                    const actual = results[film.id]
                    const playerForecasts = allForecasts.filter(f => f.film_id === film.id)
                    return (
                      <div key={film.id} style={{...S.card, marginBottom:'8px'}}>
                        <div style={{fontSize:'12px', fontWeight:600, marginBottom:'8px'}}>{film.title} <span style={{color:S.green, fontWeight:400}}>— ${actual}M</span></div>
                        <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                          {playerForecasts.map(fc => {
                            const player = players.find(p => p.id === fc.player_id)
                            const pct = Math.round((Math.abs(fc.predicted_m - actual) / actual) * 100)
                            return (
                              <div key={fc.id} style={{background:'#12141A', borderRadius:'6px', padding:'4px 10px', fontSize:'10px'}}>
                                <span style={{color:player?.color||S.gold}}>{player?.name}</span>
                                <span style={{color:'#4A5168'}}> ${fc.predicted_m}M </span>
                                <span style={{color:pct<=10?S.green:S.red}}>{pct<=10?'✅':''} {pct}% off</span>
                              </div>
                            )
                          })}
                          {playerForecasts.length === 0 && <div style={{fontSize:'10px', color:'#4A5168'}}>No predictions</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── OSCAR ── */}
          {page === 'oscar' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'6px'}}>🏆 Oscar Mini Game</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'20px'}}>Predict Best Picture before end of 2026 · correct = +75pts grand league</div>
              {myOscarPick ? (
                <div style={{...S.card, border:`1px solid ${S.gold}44`}}>
                  <div style={{fontSize:'12px', color:'#4A5168', marginBottom:'6px'}}>YOUR PICK</div>
                  <div style={{fontSize:'20px', fontWeight:700, color:S.gold}}>{films.find(f=>f.id===myOscarPick.best_picture_film_id)?.title || '—'}</div>
                  <div style={{fontSize:'10px', color:'#4A5168', marginTop:'4px'}}>{myOscarPick.correct===true?'✅ CORRECT +75pts':myOscarPick.correct===false?'❌ Incorrect':'Awaiting Oscar night'}</div>
                </div>
              ) : (
                <div style={{...S.card}}>
                  <div style={{fontSize:'12px', color:'#4A5168', marginBottom:'12px'}}>PICK YOUR BEST PICTURE WINNER — locks immediately, cannot be changed</div>
                  <select id="oscar-pick" style={{...S.inp, marginBottom:'12px'}}>
                    <option value="">Select a film...</option>
                    {films.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                  <button style={{...S.btn, background:S.gold, color:'#000', fontWeight:700}} onClick={() => {
                    const filmId = document.getElementById('oscar-pick').value
                    if (!filmId) return notify('Select a film', S.red)
                    if (!confirm(`Lock in ${films.find(f=>f.id===filmId)?.title}?`)) return
                    submitOscarPick(filmId)
                  }}>🏆 Lock In</button>
                </div>
              )}
              {oscarPredictions.length > 0 && (
                <div style={{marginTop:'20px'}}>
                  <div style={{fontSize:'12px', color:'#4A5168', letterSpacing:'1px', marginBottom:'10px'}}>ALL PICKS</div>
                  {oscarPredictions.map(op => {
                    const player = players.find(p => p.id === op.player_id)
                    const film = films.find(f => f.id === op.best_picture_film_id)
                    return (
                      <div key={op.id} style={{...S.card, display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px'}}>
                        <div style={{width:'8px', height:'8px', borderRadius:'50%', background:player?.color||S.gold}} />
                        <div style={{flex:1, fontSize:'12px', color:player?.color||S.gold}}>{player?.name}</div>
                        <div style={{fontSize:'12px'}}>{film?.title||'—'}</div>
                        {op.correct===true && <span style={{color:S.green}}>✅ +75pts</span>}
                        {op.correct===false && <span style={{color:S.red}}>❌</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── LEAGUE ── */}
          {page === 'league' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'4px'}}>League Standings</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'16px'}}>Grand League · Phase {phase} · W{leagueConfig.current_week}</div>

              {/* Phase standings row */}
              <div style={{...S.card, marginBottom:'20px'}}>
                <div style={{fontSize:'10px', color:'#4A5168', letterSpacing:'1px', marginBottom:'10px'}}>PHASE STANDINGS</div>
                <div style={{display:'grid', gridTemplateColumns:`repeat(5, 1fr)`, gap:'8px'}}>
                  {[1,2,3,4,5].map(ph => {
                    const phScores = [...players].map(p => ({ p, pts: calcPhasePoints(p.id, ph) })).sort((a,b) => b.pts - a.pts)
                    const leader = phScores[0]
                    return (
                      <div key={ph} style={{background: ph===phase?S.gold+'15':'#12141A', border:`1px solid ${ph===phase?S.gold+'33':'#2A2F3C'}`, borderRadius:'8px', padding:'8px', textAlign:'center'}}>
                        <div style={{fontSize:'8px', color: ph===phase?S.gold:'#4A5168', letterSpacing:'1px', marginBottom:'4px'}}>PH{ph}</div>
                        {leader?.pts > 0 ? (
                          <>
                            <div style={{fontSize:'10px', fontWeight:600, color:players.find(p=>p.id===leader?.p?.id)?.color||S.gold, marginBottom:'2px'}}>{leader?.p?.name}</div>
                            <div style={{fontSize:'12px', fontWeight:800, color: ph===phase?S.gold:'#F2EEE8'}}>{leader?.pts}</div>
                          </>
                        ) : <div style={{fontSize:'9px', color:'#4A5168'}}>No results</div>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Grand league */}
              {players.length === 0 && <div style={{...S.card, textAlign:'center', color:'#4A5168'}}>No players yet.</div>}
              {[...players].sort((a,b) => calcPoints(b.id) - calcPoints(a.id)).map((player, i) => {
                const pts = calcPoints(player.id)
                const rank = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`
                const playerChip = allChips.find(c => c.player_id === player.id)
                const playerAuteur = auteurDeclarations.find(a => a.player_id === player.id && a.phase === phase)
                const playerOscar = oscarPredictions.find(o => o.player_id === player.id)
                const phPts = calcPhasePoints(player.id, phase)
                return (
                  <div key={player.id} style={{...S.card, display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{fontSize:'20px', minWidth:'30px'}}>{rank}</div>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:player.color||S.gold, flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px', fontWeight:600, color:player.color||S.gold}}>{player.name}</div>
                      <div style={{display:'flex', gap:'4px', marginTop:'3px', flexWrap:'wrap'}}>
                        <span style={{fontSize:'9px', color:'#4A5168'}}>Ph{phase}: {phPts}pts · {rosters.filter(r=>r.player_id===player.id&&r.phase===phase&&r.active).length} films · {cur}{getPhaseBudgetLeft(player.id)} left</span>
                        {playerChip?.short_film_id && <span style={{fontSize:'8px', color:S.red, padding:'1px 4px', background:S.red+'15', borderRadius:'3px'}}>📉</span>}
                        {playerChip?.analyst_film_id && <span style={{fontSize:'8px', color:S.blue, padding:'1px 4px', background:S.blue+'15', borderRadius:'3px'}}>🎯</span>}
                        {playerChip?.recut_used && <span style={{fontSize:'8px', color:S.purple, padding:'1px 4px', background:S.purple+'15', borderRadius:'3px'}}>🎬</span>}
                        {playerAuteur && <span style={{fontSize:'8px', color:S.orange, padding:'1px 4px', background:S.orange+'15', borderRadius:'3px'}}>🎭</span>}
                        {playerOscar && <span style={{fontSize:'8px', color:S.gold, padding:'1px 4px', background:S.gold+'15', borderRadius:'3px'}}>🏆</span>}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'26px', fontWeight:800, color:i===0?S.gold:'#F2EEE8'}}>{pts}</div>
                      <div style={{fontSize:'8px', color:'#4A5168'}}>GRAND PTS</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── RESULTS ── */}
          {page === 'results' && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'6px'}}>Enter Results</div>
              <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'20px'}}>Opening weekend + weekly grosses + weekend winner</div>
              {allPhaseFilms.map(film => {
                const actual = results[film.id]
                const weeks = weeklyGrosses[film.id] || {}
                const legsBonus = getLegsBonus(film.id)
                const isWinner = weekendWinners[film.week] === film.id
                return (
                  <div key={film.id} style={{...S.card}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom: actual != null ? '10px' : '0'}}>
                      <div style={{flex:2, minWidth:'120px'}}>
                        <div style={{fontSize:'12px', fontWeight:500}}>{film.title} {isWinner && '🥇'}</div>
                        <div style={{fontSize:'9px', color:'#4A5168'}}>Est ${film.estM}M · IPO ${film.basePrice} · Ph{film.phase}</div>
                      </div>
                      <input type="number" step="0.1" defaultValue={actual||''} placeholder="Opening $M" id={`res-${film.id}`} style={{...S.inp, width:'100px'}} />
                      <button style={{...S.btn, background:S.green, color:'#000', fontSize:'10px', padding:'6px 12px'}} onClick={async () => {
                        const val = parseFloat(document.getElementById(`res-${film.id}`).value)
                        if (isNaN(val)) return notify('Enter a number', S.red)
                        const newValue = calcMarketValue(film, val)
                        const { error: e1 } = await saveResult(film.id, val)
                        if (e1) return notify(e1.message, S.red)
                        const { error: e2 } = await saveFilmValue(film.id, newValue)
                        if (e2) return notify(e2.message, S.red)
                        await resolveChips(film.id, val)
                        notify(`✅ ${film.title} · $${newValue} · ${calcOpeningPts(film, val)}pts`, S.gold)
                        loadData()
                      }}>Save</button>
                      <button style={{...S.btn, background:isWinner?S.gold:'#12141A', border:isWinner?'none':'1px solid #2A2F3C', color:isWinner?'#000':'#4A5168', fontSize:'9px', padding:'6px 10px'}}
                        onClick={async () => {
                          if (isWinner) {
                            await supabase.from('weekend_winners').delete().eq('week', film.week)
                          } else {
                            const existing = await supabase.from('weekend_winners').select('id').eq('week', film.week).single()
                            if (existing.data) await supabase.from('weekend_winners').update({ film_id: film.id, phase }).eq('week', film.week)
                            else await supabase.from('weekend_winners').insert({ film_id: film.id, week: film.week, phase })
                          }
                          notify(isWinner ? 'Winner removed' : `🥇 ${film.title} · +15pts all owners`, S.gold)
                          loadData()
                        }}>{isWinner ? '🥇 #1' : '#1?'}</button>
                      {actual != null && <div style={{fontSize:'11px', color:S.green}}>${actual}M → $${getFilmValue(film)} · {calcOpeningPts(film,actual)}pts</div>}
                    </div>
                    {actual != null && (
                      <div style={{borderTop:'1px solid #1E222C', paddingTop:'8px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap'}}>
                          <div style={{fontSize:'9px', color:'#4A5168', letterSpacing:'1px'}}>WEEKLY · 0.5pts/$1M</div>
                          {legsBonus > 0 && <span style={{fontSize:'9px', color:S.green, padding:'1px 6px', background:S.green+'18', borderRadius:'4px'}}>🦵 Legs +25pts</span>}
                        </div>
                        <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                          {[2,3,4,5,6,7,8].map(wk => (
                            <div key={wk} style={{display:'flex', flexDirection:'column', gap:'3px', alignItems:'center'}}>
                              <div style={{fontSize:'8px', color:'#4A5168'}}>W{wk}</div>
                              <input type="number" step="0.1" placeholder="$M" defaultValue={weeks[wk]||''} id={`weekly-${film.id}-${wk}`} style={{...S.inp, width:'62px', fontSize:'10px', padding:'4px 6px'}} />
                              <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', fontSize:'8px', padding:'2px 6px'}}
                                onClick={async () => {
                                  const val = parseFloat(document.getElementById(`weekly-${film.id}-${wk}`).value)
                                  if (isNaN(val)) return notify('Enter a number', S.red)
                                  const { error } = await saveWeeklyGross(film.id, wk, val)
                                  if (error) return notify(error.message, S.red)
                                  const newLegs = wk === 2 ? calcLegsBonus(actual, val) : legsBonus
                                  notify(`W${wk} · +${Math.round(val*0.5)}pts${newLegs>0?' · 🦵':''}`, S.gold)
                                  loadData()
                                }}>Save</button>
                              {weeks[wk] && <div style={{fontSize:'8px', color:S.blue}}>+{Math.round(Number(weeks[wk])*0.5)}</div>}
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

          {/* ── COMMISSIONER ── */}
          {page === 'commissioner' && isCommissioner && (
            <div>
              <div style={{fontSize:'18px', fontWeight:800, marginBottom:'20px'}}>⚙️ Commissioner Panel</div>

              {/* League controls */}
              <div style={{...S.card, marginBottom:'14px'}}>
                <div style={{fontSize:'11px', fontWeight:600, color:S.gold, marginBottom:'12px', letterSpacing:'1px'}}>LEAGUE CONTROLS</div>
                <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center'}}>
                  <div style={{fontSize:'12px'}}>W{leagueConfig.current_week} · Ph{phase} · {PHASE_NAMES[phase]}</div>
                  <button style={{...S.btn, background:S.gold, color:'#000', fontSize:'10px'}} onClick={async () => {
                    await supabase.from('league_config').update({ current_week: leagueConfig.current_week + 1 }).eq('id', 1)
                    notify(`Week ${leagueConfig.current_week + 1}`, S.green)
                    loadData()
                  }}>Next Week →</button>
                  <button style={{...S.btn, background:isWindow?S.orange:S.purple, color:'#fff', fontSize:'10px'}} onClick={async () => {
                    const nowIso = new Date().toISOString()
                    await supabase.from('league_config').update({ phase_window_active: !isWindow, phase_window_opened_at: !isWindow ? nowIso : null }).eq('id', 1)
                    notify(isWindow ? 'Free window closed' : '🔓 72hr free window opened!', S.orange)
                    loadData()
                  }}>{isWindow ? '🔒 Close Window' : '🔓 Open 72hr Window'}</button>
                  <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:S.gold, fontSize:'10px'}} onClick={async () => {
                    if (!confirm(`Advance to Phase ${phase + 1}? This will bank unspent budgets for all players.`)) return
                    // Bank all players' unspent budget
                    for (const player of players) { await bankUnspentBudget(player.id, phase) }
                    await supabase.from('league_config').update({ current_phase: phase + 1, phase_window_active: false, phase_window_opened_at: null }).eq('id', 1)
                    notify(`Phase ${phase + 1} started — budgets banked`, S.green)
                    loadData()
                  }}>Next Phase →</button>
                </div>
                {/* Budget overview */}
                <div style={{marginTop:'12px', display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  {players.map(player => (
                    <div key={player.id} style={{background:'#12141A', borderRadius:'6px', padding:'6px 10px', fontSize:'10px'}}>
                      <span style={{color:player.color||S.gold}}>{player.name}</span>
                      <span style={{color:'#4A5168'}}> · Ph{phase} {cur}{getPhaseBudgetLeft(player.id)}M left</span>
                      {getPhaseBanked(player.id, phase) > 0 && <span style={{color:S.orange}}> +{cur}{getPhaseBanked(player.id, phase)}M banked</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Oscar night */}
              <div style={{...S.card, marginBottom:'14px'}}>
                <div style={{fontSize:'11px', fontWeight:600, color:S.gold, marginBottom:'12px', letterSpacing:'1px'}}>OSCAR NIGHT</div>
                <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
                  <select id="oscar-winner-select" style={{...S.inp, maxWidth:'250px'}}>
                    <option value="">Select Best Picture winner...</option>
                    {films.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                  <button style={{...S.btn, background:S.gold, color:'#000', fontSize:'10px'}} onClick={async () => {
                    const winnerId = document.getElementById('oscar-winner-select').value
                    if (!winnerId) return notify('Select a film', S.red)
                    await supabase.from('league_config').update({ best_picture_winner: winnerId }).eq('id', 1)
                    for (const op of oscarPredictions) {
                      await supabase.from('oscar_predictions').update({ correct: op.best_picture_film_id === winnerId }).eq('player_id', op.player_id)
                    }
                    notify(`🏆 ${films.find(f=>f.id===winnerId)?.title}`, S.gold)
                    loadData()
                  }}>Set Winner</button>
                </div>
              </div>

              {/* Film management */}
              <div style={{...S.card, marginBottom:'14px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                  <div style={{fontSize:'11px', fontWeight:600, color:S.gold, letterSpacing:'1px'}}>FILM MANAGEMENT</div>
                  <button style={{...S.btn, background:S.green, color:'#000', fontSize:'10px'}} onClick={() => setAddFilmModal(true)}>+ Add Film</button>
                </div>
                {[1,2,3,4,5].map(ph => {
                  const phFilms = films.filter(f => f.phase === ph)
                  if (phFilms.length === 0) return null
                  return (
                    <div key={ph} style={{marginBottom:'12px'}}>
                      <div style={{fontSize:'10px', color:ph===phase?S.gold:'#4A5168', letterSpacing:'1px', marginBottom:'6px'}}>PHASE {ph} — {PHASE_NAMES[ph]} · {cur}{PHASE_BUDGETS[ph]}M budget</div>
                      {phFilms.map(film => (
                        <div key={film.id} style={{display:'flex', alignItems:'center', gap:'8px', padding:'6px 0', borderBottom:'1px solid #1E222C', flexWrap:'wrap'}}>
                          <div style={{flex:2, minWidth:'100px'}}>
                            <div style={{fontSize:'11px'}}>{film.title}</div>
                            <div style={{fontSize:'9px', color:'#4A5168'}}>W{film.week} · {film.starActor||'no actor'}</div>
                          </div>
                          <div style={{display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap'}}>
                            <div><div style={{fontSize:'7px', color:'#4A5168', marginBottom:'2px'}}>IPO</div><input type="number" defaultValue={film.basePrice} id={`ipo-${film.id}`} style={{...S.inp, width:'55px', fontSize:'10px', padding:'3px 5px'}} /></div>
                            <div><div style={{fontSize:'7px', color:'#4A5168', marginBottom:'2px'}}>EST</div><input type="number" defaultValue={film.estM} id={`est-${film.id}`} style={{...S.inp, width:'55px', fontSize:'10px', padding:'3px 5px'}} /></div>
                            <div><div style={{fontSize:'7px', color:'#4A5168', marginBottom:'2px'}}>RT%</div><input type="number" defaultValue={film.rt||''} id={`rt-${film.id}`} style={{...S.inp, width:'48px', fontSize:'10px', padding:'3px 5px'}} /></div>
                            <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:S.gold, fontSize:'8px', marginTop:'10px', padding:'4px 8px'}} onClick={() => {
                              const newIpo = parseInt(document.getElementById(`ipo-${film.id}`).value)
                              const newEst = parseInt(document.getElementById(`est-${film.id}`).value)
                              const newRt = parseInt(document.getElementById(`rt-${film.id}`).value) || null
                              setFilms(prev => prev.map(f => f.id === film.id ? {...f, basePrice: newIpo, estM: newEst, rt: newRt} : f))
                              notify(`Updated ${film.title}`, S.green)
                            }}>Update</button>
                            <button style={{...S.btn, background:'none', border:`1px solid ${S.red}33`, color:S.red, fontSize:'8px', marginTop:'10px', padding:'4px 8px'}} onClick={() => {
                              if (!confirm(`Remove ${film.title}?`)) return
                              setFilms(prev => prev.filter(f => f.id !== film.id))
                              notify(`Removed ${film.title}`)
                            }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Chip overrides */}
              <div style={{...S.card}}>
                <div style={{fontSize:'11px', fontWeight:600, color:S.gold, marginBottom:'12px', letterSpacing:'1px'}}>CHIP OVERRIDES</div>
                {allChips.length === 0 && <div style={{fontSize:'11px', color:'#4A5168'}}>No chips activated yet.</div>}
                {allChips.map(c => {
                  const player = players.find(p => p.id === c.player_id)
                  return (
                    <div key={c.id} style={{padding:'8px 0', borderBottom:'1px solid #1E222C'}}>
                      <div style={{fontSize:'11px', fontWeight:600, color:player?.color||S.gold, marginBottom:'4px'}}>{player?.name}</div>
                      {c.short_film_id && (
                        <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'4px', flexWrap:'wrap'}}>
                          <span style={{fontSize:'10px', color:S.red}}>📉 {films.find(f=>f.id===c.short_film_id)?.title}</span>
                          <span style={{fontSize:'10px', color:'#4A5168'}}>→ {c.short_result||'pending'}</span>
                          {!c.short_result && <>
                            <button style={{...S.btn, background:S.green, color:'#000', fontSize:'8px', padding:'2px 8px'}} onClick={async () => { await supabase.from('chips').update({short_result:'win'}).eq('player_id',c.player_id); notify('Short WIN +100pts', S.green); loadData() }}>Win</button>
                            <button style={{...S.btn, background:S.red, color:'#fff', fontSize:'8px', padding:'2px 8px'}} onClick={async () => { await supabase.from('chips').update({short_result:'lose'}).eq('player_id',c.player_id); notify('Short LOSE -30pts', S.red); loadData() }}>Lose</button>
                          </>}
                        </div>
                      )}
                      {c.analyst_film_id && (
                        <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
                          <span style={{fontSize:'10px', color:S.blue}}>🎯 {films.find(f=>f.id===c.analyst_film_id)?.title} · pred ${c.analyst_prediction}M</span>
                          <span style={{fontSize:'10px', color:'#4A5168'}}>→ {c.analyst_result||'pending'}</span>
                          {!c.analyst_result && <>
                            <button style={{...S.btn, background:S.green, color:'#000', fontSize:'8px', padding:'2px 8px'}} onClick={async () => { await supabase.from('chips').update({analyst_result:'win'}).eq('player_id',c.player_id); notify('Analyst WIN', S.green); loadData() }}>Win</button>
                            <button style={{...S.btn, background:S.red, color:'#fff', fontSize:'8px', padding:'2px 8px'}} onClick={async () => { await supabase.from('chips').update({analyst_result:'lose'}).eq('player_id',c.player_id); notify('Analyst LOSE', S.red); loadData() }}>Lose</button>
                          </>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {notif && <div style={{position:'fixed', bottom:'20px', right:'20px', background:'#0C0E12', border:`1px solid ${notif.col}`, borderRadius:'9px', padding:'11px 16px', fontSize:'11px', zIndex:600, maxWidth:'300px'}}>{notif.msg}</div>}

      {/* TRAILER */}
      {trailerFilm && (
        <div style={{position:'fixed', inset:0, background:'#000000EE', display:'flex', alignItems:'center', justifyContent:'center', zIndex:700, padding:'20px'}} onClick={() => setTrailerFilm(null)}>
          <div style={{width:'100%', maxWidth:'800px'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
              <div style={{fontSize:'14px', fontWeight:700}}>{trailerFilm.title}</div>
              <button style={{background:'none', border:'1px solid #2A2F3C', color:'#4A5168', borderRadius:'6px', padding:'4px 12px', cursor:'pointer', fontFamily:'DM Mono, monospace', fontSize:'11px'}} onClick={() => setTrailerFilm(null)}>✕</button>
            </div>
            <div style={{position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:'10px'}}>
              <iframe src={`${trailerFilm.trailer}?autoplay=1`} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:'10px'}} allow="autoplay; fullscreen" allowFullScreen />
            </div>
          </div>
        </div>
      )}

      {/* ADD FILM MODAL */}
      {addFilmModal && (
        <div style={{position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'center', justifyContent:'center', zIndex:700, padding:'20px'}} onClick={() => setAddFilmModal(false)}>
          <div style={{background:'#0C0E12', border:'1px solid #2A2F3C', borderRadius:'14px', padding:'24px', width:'480px', maxWidth:'96vw', maxHeight:'90vh', overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{fontSize:'16px', fontWeight:800, marginBottom:'16px', color:S.green}}>+ Add New Film</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px'}}>
              {[['Title','title','text','Thunderbolts*'],['Distributor','dist','text','Marvel'],['Franchise','franchise','text','MCU'],['Star Actor','starActor','text','Florence Pugh'],['IPO Price $M','basePrice','number','42'],['Est Opening $M','estM','number','88'],['RT Score %','rt','number','82'],['Release Week','week','number','1'],['Phase (1-5)','phase','number','1']].map(([label, field, type, placeholder]) => (
                <div key={field} style={{gridColumn: field==='title'||field==='dist'?'1/-1':'auto'}}>
                  <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'4px'}}>{label.toUpperCase()}</div>
                  <input type={type} placeholder={placeholder} value={newFilm[field]||''} style={{...S.inp}} onChange={e => setNewFilm(prev => ({...prev, [field]: type==='number' ? parseFloat(e.target.value)||'' : e.target.value}))} />
                </div>
              ))}
              <div>
                <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'4px'}}>GENRE</div>
                <select value={newFilm.genre} style={{...S.inp}} onChange={e => setNewFilm(prev => ({...prev, genre: e.target.value}))}>
                  {Object.keys(GENRE_COL).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'8px', paddingTop:'16px'}}>
                <input type="checkbox" checked={newFilm.sleeper} id="sleeper-check" onChange={e => setNewFilm(prev => ({...prev, sleeper: e.target.checked}))} />
                <label htmlFor="sleeper-check" style={{fontSize:'11px', color:'#4A5168', cursor:'pointer'}}>Sleeper pick</label>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'4px'}}>TRAILER URL</div>
                <input type="text" placeholder="https://www.youtube.com/embed/..." value={newFilm.trailer} style={{...S.inp}} onChange={e => setNewFilm(prev => ({...prev, trailer: e.target.value}))} />
              </div>
            </div>
            <div style={{display:'flex', gap:'8px'}}>
              <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', flex:1}} onClick={() => setAddFilmModal(false)}>Cancel</button>
              <button style={{...S.btn, background:S.green, color:'#000', flex:1, fontWeight:700}} onClick={() => {
                if (!newFilm.title || !newFilm.dist) return notify('Title and distributor required', S.red)
                const id = 'f' + Date.now().toString(36)
                const film = { ...newFilm, id, basePrice: Number(newFilm.basePrice)||20, estM: Number(newFilm.estM)||30, rt: newFilm.rt!==''?Number(newFilm.rt):null, week: Number(newFilm.week)||1, phase: Number(newFilm.phase)||1, franchise: newFilm.franchise||null, starActor: newFilm.starActor||null }
                setFilms(prev => [...prev, film])
                setNewFilm({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:''})
                setAddFilmModal(false)
                notify(`✅ ${film.title} added`, S.green)
              }}>Add Film</button>
            </div>
          </div>
        </div>
      )}

      {/* CHIP MODALS */}
      {chipModal && (
        <div style={{position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'center', justifyContent:'center', zIndex:700, padding:'20px'}} onClick={() => setChipModal(null)}>
          <div style={{background:'#0C0E12', border:'1px solid #2A2F3C', borderRadius:'14px', padding:'24px', width:'420px', maxWidth:'96vw', maxHeight:'90vh', overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            {chipModal === 'short' && (
              <div>
                <div style={{fontSize:'16px', fontWeight:800, color:S.red, marginBottom:'6px'}}>📉 The Short</div>
                <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'16px', lineHeight:1.6}}>Pick a bomb. Under 60% of estimate = +100pts. Hits = −30pts. First come, first served.</div>
                <div style={{marginBottom:'10px'}}>
                  <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'5px'}}>SELECT FILM</div>
                  <select id="short-film" style={{...S.inp}}>
                    {films.filter(f => !results[f.id] && !allChips.find(c => c.short_film_id === f.id)).map(f => <option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'5px'}}>YOUR PREDICTION ($M)</div>
                  <input type="number" id="short-pred" placeholder="e.g. 18" style={{...S.inp}} />
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', flex:1}} onClick={() => setChipModal(null)}>Cancel</button>
                  <button style={{...S.btn, background:S.red, color:'#fff', flex:1}} onClick={() => { const filmId = document.getElementById('short-film').value; const pred = parseFloat(document.getElementById('short-pred').value); activateShort(filmId, pred) }}>Confirm</button>
                </div>
              </div>
            )}
            {chipModal === 'analyst' && (
              <div>
                <div style={{fontSize:'16px', fontWeight:800, color:S.blue, marginBottom:'6px'}}>🎯 The Analyst</div>
                <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'16px', lineHeight:1.6}}>Predict opening within 10%. Correct = triple points. Must own the film.</div>
                <div style={{marginBottom:'10px'}}>
                  <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'5px'}}>SELECT FILM (owned, unreleased)</div>
                  <select id="analyst-film" style={{...S.inp}}>
                    {myPhaseRoster.filter(r => !results[r.film_id] && !allChips.find(c => c.analyst_film_id === r.film_id)).map(r => {
                      const film = films.find(f => f.id === r.film_id)
                      return film ? <option key={film.id} value={film.id}>{film.title} (Est ${film.estM}M)</option> : null
                    })}
                  </select>
                </div>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'5px'}}>YOUR PREDICTION ($M)</div>
                  <input type="number" id="analyst-pred" placeholder="e.g. 92" style={{...S.inp}} />
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', flex:1}} onClick={() => setChipModal(null)}>Cancel</button>
                  <button style={{...S.btn, background:S.blue, color:'#fff', flex:1}} onClick={() => { const filmId = document.getElementById('analyst-film').value; const pred = parseFloat(document.getElementById('analyst-pred').value); if (isNaN(pred)) return notify('Enter a prediction', S.red); activateAnalyst(filmId, pred) }}>Confirm</button>
                </div>
              </div>
            )}
            {chipModal === 'auteur' && (
              <div>
                <div style={{fontSize:'16px', fontWeight:800, color:S.orange, marginBottom:'6px'}}>🎭 The Auteur</div>
                <div style={{fontSize:'10px', color:'#4A5168', marginBottom:'16px', lineHeight:1.6}}>Declare 2+ films with the same star actor. Each earns +10% opening points.</div>
                <div style={{marginBottom:'10px'}}>
                  <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'5px'}}>STAR ACTOR</div>
                  <input type="text" id="auteur-actor" placeholder="e.g. Tom Cruise" style={{...S.inp}} />
                </div>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'8px', color:'#4A5168', letterSpacing:'1px', marginBottom:'8px'}}>SELECT FILMS (min 2, from your roster)</div>
                  <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                    {myPhaseRoster.map(r => {
                      const film = films.find(f => f.id === r.film_id)
                      if (!film) return null
                      return (
                        <label key={r.film_id} style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'11px'}}>
                          <input type="checkbox" value={film.id} name="auteur-film" style={{cursor:'pointer'}} />
                          {film.title} {film.starActor ? `(${film.starActor})` : ''}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button style={{...S.btn, background:'#12141A', border:'1px solid #2A2F3C', color:'#4A5168', flex:1}} onClick={() => setChipModal(null)}>Cancel</button>
                  <button style={{...S.btn, background:S.orange, color:'#000', flex:1, fontWeight:700}} onClick={() => {
                    const actor = document.getElementById('auteur-actor').value.trim()
                    if (!actor) return notify('Enter actor name', S.red)
                    const checked = [...document.querySelectorAll('input[name="auteur-film"]:checked')].map(el => el.value)
                    if (checked.length < 2) return notify('Select at least 2 films', S.red)
                    submitAuteur(actor, checked)
                  }}>Declare</button>
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
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'https://boxd-league-v2.vercel.app' } })
    if (error) alert(error.message); else setSent(true)
    setLoading(false)
  }
  if (sent) return <div style={{minHeight:'100vh', background:'#07080B', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace'}}><div style={{textAlign:'center'}}><div style={{fontSize:'48px', fontWeight:900, color:'#F0B429', marginBottom:'16px'}}>BOXD</div><div style={{color:'#F2EEE8', marginBottom:'8px'}}>Check your email</div><div style={{color:'#4A5168', fontSize:'12px'}}>Magic link sent to {email}</div></div></div>
  return (
    <div style={{minHeight:'100vh', background:'#07080B', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace'}}>
      <div style={{width:'320px'}}>
        <div style={{fontSize:'48px', fontWeight:900, color:'#F0B429', marginBottom:'8px'}}>BOXD</div>
        <div style={{color:'#4A5168', fontSize:'11px', letterSpacing:'3px', marginBottom:'32px'}}>FANTASY BOX OFFICE</div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required style={{width:'100%', background:'#12141A', border:'1px solid #2A2F3C', color:'white', borderRadius:'8px', padding:'12px', fontSize:'13px', fontFamily:'monospace', marginBottom:'10px', outline:'none'}} />
          <button type="submit" disabled={loading} style={{width:'100%', background:'#F0B429', color:'#000', border:'none', borderRadius:'8px', padding:'12px', fontSize:'12px', fontWeight:700, cursor:'pointer', letterSpacing:'1px', fontFamily:'monospace'}}>{loading ? 'SENDING...' : 'SEND MAGIC LINK'}</button>
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
    e.preventDefault(); if (!name.trim()) return; setLoading(true)
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
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required style={{width:'100%', background:'#12141A', border:'1px solid #2A2F3C', color:'white', borderRadius:'8px', padding:'12px', fontSize:'13px', fontFamily:'monospace', marginBottom:'14px', outline:'none'}} />
          <div style={{fontSize:'9px', color:'#4A5168', letterSpacing:'1px', marginBottom:'8px'}}>PICK YOUR COLOUR</div>
          <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
            {COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{width:'28px', height:'28px', borderRadius:'50%', background:c, cursor:'pointer', border:color===c?'2px solid white':'2px solid transparent'}} />)}
          </div>
          <button type="submit" disabled={loading} style={{width:'100%', background:'#F0B429', color:'#000', border:'none', borderRadius:'8px', padding:'12px', fontSize:'12px', fontWeight:700, cursor:'pointer', letterSpacing:'1px', fontFamily:'monospace'}}>{loading ? 'CREATING...' : 'JOIN LEAGUE'}</button>
        </form>
      </div>
    </div>
  )
}
