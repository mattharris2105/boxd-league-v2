import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

const S = {
  app: { minHeight:'100vh', background:'#07080B', color:'#F2EEE8', fontFamily:'DM Mono, monospace' },
  topbar: { background:'#0C0E12', borderBottom:'1px solid #1E222C', padding:'0 16px', height:'52px', display:'flex', alignItems:'center', gap:'10px', position:'sticky', top:0, zIndex:100 },
  main: { flex:1, padding:'16px', overflowY:'auto', minWidth:0 },
  card: { background:'#0C0E12', border:'1px solid #1E222C', borderRadius:'11px', padding:'14px', marginBottom:'10px' },
  btn: { border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'11px', letterSpacing:'1px', fontFamily:'DM Mono, monospace', cursor:'pointer', textTransform:'uppercase' },
  inp: { background:'#12141A', border:'1px solid #2A2F3C', color:'#F2EEE8', borderRadius:'7px', padding:'9px 12px', fontSize:'12px', fontFamily:'DM Mono, monospace', width:'100%', outline:'none' },
  gold: '#F0B429', green: '#2DD67A', red: '#FF4757', blue: '#4D9EFF', purple: '#A855F7', orange: '#FF8C3D',
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

const FILMS_DEFAULT = [
  {id:'f001',title:'We Bury the Dead',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,phase:1,week:1,basePrice:8,estM:14,rt:null,sleeper:false,trailer:''},
  {id:'f002',title:'Greenland 2: Migration',dist:'Lionsgate',genre:'Action',franchise:'Greenland',starActor:'Gerard Butler',phase:1,week:1,basePrice:16,estM:30,rt:null,sleeper:false,trailer:''},
  {id:'f003',title:'Primate',dist:'Universal',genre:'Thriller',franchise:null,starActor:null,phase:1,week:1,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f004',title:'28 Years Later: The Bone Temple',dist:'Sony',genre:'Horror',franchise:'28 Days',starActor:"Jack O'Connell",phase:1,week:2,basePrice:24,estM:45,rt:null,sleeper:false,trailer:''},
  {id:'f005',title:"Dead Man's Wire",dist:'WB',genre:'Thriller',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f006',title:'Killer Whale',dist:'Paramount',genre:'Thriller',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f007',title:'Night Patrol',dist:'Sony',genre:'Action',franchise:null,starActor:null,phase:1,week:2,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f008',title:'Return to Silent Hill',dist:'Sony',genre:'Horror',franchise:'Silent Hill',starActor:null,phase:1,week:3,basePrice:12,estM:22,rt:null,sleeper:false,trailer:''},
  {id:'f009',title:'Mercy',dist:'Netflix',genre:'Thriller',franchise:null,starActor:null,phase:1,week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f010',title:'Send Help',dist:'Universal',genre:'Horror',franchise:null,starActor:'Rachel McAdams',phase:1,week:3,basePrice:14,estM:26,rt:null,sleeper:true,trailer:''},
  {id:'f011',title:'Iron Lung',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:1,week:3,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f012',title:'The Strangers: Chapter 3',dist:'Lionsgate',genre:'Horror',franchise:'The Strangers',starActor:null,phase:1,week:5,basePrice:12,estM:22,rt:null,sleeper:false,trailer:''},
  {id:'f013',title:'Dracula: A Love Tale',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,week:5,basePrice:18,estM:34,rt:null,sleeper:false,trailer:''},
  {id:'f014',title:'Whistle',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:1,week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f015',title:"Good Luck Have Fun Don't Die",dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:null,phase:1,week:5,basePrice:12,estM:22,rt:null,sleeper:true,trailer:''},
  {id:'f016',title:'Cold Storage',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:1,week:5,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f017',title:'GOAT',dist:'Sony Animation',genre:'Animation',franchise:null,starActor:null,phase:1,week:5,basePrice:14,estM:26,rt:null,sleeper:true,trailer:''},
  {id:'f018',title:'Wuthering Heights',dist:'WB',genre:'Drama',franchise:null,starActor:'Margot Robbie',phase:1,week:6,basePrice:32,estM:58,rt:null,sleeper:false,trailer:''},
  {id:'f019',title:'Crime 101',dist:'A24',genre:'Thriller',franchise:null,starActor:'Glen Powell',phase:1,week:6,basePrice:12,estM:22,rt:null,sleeper:true,trailer:''},
  {id:'f020',title:'Psycho Killer',dist:'Universal',genre:'Horror',franchise:null,starActor:null,phase:1,week:7,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f021',title:'I Can Only Imagine 2',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:7,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f022',title:'Dreams',dist:'Universal',genre:'Drama',franchise:null,starActor:'Glen Powell',phase:1,week:7,basePrice:18,estM:34,rt:null,sleeper:true,trailer:''},
  {id:'f023',title:'Scream 7',dist:'Paramount',genre:'Horror',franchise:'Scream',starActor:'Neve Campbell',phase:1,week:8,basePrice:24,estM:45,rt:null,sleeper:false,trailer:''},
  {id:'f024',title:"Dr Seuss' The Cat in the Hat",dist:'WB',genre:'Animation',franchise:null,starActor:'Bill Hader',phase:1,week:8,basePrice:18,estM:34,rt:null,sleeper:false,trailer:''},
  {id:'f025',title:'Hoppers',dist:'Disney/Pixar',genre:'Animation',franchise:null,starActor:null,phase:1,week:9,basePrice:26,estM:50,rt:97,sleeper:false,trailer:''},
  {id:'f026',title:'The Bride!',dist:'Universal',genre:'Horror',franchise:null,starActor:'Christian Bale',phase:1,week:9,basePrice:16,estM:30,rt:null,sleeper:false,trailer:''},
  {id:'f027',title:'Peaky Blinders: The Immortal Man',dist:'Netflix',genre:'Drama',franchise:'Peaky Blinders',starActor:'Cillian Murphy',phase:1,week:9,basePrice:14,estM:26,rt:null,sleeper:false,trailer:''},
  {id:'f028',title:'The Breadwinner',dist:'GKIDS',genre:'Animation',franchise:null,starActor:null,phase:1,week:10,basePrice:7,estM:12,rt:null,sleeper:true,trailer:''},
  {id:'f029',title:'Reminders of Him',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:1,week:10,basePrice:12,estM:22,rt:null,sleeper:true,trailer:''},
  {id:'f030',title:'Project Hail Mary',dist:'Amazon MGM',genre:'Sci-Fi',franchise:null,starActor:'Ryan Gosling',phase:1,week:11,basePrice:55,estM:80,rt:95,sleeper:false,trailer:''},
  {id:'f031',title:'They Will Kill You',dist:'Amazon MGM',genre:'Horror',franchise:null,starActor:'Zazie Beetz',phase:1,week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f032',title:'Romeo + Juliet (30th Anniversary)',dist:'Paramount',genre:'Drama',franchise:null,starActor:null,phase:1,week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:''},
  {id:'f033',title:'Splittsville',dist:'Lionsgate',genre:'Comedy',franchise:null,starActor:null,phase:1,week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f034',title:'The Magic Faraway Tree',dist:'StudioCanal',genre:'Family',franchise:null,starActor:null,phase:1,week:11,basePrice:12,estM:22,rt:null,sleeper:false,trailer:''},
  {id:'f035',title:'Bluey At The Cinema',dist:'Lionsgate',genre:'Family',franchise:'Bluey',starActor:null,phase:1,week:11,basePrice:8,estM:16,rt:null,sleeper:false,trailer:''},
  {id:'f036',title:'Ready or Not 2: Here I Come',dist:'Searchlight',genre:'Horror',franchise:null,starActor:'Samara Weaving',phase:1,week:11,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f037',title:'Forbidden Fruits',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:'Lola Tung',phase:1,week:11,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f038',title:'The Super Mario Galaxy Movie',dist:'Universal/Illumination',genre:'Animation',franchise:'Mario',starActor:'Jack Black',phase:1,week:13,basePrice:52,estM:100,rt:null,sleeper:false,trailer:''},
  {id:'f039',title:'The Drama',dist:'A24',genre:'Drama',franchise:null,starActor:null,phase:1,week:13,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f040',title:'Fuze',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:1,week:13,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f041',title:'Amelie (25th Anniversary)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:13,basePrice:6,estM:10,rt:null,sleeper:false,trailer:''},
  {id:'f042',title:'You Me & Tuscany',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:1,week:14,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f043',title:'Undertone',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:1,week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f044',title:"California Schemin'",dist:'A24',genre:'Drama',franchise:null,starActor:null,phase:1,week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f045',title:'Father Mother Sister Brother',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:14,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f046',title:"Lee Cronin's The Mummy",dist:'Universal',genre:'Horror',franchise:'Mummy',starActor:'Jack Reynor',phase:1,week:15,basePrice:20,estM:38,rt:null,sleeper:false,trailer:''},
  {id:'f047',title:'Glenorchy',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:1,week:15,basePrice:7,estM:12,rt:null,sleeper:true,trailer:''},
  {id:'f048',title:'Michael',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jaafar Jackson',phase:1,week:16,basePrice:26,estM:48,rt:null,sleeper:false,trailer:''},
  {id:'f049',title:'Exit 8',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:1,week:16,basePrice:7,estM:12,rt:null,sleeper:true,trailer:''},
  {id:'f050',title:'Mother Mary',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:1,week:16,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f051',title:'Hiroyuki',dist:'Sony',genre:'Family',franchise:null,starActor:null,phase:1,week:16,basePrice:7,estM:12,rt:null,sleeper:true,trailer:''},
  {id:'f052',title:'The Devil Wears Prada 2',dist:'Disney/20th',genre:'Comedy',franchise:'Prada',starActor:'Meryl Streep',phase:2,week:17,basePrice:50,estM:80,rt:null,sleeper:false,trailer:''},
  {id:'f053',title:'Hokum',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:2,week:17,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f054',title:'Iron Maiden: Burning Ambition',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Iron Maiden',phase:2,week:17,basePrice:12,estM:22,rt:null,sleeper:false,trailer:''},
  {id:'f055',title:'Mortal Kombat II',dist:'WB/New Line',genre:'Action',franchise:'Mortal Kombat',starActor:'Lewis Tan',phase:2,week:18,basePrice:28,estM:52,rt:null,sleeper:false,trailer:''},
  {id:'f056',title:'The Sheep Detectives',dist:'Lionsgate',genre:'Family',franchise:null,starActor:null,phase:2,week:18,basePrice:10,estM:18,rt:null,sleeper:false,trailer:''},
  {id:'f057',title:'Billie Eilish: Hit Me Hard And Soft Tour',dist:'Paramount',genre:'Concert',franchise:null,starActor:'Billie Eilish',phase:2,week:18,basePrice:12,estM:22,rt:null,sleeper:false,trailer:''},
  {id:'f058',title:'Top Gun (40th Anniversary)',dist:'Paramount',genre:'Action',franchise:'Top Gun',starActor:'Tom Cruise',phase:2,week:19,basePrice:14,estM:26,rt:null,sleeper:false,trailer:''},
  {id:'f059',title:'Obsession',dist:'Focus',genre:'Thriller',franchise:null,starActor:null,phase:2,week:19,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f060',title:'Normal',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:2,week:19,basePrice:7,estM:12,rt:null,sleeper:true,trailer:''},
  {id:'f061',title:'The Christophers',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,week:19,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f062',title:'500 Miles (Ireland)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,week:19,basePrice:6,estM:10,rt:null,sleeper:true,trailer:''},
  {id:'f063',title:'Charlie The Wonderdog',dist:'Universal',genre:'Family',franchise:null,starActor:null,phase:2,week:20,basePrice:8,estM:14,rt:null,sleeper:false,trailer:''},
  {id:'f064',title:'The Mandalorian & Grogu',dist:'Disney/Lucasfilm',genre:'Action',franchise:'Star Wars',starActor:'Pedro Pascal',phase:2,week:20,basePrice:70,estM:135,rt:null,sleeper:false,trailer:''},
  {id:'f065',title:'Finding Emily',dist:'Paramount',genre:'Comedy',franchise:null,starActor:null,phase:2,week:20,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f066',title:'Passenger',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,week:20,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f067',title:'Tom & Jerry: Forbidden Compass HFSS',dist:'WB',genre:'Animation',franchise:'Tom & Jerry',starActor:null,phase:2,week:20,basePrice:16,estM:30,rt:null,sleeper:false,trailer:''},
  {id:'f068',title:'Power Ballad',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:2,week:21,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f069',title:'Tuner',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,week:21,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f070',title:'Savage House',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:null,phase:2,week:22,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f071',title:'Masters of the Universe',dist:'Amazon MGM',genre:'Action',franchise:'MOTU',starActor:'Nicholas Galitzine',phase:2,week:22,basePrice:35,estM:65,rt:null,sleeper:false,trailer:''},
  {id:'f072',title:'Scary Movie 6',dist:'Paramount',genre:'Comedy',franchise:'Scary Movie',starActor:null,phase:2,week:22,basePrice:12,estM:22,rt:null,sleeper:false,trailer:''},
  {id:'f073',title:'Animal Friends',dist:'Universal',genre:'Animation',franchise:null,starActor:null,phase:2,week:22,basePrice:14,estM:26,rt:null,sleeper:true,trailer:''},
  {id:'f074',title:'Disclosure Day',dist:'Sony',genre:'Sci-Fi',franchise:null,starActor:null,phase:2,week:23,basePrice:20,estM:38,rt:null,sleeper:true,trailer:''},
  {id:'f075',title:'Toy Story 5',dist:'Disney/Pixar',genre:'Animation',franchise:'Toy Story',starActor:'Tom Hanks',phase:2,week:24,basePrice:75,estM:145,rt:null,sleeper:false,trailer:''},
  {id:'f076',title:'Supergirl',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Milly Alcock',phase:2,week:25,basePrice:52,estM:98,rt:null,sleeper:false,trailer:''},
  {id:'f077',title:'Untitled Jackass Event Film',dist:'Paramount',genre:'Comedy',franchise:'Jackass',starActor:null,phase:2,week:25,basePrice:18,estM:34,rt:null,sleeper:false,trailer:''},
  {id:'f078',title:'500 Miles (England/Scotland/Wales)',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:2,week:25,basePrice:8,estM:16,rt:null,sleeper:false,trailer:''},
  {id:'f079',title:'Minions & Monsters',dist:'Universal/Illumination',genre:'Animation',franchise:'Despicable Me',starActor:'Steve Carell',phase:2,week:26,basePrice:58,estM:110,rt:null,sleeper:false,trailer:''},
  {id:'f080',title:'The Movie',dist:'TBC',genre:'Action',franchise:null,starActor:null,phase:2,week:27,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f081',title:'Moana (Live Action)',dist:'Disney',genre:'Family',franchise:'Moana',starActor:'Dwayne Johnson',phase:2,week:27,basePrice:62,estM:118,rt:null,sleeper:false,trailer:''},
  {id:'f082',title:'Alpha',dist:'Sony',genre:'Action',franchise:null,starActor:'Michael B Jordan',phase:2,week:27,basePrice:18,estM:32,rt:null,sleeper:false,trailer:''},
  {id:'f083',title:'The Odyssey',dist:'Universal/Nolan',genre:'Drama',franchise:null,starActor:'Matt Damon',phase:2,week:27,basePrice:60,estM:115,rt:null,sleeper:false,trailer:''},
  {id:'f084',title:'Cut Off',dist:'A24',genre:'Thriller',franchise:null,starActor:null,phase:2,week:27,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f085',title:'Evil Dead Burn',dist:'Sony',genre:'Horror',franchise:'Evil Dead',starActor:null,phase:2,week:27,basePrice:16,estM:30,rt:null,sleeper:false,trailer:''},
  {id:'f086',title:'Spider-Man: Brand New Day',dist:'Sony/Marvel',genre:'Action',franchise:'Spider-Man',starActor:'Tom Holland',phase:2,week:27,basePrice:85,estM:165,rt:null,sleeper:false,trailer:''},
  {id:'f087',title:'Super Troopers 3',dist:'Fox',genre:'Comedy',franchise:'Super Troopers',starActor:null,phase:2,week:31,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f088',title:'Fall 2',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:2,week:31,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f089',title:'Paw Patrol: The Dino Movie HFSS',dist:'Paramount',genre:'Family',franchise:'Paw Patrol',starActor:null,phase:2,week:32,basePrice:16,estM:30,rt:null,sleeper:false,trailer:''},
  {id:'f090',title:'Flowervale Street',dist:'Focus',genre:'Drama',franchise:null,starActor:null,phase:2,week:32,basePrice:7,estM:12,rt:null,sleeper:true,trailer:''},
  {id:'f091',title:'The End of Oak Street',dist:'Universal',genre:'Adventure',franchise:null,starActor:null,phase:2,week:33,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f092',title:'Insidious: The Bleeding World',dist:'Sony/Blumhouse',genre:'Horror',franchise:'Insidious',starActor:'Lin Shaye',phase:2,week:33,basePrice:14,estM:28,rt:null,sleeper:false,trailer:''},
  {id:'f093',title:'Mutiny',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:2,week:33,basePrice:12,estM:22,rt:null,sleeper:true,trailer:''},
  {id:'f094',title:'Spa Weekend',dist:'Sony',genre:'Comedy',franchise:null,starActor:null,phase:2,week:33,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f095',title:'Teenage Sex and Death at Camp Miasma',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:2,week:33,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f096',title:'The Dog Stars',dist:'20th Century',genre:'Sci-Fi',franchise:null,starActor:'Jacob Elordi',phase:2,week:33,basePrice:18,estM:34,rt:null,sleeper:true,trailer:''},
  {id:'f097',title:'Cliffhanger',dist:'Sony',genre:'Action',franchise:null,starActor:null,phase:2,week:33,basePrice:18,estM:34,rt:null,sleeper:false,trailer:''},
  {id:'f098',title:'One Night Only',dist:'Lionsgate',genre:'Thriller',franchise:null,starActor:null,phase:2,week:33,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f099',title:'How to Rob a Bank',dist:'Netflix',genre:'Comedy',franchise:null,starActor:null,phase:3,week:35,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f100',title:'Pressure',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:3,week:36,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f101',title:'A Practical Magic Film',dist:'WB',genre:'Horror',franchise:'Practical Magic',starActor:'Sandra Bullock',phase:3,week:36,basePrice:22,estM:42,rt:null,sleeper:false,trailer:''},
  {id:'f102',title:'Clayface',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Tom Rhys Harries',phase:3,week:36,basePrice:30,estM:55,rt:null,sleeper:false,trailer:''},
  {id:'f103',title:'Resident Evil',dist:'Sony',genre:'Horror',franchise:'Resident Evil',starActor:null,phase:3,week:37,basePrice:22,estM:42,rt:null,sleeper:false,trailer:''},
  {id:'f104',title:'Bad Apples',dist:'Paramount',genre:'Horror',franchise:null,starActor:null,phase:3,week:37,basePrice:8,estM:16,rt:null,sleeper:true,trailer:''},
  {id:'f105',title:'Sense and Sensibility',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:3,week:38,basePrice:12,estM:22,rt:null,sleeper:true,trailer:''},
  {id:'f106',title:'Avengers: Endgame (Re-release)',dist:'Disney',genre:'Action',franchise:'MCU',starActor:'Robert Downey Jr',phase:3,week:38,basePrice:15,estM:28,rt:96,sleeper:false,trailer:''},
  {id:'f107',title:'Verity',dist:'Amazon MGM',genre:'Thriller',franchise:null,starActor:'Blake Lively',phase:3,week:39,basePrice:16,estM:30,rt:null,sleeper:false,trailer:''},
  {id:'f108',title:'Digger',dist:'Paramount',genre:'Comedy',franchise:null,starActor:'Tom Cruise',phase:3,week:39,basePrice:20,estM:38,rt:null,sleeper:false,trailer:''},
  {id:'f109',title:'The Social Reckoning',dist:'Universal',genre:'Drama',franchise:null,starActor:'Jeremy Strong',phase:3,week:40,basePrice:22,estM:42,rt:null,sleeper:false,trailer:''},
  {id:'f110',title:'Other Mommy',dist:'Blumhouse',genre:'Horror',franchise:null,starActor:null,phase:3,week:40,basePrice:8,estM:16,rt:null,sleeper:true,trailer:''},
  {id:'f111',title:'The Legend of Aang',dist:'Paramount',genre:'Animation',franchise:'Avatar: TLA',starActor:'Eric Nam',phase:3,week:40,basePrice:35,estM:65,rt:null,sleeper:false,trailer:''},
  {id:'f112',title:'Street Fighter',dist:'Paramount',genre:'Action',franchise:'Street Fighter',starActor:'Andrew Koji',phase:3,week:41,basePrice:22,estM:42,rt:null,sleeper:false,trailer:''},
  {id:'f113',title:'Whalefall',dist:'Sony',genre:'Drama',franchise:null,starActor:null,phase:3,week:41,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f114',title:'Wildwood',dist:'Focus',genre:'Adventure',franchise:null,starActor:null,phase:3,week:41,basePrice:12,estM:22,rt:null,sleeper:true,trailer:''},
  {id:'f115',title:'Forgotten Island',dist:'Universal',genre:'Family',franchise:null,starActor:null,phase:3,week:42,basePrice:16,estM:28,rt:null,sleeper:true,trailer:''},
  {id:'f116',title:'Wife & Dog',dist:'Universal',genre:'Comedy',franchise:null,starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f117',title:'Clayface (Wide)',dist:'DC/WB',genre:'Action',franchise:'DCU',starActor:'Naomi Ackie',phase:3,week:42,basePrice:28,estM:52,rt:null,sleeper:false,trailer:''},
  {id:'f118',title:'Ghosts: The Possession of Button House',dist:'Lionsgate',genre:'Horror',franchise:'Ghosts',starActor:null,phase:3,week:42,basePrice:10,estM:18,rt:null,sleeper:false,trailer:''},
  {id:'f119',title:'Animal',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f120',title:'Tad and the Magic Lamp',dist:'Paramount',genre:'Animation',franchise:'Tad',starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:false,trailer:''},
  {id:'f121',title:'Remain',dist:'A24',genre:'Horror',franchise:null,starActor:null,phase:3,week:42,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f122',title:'Terrifier 4',dist:'Cineverse',genre:'Horror',franchise:'Terrifier',starActor:null,phase:3,week:42,basePrice:10,estM:20,rt:null,sleeper:false,trailer:''},
  {id:'f123',title:'Wild Horse Nine',dist:'WDi',genre:'Drama',franchise:null,starActor:null,phase:4,week:43,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f124',title:'The Cat in the Hat HFSS',dist:'WB',genre:'Animation',franchise:null,starActor:'Bill Hader',phase:4,week:43,basePrice:20,estM:38,rt:null,sleeper:false,trailer:''},
  {id:'f125',title:'The Great Beyond',dist:'Searchlight',genre:'Drama',franchise:null,starActor:null,phase:4,week:45,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f126',title:'Ebenezer: A Christmas Carol',dist:'Disney',genre:'Animation',franchise:null,starActor:null,phase:4,week:45,basePrice:14,estM:26,rt:null,sleeper:false,trailer:''},
  {id:'f127',title:'The Hunger Games: Sunrise on the Reaping',dist:'Lionsgate',genre:'Action',franchise:'Hunger Games',starActor:'Joseph Zada',phase:4,week:46,basePrice:58,estM:110,rt:null,sleeper:false,trailer:''},
  {id:'f128',title:'I Play Rocky',dist:'Universal',genre:'Drama',franchise:null,starActor:null,phase:4,week:46,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f129',title:'Focker In-Law',dist:'Paramount',genre:'Comedy',franchise:'Fockers',starActor:'Ben Stiller',phase:4,week:46,basePrice:24,estM:45,rt:null,sleeper:false,trailer:''},
  {id:'f130',title:"Disney's Hexed HFSS",dist:'Disney',genre:'Horror',franchise:null,starActor:null,phase:4,week:47,basePrice:14,estM:26,rt:null,sleeper:true,trailer:''},
  {id:'f131',title:"Narnia: The Magician's Nephew",dist:'Netflix/Sony',genre:'Adventure',franchise:'Narnia',starActor:'Daniel Craig',phase:4,week:47,basePrice:50,estM:95,rt:null,sleeper:false,trailer:''},
  {id:'f132',title:'Violent Night 2',dist:'Universal',genre:'Action',franchise:'Violent Night',starActor:'David Harbour',phase:4,week:48,basePrice:22,estM:42,rt:null,sleeper:false,trailer:''},
  {id:'f133',title:'Jumanji 3',dist:'Sony',genre:'Action',franchise:'Jumanji',starActor:'Dwayne Johnson',phase:4,week:49,basePrice:44,estM:82,rt:null,sleeper:false,trailer:''},
  {id:'f134',title:'Dune: Part Three',dist:'WB',genre:'Sci-Fi',franchise:'Dune',starActor:'Timothée Chalamet',phase:4,week:49,basePrice:80,estM:155,rt:null,sleeper:false,trailer:''},
  {id:'f135',title:'Avengers: Doomsday',dist:'Marvel/Disney',genre:'Action',franchise:'MCU',starActor:'Robert Downey Jr',phase:4,week:50,basePrice:98,estM:210,rt:null,sleeper:false,trailer:''},
  {id:'f136',title:'The Angry Birds Movie 3 HFSS',dist:'Paramount',genre:'Animation',franchise:'Angry Birds',starActor:null,phase:4,week:51,basePrice:14,estM:28,rt:null,sleeper:false,trailer:''},
  {id:'f137',title:'King',dist:'Fox',genre:'Drama',franchise:null,starActor:null,phase:4,week:51,basePrice:10,estM:18,rt:null,sleeper:true,trailer:''},
  {id:'f138',title:'Werwulf',dist:'Lionsgate',genre:'Horror',franchise:null,starActor:null,phase:4,week:52,basePrice:8,estM:14,rt:null,sleeper:true,trailer:''},
  {id:'f139',title:'The Beekeeper 2',dist:'Amazon MGM',genre:'Action',franchise:null,starActor:'Jason Statham',phase:4,week:53,basePrice:18,estM:35,rt:null,sleeper:false,trailer:''},
  {id:'f140',title:'Children of Blood and Bone',dist:'Paramount',genre:'Action',franchise:null,starActor:null,phase:4,week:54,basePrice:22,estM:42,rt:null,sleeper:true,trailer:''},
  {id:'f141',title:'The Rescue',dist:'Disney',genre:'Drama',franchise:null,starActor:null,phase:4,week:55,basePrice:12,estM:22,rt:null,sleeper:true,trailer:''},
  {id:'f142',title:'The Thomas Crown Affair',dist:'Sony',genre:'Thriller',franchise:null,starActor:null,phase:5,week:57,basePrice:24,estM:45,rt:null,sleeper:false,trailer:''},
  {id:'f143',title:'Ice Age: Boiling Point HFSS',dist:'Disney/20th',genre:'Animation',franchise:'Ice Age',starActor:null,phase:5,week:58,basePrice:30,estM:58,rt:null,sleeper:false,trailer:''},
  {id:'f144',title:'The Nightingale',dist:'Universal',genre:'Drama',franchise:null,starActor:null,phase:5,week:58,basePrice:14,estM:26,rt:null,sleeper:true,trailer:''},
  {id:'f145',title:'Star Wars: A New Hope (50th Anniversary)',dist:'Disney',genre:'Action',franchise:'Star Wars',starActor:null,phase:5,week:59,basePrice:22,estM:42,rt:99,sleeper:false,trailer:''},
  {id:'f146',title:'Sonic the Hedgehog 4 HFSS',dist:'Paramount',genre:'Family',franchise:'Sonic',starActor:'Jim Carrey',phase:5,week:60,basePrice:34,estM:65,rt:null,sleeper:false,trailer:''},
  {id:'f147',title:'Untitled Mike Flanagan Exorcist Film',dist:'Lionsgate',genre:'Horror',franchise:'Exorcist',starActor:null,phase:5,week:61,basePrice:20,estM:38,rt:null,sleeper:false,trailer:''},
  {id:'f148',title:'The Resurrection of The Christ: Part One',dist:'Lionsgate',genre:'Drama',franchise:null,starActor:null,phase:5,week:62,basePrice:22,estM:42,rt:null,sleeper:false,trailer:''},
]

// ── SCORING FUNCTIONS ──
// UPDATED: Analyst = +60pts flat. Weekly W1-3=1pt/$1M, W4+=1.1pts/$1M

function calcMarketValue(film, actualM) {
  if (actualM == null) return film.basePrice
  const ratio = actualM / film.estM
  let m = ratio>=2?2.00:ratio>=1.5?1.60:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1.00:ratio>=0.80?0.85:ratio>=0.60?0.65:ratio>=0.40?0.45:0.25
  let rtMod = film.rt>=90?1.15:film.rt>=75?1.08:(film.rt<50&&film.rt!=null)?0.90:1.0
  let value = film.basePrice * m * rtMod
  return Math.round(Math.max(film.basePrice*0.15, Math.min(film.basePrice*3.0, value)))
}

function calcOpeningPts(film, actualM, isEarlyBird=false, isAnalyst=false) {
  if (actualM == null) return 0
  const ratio = actualM / film.estM
  let perfMult = ratio>=2?2.00:ratio>=1.5?1.60:ratio>=1.3?1.35:ratio>=1.1?1.15:ratio>=0.95?1.00:ratio>=0.80?0.85:ratio>=0.60?0.65:0.45
  let rtMod = film.rt>=90?1.25:film.rt>=75?1.10:(film.rt<50&&film.rt!=null)?0.85:1.0
  let pts = Math.round(actualM * perfMult * rtMod)
  if (isEarlyBird && ratio>=1.10) pts = Math.round(pts * 1.10)
  if (isAnalyst) pts = pts + 60  // UPDATED: flat +60 not triple
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
  const { data } = await supabase.from('results').select('film_id').eq('film_id', filmId)
  if (data && data.length > 0) return supabase.from('results').update({ actual_m: actualM }).eq('film_id', filmId)
  return supabase.from('results').insert({ film_id: filmId, actual_m: actualM })
}
async function dbUpsertFilmValue(filmId, value) {
  const { data } = await supabase.from('film_values').select('film_id').eq('film_id', filmId)
  if (data && data.length > 0) return supabase.from('film_values').update({ current_value: value }).eq('film_id', filmId)
  return supabase.from('film_values').insert({ film_id: filmId, current_value: value })
}
async function dbUpsertWeekly(filmId, weekNum, grossM) {
  const { data } = await supabase.from('weekly_grosses').select('id').eq('film_id', filmId).eq('week_num', weekNum)
  if (data && data.length > 0) return supabase.from('weekly_grosses').update({ gross_m: grossM }).eq('film_id', filmId).eq('week_num', weekNum)
  return supabase.from('weekly_grosses').insert({ film_id: filmId, week_num: weekNum, gross_m: grossM })
}

// ── SCORE BREAKDOWN MODAL ──
function ScoreBreakdownModal({film,holding,results,weeklyGrosses,allChips,auteurDeclarations,weekendWinners,isEarlyBird,onClose}) {
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
  const ebBonus = (earlyBird&&actual!=null&&actual/film.estM>=1.10) ? Math.round(baseOpen*0.10) : 0
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
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid #1E222C'}}>
      <div><div style={{fontSize:'11px',color:'#9AA0B2'}}>{label}</div>{sub&&<div style={{fontSize:'9px',color:'#4A5168',marginTop:'2px'}}>{sub}</div>}</div>
      <div style={{fontSize:'14px',fontWeight:700,color:col||'#F2EEE8'}}>{value}</div>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'#000000DD',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:800}} onClick={onClose}>
      <div style={{background:'#0C0E12',border:'1px solid #1E222C',borderRadius:'16px 16px 0 0',width:'100%',maxWidth:'520px',maxHeight:'88vh',overflowY:'auto',padding:'20px',paddingBottom:'calc(24px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin:'0 auto 16px'}}/>
        {/* Film header */}
        <div style={{position:'relative',overflow:'hidden',borderRadius:'10px',background:'#12141A',padding:'14px',marginBottom:'16px'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:genreCol}}/>
          <div style={{fontSize:'15px',fontWeight:700,marginTop:'4px'}}>{film.title}</div>
          <div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>{film.dist} · W{film.week} · Phase {film.phase}</div>
          {actual!=null&&(
            <div style={{marginTop:'10px',display:'flex',gap:'16px',flexWrap:'wrap'}}>
              <div><div style={{fontSize:'8px',color:'#4A5168'}}>ACTUAL</div><div style={{fontSize:'16px',color:'#2DD67A',fontWeight:700}}>${actual}M</div></div>
              <div><div style={{fontSize:'8px',color:'#4A5168'}}>EST</div><div style={{fontSize:'16px'}}>${film.estM}M</div></div>
              <div><div style={{fontSize:'8px',color:'#4A5168'}}>RATIO</div><div style={{fontSize:'16px',color:actual/film.estM>=1?'#2DD67A':'#FF4757',fontWeight:700}}>{(actual/film.estM).toFixed(2)}×</div></div>
              {film.rt!=null&&<div><div style={{fontSize:'8px',color:'#4A5168'}}>RT</div><div style={{fontSize:'16px',color:film.rt>=90?'#2DD67A':film.rt>=75?'#F0B429':'#FF4757',fontWeight:700}}>{film.rt}%</div></div>}
            </div>
          )}
        </div>
        {actual==null?(
          <div style={{textAlign:'center',color:'#4A5168',padding:'28px',fontSize:'12px'}}>No results yet — check back after opening weekend is entered.</div>
        ):(
          <>
            <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'6px'}}>POINTS BREAKDOWN</div>
            <Row label="Base opening pts" value={`+${baseOpen}`}
              sub={`$${actual}M × ${(actual/film.estM).toFixed(2)}× perf · RT ×${film.rt>=90?'1.25':film.rt>=75?'1.10':'1.00'}`}/>
            {earlyBird&&ebBonus>0&&<Row label="🐦 Early Bird +10%" value={`+${ebBonus}`} col="#2DD67A" sub="Bought 4+ weeks before release and overperformed"/>}
            {analystWin&&<Row label="🎯 Analyst chip bonus" value="+60" col="#4D9EFF" sub="Predicted opening within 10% — flat +60pts"/>}
            {auteur&&auteurBonus>0&&<Row label="🎭 Auteur +10%" value={`+${auteurBonus}`} col="#FF8C3D" sub="Declared same star actor across 2+ films"/>}
            {weeklyPts>0&&(
              <div style={{padding:'9px 0',borderBottom:'1px solid #1E222C'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <div style={{fontSize:'11px',color:'#9AA0B2'}}>Weekly grosses</div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'#4D9EFF'}}>+{weeklyPts}</div>
                </div>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'4px'}}>
                  {Object.entries(weeks).sort((a,b)=>Number(a[0])-Number(b[0])).map(([wk,gross])=>{
                    const rate=Number(wk)>=4?1.1:1.0
                    return(<div key={wk} style={{background:'#12141A',borderRadius:'5px',padding:'3px 8px',fontSize:'9px'}}>
                      <span style={{color:'#4A5168'}}>W{wk} ${gross}M → </span>
                      <span style={{color:'#4D9EFF'}}>+{Math.round(Number(gross)*rate)}</span>
                      {Number(wk)>=4&&<span style={{color:'#4A5168'}}> ×1.1</span>}
                    </div>)
                  })}
                </div>
                <div style={{fontSize:'9px',color:'#4A5168'}}>W1–W3: 1pt/$1M · W4+: 1.1pts/$1M</div>
              </div>
            )}
            {legsBonus>0&&<Row label="🦵 Legs bonus" value="+25" col="#2DD67A" sub={`W2 drop under 30% · $${weeks[2]}M from $${actual}M opening`}/>}
            {isWW&&<Row label="🥇 Weekend winner" value="+15" col="#F0B429" sub="#1 film at the box office"/>}
            {shortBonus!==0&&<Row label={shortBonus>0?'📉 Short — WIN':'📉 Short — LOSE'} value={shortBonus>0?'+100':'-30'} col={shortBonus>0?'#2DD67A':'#FF4757'}/>}
            <div style={{marginTop:'14px',background:'#12141A',borderRadius:'10px',padding:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:'11px',color:'#9AA0B2',letterSpacing:'1px',fontWeight:600}}>TOTAL POINTS</div>
              <div style={{fontSize:'32px',fontWeight:900,color:'#F0B429'}}>{total}</div>
            </div>
          </>
        )}
        <button style={{...S.btn,width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'#9AA0B2',marginTop:'12px',padding:'13px'}} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ── MOBILE BOTTOM NAV ──
function BottomNav({page,setPage,isCommissioner,onMore}) {
  const items=[['market','🎬','Market'],['roster','📁','Roster'],['chips','⚡','Chips'],['league','🥇','League'],['more','···','More']]
  return (
    <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#0C0E12',borderTop:'1px solid #1E222C',display:'flex',zIndex:200,paddingBottom:'env(safe-area-inset-bottom)'}}>
      {items.map(([id,ic,lb])=>(
        <div key={id} onClick={()=>id==='more'?onMore():setPage(id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 0 6px',cursor:'pointer',color:page===id?'#F0B429':'#4A5168'}}>
          <div style={{fontSize:'18px',lineHeight:1}}>{ic}</div>
          <div style={{fontSize:'9px',marginTop:'2px'}}>{lb}</div>
        </div>
      ))}
    </div>
  )
}

// ── MORE DRAWER ──
function MoreDrawer({page,setPage,isCommissioner,onClose}) {
  const extras=[['forecaster','📊','Forecaster'],['oscar','🏆','Oscars'],['results','📋','Results'],...(isCommissioner?[['commissioner','⚙️','Panel']]:[])]
  return (
    <div style={{position:'fixed',inset:0,background:'#000000CC',zIndex:300}} onClick={onClose}>
      <div style={{position:'absolute',bottom:0,left:0,right:0,background:'#0C0E12',borderTop:'1px solid #1E222C',borderRadius:'16px 16px 0 0',padding:'16px',paddingBottom:'calc(16px + env(safe-area-inset-bottom))'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:'36px',height:'4px',background:'#2A2F3C',borderRadius:'2px',margin:'0 auto 14px'}}/>
        {extras.map(([id,ic,lb])=>(
          <div key={id} onClick={()=>{setPage(id);onClose()}} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 10px',borderRadius:'8px',cursor:'pointer',marginBottom:'4px',background:page===id?'#F0B42914':'none',color:page===id?'#F0B429':'#F2EEE8'}}>
            <span style={{fontSize:'20px'}}>{ic}</span><span style={{fontSize:'13px'}}>{lb}</span>
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
  const [leagueConfig,setLeagueConfig]=useState({current_week:1,current_phase:1,currency:'$',tx_fee:5,phase_window_active:false,phase_window_opened_at:null,best_picture_winner:null})
  const [notif,setNotif]=useState(null)
  const [trailerFilm,setTrailerFilm]=useState(null)
  const [chipModal,setChipModal]=useState(null)
  const [addFilmModal,setAddFilmModal]=useState(false)
  const [newFilm,setNewFilm]=useState({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:''})
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
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false)})
    supabase.auth.onAuthStateChange((_e,session)=>setSession(session))
  },[])
  useEffect(()=>{if(session){loadProfile();loadData()}},[session])
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[])

  const notify=(msg,col=S.gold)=>{setNotif({msg,col});setTimeout(()=>setNotif(null),3000)}
  const isCommissioner=session?.user?.email===COMMISSIONER_EMAIL

  const loadProfile=async()=>{
    const{data}=await supabase.from('profiles').select('*').eq('id',session.user.id).single()
    if(data)setProfile(data)
  }

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
  const phaseSpent=(pid,ph)=>rosters.filter(r=>r.player_id===pid&&r.phase===ph&&r.active).reduce((s,r)=>s+r.bought_price,0)
  const budgetLeft=(pid)=>Math.max(0,phaseAllocated(pid,curPhase())-phaseSpent(pid,curPhase()))
  const bankBudget=async(pid,ph)=>{
    const alloc=phaseAllocated(pid,ph),spent=phaseSpent(pid,ph),banked=Math.max(0,alloc-spent)
    const ex=phaseBudgets.find(pb=>pb.player_id===pid&&pb.phase===ph)
    if(ex)await supabase.from('phase_budgets').update({budget_allocated:alloc,budget_spent:spent,budget_banked:banked}).eq('id',ex.id)
    else await supabase.from('phase_budgets').insert({player_id:pid,phase:ph,budget_allocated:alloc,budget_spent:spent,budget_banked:banked})
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
    return pfc.reduce((s,fc)=>s+Math.abs(fc.predicted_m-results[fc.film_id])/results[fc.film_id],0)/pfc.length
  }
  const forecasterBonusPts=(pid,ph)=>{
    const scores=players.map(p=>({id:p.id,score:forecasterPhasePts(p.id,ph)})).filter(x=>x.score!=null)
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
      total+=op+Math.round(weeklyPts(film.id))+legsBonus(film.id)+wwBonus(film.id)+shortBonus(pid,film.id)
    })
    return total+forecasterBonusPts(pid,ph)
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
    if(film.phase!==ph)return notify(`Film is Phase ${film.phase} — you are in Phase ${ph}`,S.red)
    if(rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active))return notify('Already in your roster',S.red)
    if(rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active).length>=MAX_ROSTER)return notify(`Phase roster full (${MAX_ROSTER} max)`,S.red)
    const price=filmVal(film),left=budgetLeft(profile.id)
    if(price>left)return notify(`Not enough budget ($${price}M needed, $${left}M left)`,S.red)
    const{error}=await supabase.from('rosters').insert({player_id:profile.id,film_id:film.id,bought_price:price,bought_week:leagueConfig.current_week,acquired_week:leagueConfig.current_week,phase:ph,active:true})
    if(error)return notify(error.message,S.red)
    await supabase.from('transactions').insert({player_id:profile.id,film_id:film.id,type:'buy',price,week:leagueConfig.current_week})
    notify(`Acquired ${film.title} for $${price}M`,S.green)
    loadData()
  }
  const sellFilm=async(film)=>{
    const h=rosters.find(r=>r.player_id===profile.id&&r.film_id===film.id&&r.active)
    if(!h)return
    const win=isWindow(),val=filmVal(film),fee=win?0:leagueConfig.tx_fee,proceeds=Math.max(0,val-fee)
    await supabase.from('rosters').update({active:false,sold_price:proceeds,sold_week:leagueConfig.current_week}).eq('id',h.id)
    await supabase.from('transactions').insert([
      {player_id:profile.id,film_id:film.id,type:'sell',price:proceeds,week:leagueConfig.current_week},
      ...(fee>0?[{player_id:profile.id,film_id:film.id,type:'fee',price:fee,week:leagueConfig.current_week}]:[]),
    ])
    notify(`Sold ${film.title} · $${proceeds}M${win?' (free)':''}`,S.gold)
    loadData()
  }

  // ── CHIPS ──
  const activateRecut=async()=>{
    if(chips?.recut_used)return notify('Recut already used',S.red)
    if(!confirm('Activate THE RECUT? Your roster clears with zero fees.'))return
    for(const h of rosters.filter(r=>r.player_id===profile.id&&r.active))
      await supabase.from('rosters').update({active:false,sold_price:filmVal(films.find(f=>f.id===h.film_id)||{}),sold_week:leagueConfig.current_week}).eq('id',h.id)
    if(chips)await supabase.from('chips').update({recut_used:true}).eq('player_id',profile.id)
    else await supabase.from('chips').insert({player_id:profile.id,recut_used:true})
    notify('🎬 THE RECUT — roster cleared, zero fees',S.purple)
    setChipModal(null);loadData()
  }
  const activateShort=async(filmId,pred)=>{
    if(chips?.short_film_id)return notify('Short already used',S.red)
    if(allChips.find(c=>c.short_film_id===filmId))return notify('Film already shorted by another player',S.red)
    if(chips)await supabase.from('chips').update({short_film_id:filmId,short_phase:curPhase(),short_prediction:pred}).eq('player_id',profile.id)
    else await supabase.from('chips').insert({player_id:profile.id,short_film_id:filmId,short_phase:curPhase(),short_prediction:pred})
    notify(`📉 SHORT — ${films.find(f=>f.id===filmId)?.title}`,S.red)
    setChipModal(null);loadData()
  }
  const activateAnalyst=async(filmId,pred)=>{
    if(chips?.analyst_film_id)return notify('Analyst already used',S.red)
    if(allChips.find(c=>c.analyst_film_id===filmId))return notify('Film already Analysed by another player',S.red)
    if(!rosters.find(r=>r.player_id===profile.id&&r.film_id===filmId&&r.active))return notify('You must own this film',S.red)
    if(chips)await supabase.from('chips').update({analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred}).eq('player_id',profile.id)
    else await supabase.from('chips').insert({player_id:profile.id,analyst_film_id:filmId,analyst_phase:curPhase(),analyst_prediction:pred})
    notify(`🎯 ANALYST — ${films.find(f=>f.id===filmId)?.title}`,S.blue)
    setChipModal(null);loadData()
  }
  const resolveChips=async(filmId,actualM)=>{
    const film=films.find(f=>f.id===filmId);if(!film)return
    for(const c of allChips){
      if(c.short_film_id===filmId&&!c.short_result)
        await supabase.from('chips').update({short_result:(actualM/film.estM)<0.60?'win':'lose'}).eq('player_id',c.player_id)
      if(c.analyst_film_id===filmId&&!c.analyst_result){
        const within=c.analyst_prediction&&Math.abs(actualM-c.analyst_prediction)/c.analyst_prediction<=0.10
        await supabase.from('chips').update({analyst_result:within?'win':'lose'}).eq('player_id',c.player_id)
      }
    }
  }
  const submitOscarPick=async(filmId)=>{
    if(myOscarPick)return notify('Oscar pick already submitted',S.red)
    await supabase.from('oscar_predictions').insert({player_id:profile.id,best_picture_film_id:filmId})
    notify(`🏆 Best Picture locked — ${films.find(f=>f.id===filmId)?.title}`,S.gold);loadData()
  }
  const submitAuteur=async(actor,filmIds)=>{
    if(filmIds.length<2)return notify('Select at least 2 films',S.red)
    const ph=curPhase(),ex=auteurDeclarations.find(a=>a.player_id===profile.id&&a.phase===ph)
    if(ex)await supabase.from('auteur_declarations').update({star_actor:actor,film_ids:filmIds}).eq('id',ex.id)
    else await supabase.from('auteur_declarations').insert({player_id:profile.id,phase:ph,star_actor:actor,film_ids:filmIds})
    notify(`🎭 Auteur — ${actor} · ${filmIds.length} films · +10%`,S.orange)
    setChipModal(null);loadData()
  }
  const saveForecast=async(filmId,predicted)=>{
    const ex=allForecasts.find(f=>f.player_id===profile.id&&f.film_id===filmId)
    if(ex)await supabase.from('forecasts').update({predicted_m:predicted}).eq('id',ex.id)
    else await supabase.from('forecasts').insert({player_id:profile.id,film_id:filmId,phase:curPhase(),predicted_m:predicted})
    notify(`Forecast saved — ${films.find(f=>f.id===filmId)?.title} $${predicted}M`,S.blue);loadData()
  }

  if(loading)return <div style={{...S.app,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:S.gold,fontSize:'24px'}}>Loading...</div></div>
  if(!session)return <Login/>
  if(!profile)return <CreateProfile session={session} onCreated={()=>{loadProfile();loadData()}} notify={notify}/>

  const ph=curPhase(),win=isWindow(),cur=leagueConfig.currency||'$'
  const myPhaseRoster=rosters.filter(r=>r.player_id===profile.id&&r.phase===ph&&r.active)
  const myBudgetLeft=budgetLeft(profile.id)
  const banked=phaseBanked(profile.id,ph)
  const recutUsed=chips?.recut_used||false
  const shortUsed=!!chips?.short_film_id
  const analystUsed=!!chips?.analyst_film_id
  const phaseFilms=films.filter(f=>f.phase===ph)

  const wMs=leagueConfig.phase_window_opened_at?Math.max(0,72*3600000-(now-new Date(leagueConfig.phase_window_opened_at).getTime())):0
  const wH=Math.floor(wMs/3600000),wM=Math.floor((wMs%3600000)/60000),wS=Math.floor((wMs%60000)/1000)

  const desktopNav=[['market','🎬','Market'],['roster','📁','Roster'],['chips','⚡','Chips'],['forecaster','📊','Forecaster'],['oscar','🏆','Oscars'],['league','🥇','League'],['results','📋','Results'],...(isCommissioner?[['commissioner','⚙️','Panel']]:[])]

  // ── MARKET PAGE ──
  const MarketPage=()=>(
    <div>
      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'17px',fontWeight:800}}>Phase {ph} · {PHASE_NAMES[ph]}</div>
        <div style={{fontSize:'10px',color:'#4A5168',marginTop:'2px'}}>{cur}{myBudgetLeft}M left · {myPhaseRoster.length}/{MAX_ROSTER} slots · {phaseFilms.length} films{win?' · 🔓 Free drops':''}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(auto-fill,minmax(155px,1fr))':'repeat(auto-fill,minmax(185px,1fr))',gap:'10px'}}>
        {phaseFilms.map(film=>{
          const owned=myPhaseRoster.find(r=>r.film_id===film.id)
          const val=filmVal(film),actual=results[film.id],genreCol=GENRE_COL[film.genre]||'#888'
          const pd=val-film.basePrice,wp=weeklyPts(film.id),op=actual!=null?calcOpeningPts(film,actual,owned?isEarlyBird(owned):false,analystActive(profile.id,film.id)):0
          const lb=legsBonus(film.id),wb=wwBonus(film.id)
          const isShorted=chips?.short_film_id===film.id,isAnalyst=chips?.analyst_film_id===film.id
          const isAuteur=auteurBonus(profile.id,film.id),isEB=owned&&isEarlyBird(owned)
          return (
            <div key={film.id} style={{...S.card,border:`1px solid ${owned?S.gold+'44':'#1E222C'}`,background:owned?'#F0B42908':'#0C0E12',position:'relative',overflow:'hidden',padding:'12px'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:genreCol}}/>
              <div style={{fontSize:'11px',fontWeight:700,marginBottom:'2px',marginTop:'4px',lineHeight:1.3}}>{film.title}</div>
              <div style={{fontSize:'9px',color:'#4A5168',marginBottom:'5px'}}>{film.dist} · W{film.week}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'5px'}}>
                <div>
                  <div style={{fontSize:'16px',fontWeight:800,color:owned?S.gold:'#F2EEE8'}}>{cur}{val}M</div>
                  <div style={{fontSize:'9px',color:pd>0?S.green:pd<0?S.red:'#4A5168'}}>{pd===0?'—':pd>0?'▲':'▼'} {cur}{film.basePrice}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  {film.rt!=null&&<div style={{fontSize:'9px',color:film.rt>=90?S.green:film.rt>=75?S.gold:S.red}}>🍅{film.rt}%</div>}
                  <div style={{fontSize:'9px',color:'#4A5168'}}>Est ${film.estM}M</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'3px',flexWrap:'wrap',marginBottom:'5px'}}>
                <span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:genreCol+'18',color:genreCol}}>{film.genre}</span>
                {film.franchise&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:'#A855F718',color:'#A855F7'}}>{film.franchise}</span>}
                {film.sleeper&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:'#4D9EFF18',color:'#4D9EFF'}}>💤</span>}
                {isShorted&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:S.red+'18',color:S.red}}>📉</span>}
                {isAnalyst&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:S.blue+'18',color:S.blue}}>🎯</span>}
                {isAuteur&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:S.orange+'18',color:S.orange}}>🎭</span>}
                {isEB&&<span style={{fontSize:'8px',padding:'1px 5px',borderRadius:'4px',background:S.green+'18',color:S.green}}>🐦</span>}
              </div>
              {actual!=null&&(
                <div style={{marginBottom:'6px',background:'#12141A',borderRadius:'6px',padding:'5px 8px',cursor:owned?'pointer':'default'}}
                  onClick={()=>{if(owned)setScoreModal({film,holding:owned})}}>
                  <div style={{fontSize:'10px',color:S.green}}>${actual}M actual</div>
                  <div style={{fontSize:'9px',color:S.gold}}>{op}pts{wp>0?` +${Math.round(wp)}w`:''}{ lb>0?' 🦵+25':''}{ wb>0?' 🥇+15':''}</div>
                  {owned&&<div style={{fontSize:'8px',color:'#4A5168',marginTop:'2px'}}>Tap for breakdown →</div>}
                </div>
              )}
              {film.starActor&&<div style={{fontSize:'9px',color:'#4A5168',marginBottom:'5px'}}>⭐ {film.starActor}</div>}
              {film.trailer&&film.trailer.length>5&&<button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',width:'100%',fontSize:'9px',marginBottom:'5px',padding:'5px'}} onClick={e=>{e.stopPropagation();setTrailerFilm(film)}}>▶ Trailer</button>}
              {owned
                ?<button style={{...S.btn,background:'none',border:`1px solid ${S.red}44`,color:S.red,width:'100%',fontSize:'9px',padding:'6px'}} onClick={()=>sellFilm(film)}>Drop{win?' FREE':` · ${cur}${Math.max(0,val-leagueConfig.tx_fee)}M`}</button>
                :<button style={{...S.btn,background:S.gold,color:'#000',width:'100%',fontSize:'9px',padding:'6px'}} onClick={()=>buyFilm(film)}>Acquire · {cur}{val}M</button>
              }
              {(()=>{const n=rosters.filter(r=>r.film_id===film.id&&r.phase===ph&&r.active).length;return n>0?<div style={{fontSize:'9px',color:'#4A5168',marginTop:'4px',textAlign:'center'}}>{n} own this</div>:null})()}
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── ROSTER PAGE ──
  const RosterPage=()=>(
    <div>
      <div style={{fontSize:'17px',fontWeight:800,marginBottom:'4px'}}>My Roster · Phase {ph}</div>
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'4px'}}>{myPhaseRoster.length}/{MAX_ROSTER} films · {cur}{myBudgetLeft}M remaining{banked>0?` (incl. ${cur}${banked}M banked)`:''}</div>
      <div style={{display:'flex',gap:'6px',marginBottom:'12px',overflowX:'auto',paddingBottom:'4px'}}>
        {[1,2,3,4,5].map(p=>{
          const pts=calcPhasePoints(profile.id,p),nr=rosters.filter(r=>r.player_id===profile.id&&r.phase===p)
          return(<div key={p} style={{background:p===ph?S.gold+'22':'#12141A',border:`1px solid ${p===ph?S.gold+'44':'#2A2F3C'}`,borderRadius:'7px',padding:'5px 10px',textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:'8px',color:p===ph?S.gold:'#4A5168'}}>PH{p}</div>
            <div style={{fontSize:'12px',fontWeight:700,color:p===ph?S.gold:'#F2EEE8'}}>{pts}pts</div>
            <div style={{fontSize:'8px',color:'#4A5168'}}>{nr.length} films</div>
          </div>)
        })}
      </div>
      {myPhaseRoster.length===0
        ?<div style={{...S.card,textAlign:'center',color:'#4A5168',padding:'32px'}}>No films this phase. Go to Market to acquire.</div>
        :myPhaseRoster.map(h=>{
          const film=films.find(f=>f.id===h.film_id);if(!film)return null
          const val=filmVal(film),actual=results[film.id],pnl=val-h.bought_price
          const genreCol=GENRE_COL[film.genre]||'#888'
          const wp=weeklyPts(film.id),eb=isEarlyBird(h),aw=analystActive(profile.id,film.id),au=auteurBonus(profile.id,film.id)
          const op=calcOpeningPts(film,actual,eb,aw),fop=au?Math.round(op*1.10):op
          const lb=legsBonus(film.id),wb=wwBonus(film.id),sb=shortBonus(profile.id,film.id)
          const weeks=weeklyGrosses[film.id]||{},total=fop+Math.round(wp)+lb+wb+sb
          return(
            <div key={h.id} style={{...S.card,cursor:actual!=null?'pointer':'default'}} onClick={()=>actual!=null&&setScoreModal({film,holding:h})}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                <div style={{width:'3px',height:'36px',borderRadius:'2px',background:genreCol,flexShrink:0}}/>
                <div style={{flex:2,minWidth:'110px'}}>
                  <div style={{fontSize:'13px',fontWeight:600}}>{film.title}</div>
                  <div style={{fontSize:'9px',color:'#4A5168'}}>{film.dist} · W{film.week}</div>
                  <div style={{display:'flex',gap:'4px',marginTop:'2px',flexWrap:'wrap'}}>
                    {eb&&<span style={{fontSize:'7px',color:S.green,padding:'1px 4px',background:S.green+'15',borderRadius:'3px'}}>🐦 EARLY</span>}
                    {aw&&<span style={{fontSize:'7px',color:S.blue,padding:'1px 4px',background:S.blue+'15',borderRadius:'3px'}}>🎯 +60</span>}
                    {au&&<span style={{fontSize:'7px',color:S.orange,padding:'1px 4px',background:S.orange+'15',borderRadius:'3px'}}>🎭 +10%</span>}
                  </div>
                </div>
                <div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'}}>PAID</div><div style={{fontSize:'11px'}}>{cur}{h.bought_price}</div></div>
                <div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'}}>NOW</div><div style={{fontSize:'11px',color:pnl>=0?S.green:S.red}}>{cur}{val}</div></div>
                <div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'}}>P&L</div><div style={{fontSize:'12px',fontWeight:700,color:pnl>=0?S.green:S.red}}>{pnl>=0?'+':''}{pnl}</div></div>
                {actual!=null&&<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'}}>OPEN</div><div style={{fontSize:'11px',color:S.gold}}>{fop}pts</div></div>}
                {wp>0&&<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'}}>WKLY</div><div style={{fontSize:'11px',color:S.blue}}>+{Math.round(wp)}</div></div>}
                {(lb>0||wb>0||sb!==0)&&<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'}}>BONUS</div><div style={{fontSize:'11px',color:S.green}}>+{lb+wb+Math.max(0,sb)}</div></div>}
                {actual!=null&&<div style={{textAlign:'center'}}><div style={{fontSize:'7px',color:'#4A5168'}}>TOTAL</div><div style={{fontSize:'13px',fontWeight:700,color:S.gold}}>{total}</div></div>}
              </div>
              {Object.keys(weeks).length>0&&(
                <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid #1E222C',display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  {Object.entries(weeks).sort((a,b)=>Number(a[0])-Number(b[0])).map(([wk,gross])=>{
                    const rate=Number(wk)>=4?1.1:1.0
                    return(<div key={wk} style={{background:'#12141A',borderRadius:'5px',padding:'3px 7px',fontSize:'9px'}}>
                      <span style={{color:'#4A5168'}}>W{wk} </span><span style={{color:S.blue}}>${gross}M</span>
                      <span style={{color:'#4A5168'}}> +{Math.round(Number(gross)*rate)}{Number(wk)>=4?' ×1.1':''}</span>
                    </div>)
                  })}
                </div>
              )}
              {actual!=null&&<div style={{fontSize:'8px',color:'#4A5168',marginTop:'5px',textAlign:'right'}}>Tap for full breakdown →</div>}
            </div>
          )
        })
      }
    </div>
  )

  // ── CHIPS PAGE ──
  const ChipsPage=()=>{
    const myAuteur=auteurDeclarations.find(a=>a.player_id===profile.id&&a.phase===ph)
    return(
      <div>
        <div style={{fontSize:'17px',fontWeight:800,marginBottom:'6px'}}>My Chips</div>
        <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>One of each per season · Shorts and Analyst first-come first-served per film</div>
        {/* RECUT */}
        <div style={{...S.card,border:`1px solid ${recutUsed?'#2A2F3C':S.purple+'44'}`,marginBottom:'10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'22px'}}>🎬</div>
            <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:recutUsed?'#4A5168':S.purple}}>THE RECUT</div><div style={{fontSize:'10px',color:'#4A5168'}}>Full free roster rebuild · zero fees · anytime</div></div>
            {recutUsed?<span style={{fontSize:'10px',color:'#4A5168',padding:'3px 10px',border:'1px solid #2A2F3C',borderRadius:'6px'}}>USED</span>
              :<button style={{...S.btn,background:S.purple,color:'#fff',fontSize:'10px',padding:'6px 14px'}} onClick={activateRecut}>Activate</button>}
          </div>
        </div>
        {/* SHORT */}
        <div style={{...S.card,border:`1px solid ${shortUsed?'#2A2F3C':S.red+'44'}`,marginBottom:'10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'22px'}}>📉</div>
            <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:shortUsed?'#4A5168':S.red}}>THE SHORT</div><div style={{fontSize:'10px',color:'#4A5168'}}>Bomb call · under 60% est = +100pts · hit = −30pts</div></div>
            {shortUsed?<span style={{fontSize:'10px',color:'#4A5168',padding:'3px 10px',border:'1px solid #2A2F3C',borderRadius:'6px'}}>{chips?.short_result==='win'?'✅ +100':chips?.short_result==='lose'?'❌ -30':`📉 ${films.find(f=>f.id===chips?.short_film_id)?.title||'Active'}`}</span>
              :<button style={{...S.btn,background:S.red,color:'#fff',fontSize:'10px',padding:'6px 14px'}} onClick={()=>setChipModal('short')}>Activate</button>}
          </div>
        </div>
        {/* ANALYST */}
        <div style={{...S.card,border:`1px solid ${analystUsed?'#2A2F3C':S.blue+'44'}`,marginBottom:'10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'22px'}}>🎯</div>
            <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:700,color:analystUsed?'#4A5168':S.blue}}>THE ANALYST</div><div style={{fontSize:'10px',color:'#4A5168'}}>Predict opening ±10% · correct = +60pts flat bonus</div></div>
            {analystUsed?<span style={{fontSize:'10px',color:'#4A5168',padding:'3px 10px',border:'1px solid #2A2F3C',borderRadius:'6px'}}>{chips?.analyst_result==='win'?'✅ +60pts':chips?.analyst_result==='lose'?'❌ Missed':`🎯 ${films.find(f=>f.id===chips?.analyst_film_id)?.title||'Active'}`}</span>
              :<button style={{...S.btn,background:S.blue,color:'#fff',fontSize:'10px',padding:'6px 14px'}} onClick={()=>setChipModal('analyst')}>Activate</button>}
          </div>
        </div>
        {/* AUTEUR */}
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
        <div style={{fontSize:'10px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px'}}>PHASE STANDINGS</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px',minWidth:'260px'}}>
          {[1,2,3,4,5].map(p=>{
            const sc=[...players].map(pl=>({pl,pts:calcPhasePoints(pl.id,p)})).sort((a,b)=>b.pts-a.pts)
            const leader=sc[0]
            return(<div key={p} style={{background:p===ph?S.gold+'15':'#12141A',border:`1px solid ${p===ph?S.gold+'33':'#2A2F3C'}`,borderRadius:'8px',padding:'7px',textAlign:'center'}}>
              <div style={{fontSize:'8px',color:p===ph?S.gold:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>PH{p}</div>
              {leader?.pts>0?(<><div style={{fontSize:'9px',fontWeight:600,color:players.find(pl=>pl.id===leader?.pl?.id)?.color||S.gold,marginBottom:'2px'}}>{leader?.pl?.name}</div><div style={{fontSize:'11px',fontWeight:800,color:p===ph?S.gold:'#F2EEE8'}}>{leader?.pts}</div></>):<div style={{fontSize:'9px',color:'#4A5168'}}>—</div>}
            </div>)
          })}
        </div>
      </div>
      {players.length===0&&<div style={{...S.card,textAlign:'center',color:'#4A5168'}}>No players yet.</div>}
      {[...players].sort((a,b)=>calcPoints(b.id)-calcPoints(a.id)).map((player,i)=>{
        const pts=calcPoints(player.id),rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`
        const pc=allChips.find(c=>c.player_id===player.id),pa=auteurDeclarations.find(a=>a.player_id===player.id&&a.phase===ph)
        const po=oscarPredictions.find(o=>o.player_id===player.id),phPts=calcPhasePoints(player.id,ph)
        return(<div key={player.id} style={{...S.card,display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{fontSize:'20px',minWidth:'28px'}}>{rank}</div>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:player.color||S.gold,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'13px',fontWeight:600,color:player.color||S.gold,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.name}</div>
            <div style={{display:'flex',gap:'4px',marginTop:'3px',flexWrap:'wrap'}}>
              <span style={{fontSize:'9px',color:'#4A5168'}}>Ph{ph}: {phPts}pts · {cur}{budgetLeft(player.id)} left</span>
              {pc?.short_film_id&&<span style={{fontSize:'8px',color:S.red,padding:'1px 4px',background:S.red+'15',borderRadius:'3px'}}>📉</span>}
              {pc?.analyst_film_id&&<span style={{fontSize:'8px',color:S.blue,padding:'1px 4px',background:S.blue+'15',borderRadius:'3px'}}>🎯</span>}
              {pc?.recut_used&&<span style={{fontSize:'8px',color:S.purple,padding:'1px 4px',background:S.purple+'15',borderRadius:'3px'}}>🎬</span>}
              {pa&&<span style={{fontSize:'8px',color:S.orange,padding:'1px 4px',background:S.orange+'15',borderRadius:'3px'}}>🎭</span>}
              {po&&<span style={{fontSize:'8px',color:S.gold,padding:'1px 4px',background:S.gold+'15',borderRadius:'3px'}}>🏆</span>}
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:'24px',fontWeight:800,color:i===0?S.gold:'#F2EEE8'}}>{pts}</div>
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
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Best phase accuracy = +15pts · Best season = +50pts grand league bonus</div>
      {films.filter(f=>!results[f.id]).map(film=>{
        const mf=forecasts[film.id]
        return(<div key={film.id} style={{...S.card,display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
          <div style={{flex:2,minWidth:'120px'}}><div style={{fontSize:'12px',fontWeight:500}}>{film.title}</div><div style={{fontSize:'9px',color:'#4A5168'}}>Est ${film.estM}M · Ph{film.phase}</div></div>
          <input type="number" step="0.1" defaultValue={mf||''} placeholder="$M" id={`fc-${film.id}`} style={{...S.inp,width:'90px'}}/>
          <button style={{...S.btn,background:S.blue,color:'#fff',fontSize:'10px'}} onClick={()=>{const v=parseFloat(document.getElementById(`fc-${film.id}`).value);if(isNaN(v))return notify('Enter a prediction',S.red);saveForecast(film.id,v)}}>Lock In</button>
          {mf&&<div style={{fontSize:'11px',color:S.blue}}>${mf}M</div>}
        </div>)
      })}
      {films.filter(f=>results[f.id]).length>0&&(
        <div style={{marginTop:'20px'}}>
          <div style={{fontSize:'13px',fontWeight:700,marginBottom:'10px'}}>Forecast Results</div>
          {films.filter(f=>results[f.id]).map(film=>{
            const actual=results[film.id],pfc=allForecasts.filter(f=>f.film_id===film.id)
            return(<div key={film.id} style={{...S.card,marginBottom:'8px'}}>
              <div style={{fontSize:'11px',fontWeight:600,marginBottom:'8px'}}>{film.title} <span style={{color:S.green,fontWeight:400}}>— ${actual}M</span></div>
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
      <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px'}}>Predict Best Picture before end of 2026 · correct = +75pts grand league</div>
      {myOscarPick?(
        <div style={{...S.card,border:`1px solid ${S.gold}44`}}>
          <div style={{fontSize:'12px',color:'#4A5168',marginBottom:'6px'}}>YOUR PICK</div>
          <div style={{fontSize:'18px',fontWeight:700,color:S.gold}}>{films.find(f=>f.id===myOscarPick.best_picture_film_id)?.title||'—'}</div>
          <div style={{fontSize:'10px',color:'#4A5168',marginTop:'4px'}}>{myOscarPick.correct===true?'✅ CORRECT +75pts':myOscarPick.correct===false?'❌ Incorrect':'Awaiting Oscar night'}</div>
        </div>
      ):(
        <div style={{...S.card}}>
          <div style={{fontSize:'12px',color:'#4A5168',marginBottom:'12px'}}>PICK YOUR BEST PICTURE WINNER — locks immediately, cannot be changed</div>
          <select id="oscar-pick" style={{...S.inp,marginBottom:'12px'}}><option value="">Select a film...</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
          <button style={{...S.btn,background:S.gold,color:'#000',fontWeight:700,width:'100%',padding:'12px'}} onClick={()=>{const id=document.getElementById('oscar-pick').value;if(!id)return notify('Select a film',S.red);if(!confirm(`Lock in ${films.find(f=>f.id===id)?.title}?`))return;submitOscarPick(id)}}>🏆 Lock In</button>
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
        const actual=results[film.id],weeks=weeklyGrosses[film.id]||{},lb=legsBonus(film.id),isWinner=weekendWinners[film.week]===film.id
        return(<div key={film.id} style={{...S.card}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:actual!=null?'10px':'0'}}>
            <div style={{flex:2,minWidth:'120px'}}>
              <div style={{fontSize:'12px',fontWeight:500}}>{film.title} {isWinner&&'🥇'}</div>
              <div style={{fontSize:'9px',color:'#4A5168'}}>Est ${film.estM}M · IPO ${film.basePrice} · Ph{film.phase}</div>
            </div>
            <input type="number" step="0.1" defaultValue={actual||''} placeholder="Opening $M" id={`res-${film.id}`} style={{...S.inp,width:'85px'}}/>
            <button style={{...S.btn,background:S.green,color:'#000',fontSize:'10px',padding:'6px 10px'}} onClick={async()=>{
              const v=parseFloat(document.getElementById(`res-${film.id}`).value)
              if(isNaN(v))return notify('Enter a number',S.red)
              const nv=calcMarketValue(film,v)
              const{error:e1}=await dbUpsertResult(film.id,v);if(e1)return notify(e1.message,S.red)
              const{error:e2}=await dbUpsertFilmValue(film.id,nv);if(e2)return notify(e2.message,S.red)
              await resolveChips(film.id,v)
              notify(`✅ ${film.title} · $${nv} · ${calcOpeningPts(film,v)}pts`,S.gold);loadData()
            }}>Save</button>
            <button style={{...S.btn,background:isWinner?S.gold:'#12141A',border:isWinner?'none':'1px solid #2A2F3C',color:isWinner?'#000':'#4A5168',fontSize:'9px',padding:'6px 8px'}}
              onClick={async()=>{
                if(isWinner){await supabase.from('weekend_winners').delete().eq('week',film.week)}
                else{const ex=await supabase.from('weekend_winners').select('id').eq('week',film.week).single();if(ex.data)await supabase.from('weekend_winners').update({film_id:film.id,phase:ph}).eq('week',film.week);else await supabase.from('weekend_winners').insert({film_id:film.id,week:film.week,phase:ph})}
                notify(isWinner?'Winner removed':`🥇 ${film.title} · +15pts all owners`,S.gold);loadData()
              }}>{isWinner?'🥇 #1':'#1?'}</button>
            {actual!=null&&<div style={{fontSize:'10px',color:S.green}}>${actual}M → $${filmVal(film)} · {calcOpeningPts(film,actual)}pts</div>}
          </div>
          {actual!=null&&(
            <div style={{borderTop:'1px solid #1E222C',paddingTop:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px',flexWrap:'wrap'}}>
                <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px'}}>WEEKLY · 1pt/$1M (W1-3) · 1.1pts/$1M (W4+)</div>
                {lb>0&&<span style={{fontSize:'9px',color:S.green,padding:'1px 6px',background:S.green+'18',borderRadius:'4px'}}>🦵 Legs +25pts</span>}
              </div>
              <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                {[2,3,4,5,6,7,8].map(wk=>{
                  const rate=wk>=4?1.1:1.0
                  return(<div key={wk} style={{display:'flex',flexDirection:'column',gap:'3px',alignItems:'center'}}>
                    <div style={{fontSize:'8px',color:'#4A5168'}}>W{wk}{wk>=4?' ×1.1':''}</div>
                    <input type="number" step="0.1" placeholder="$M" defaultValue={weeks[wk]||''} id={`wk-${film.id}-${wk}`} style={{...S.inp,width:'58px',fontSize:'10px',padding:'4px 5px'}}/>
                    <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',fontSize:'8px',padding:'2px 5px'}}
                      onClick={async()=>{const v=parseFloat(document.getElementById(`wk-${film.id}-${wk}`).value);if(isNaN(v))return notify('Enter a number',S.red);const{error}=await dbUpsertWeekly(film.id,wk,v);if(error)return notify(error.message,S.red);notify(`W${wk} · +${Math.round(v*rate)}pts`,S.gold);loadData()}}>Save</button>
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
          <button style={{...S.btn,background:win?S.orange:S.purple,color:'#fff',fontSize:'10px'}} onClick={async()=>{const ni=new Date().toISOString();await supabase.from('league_config').update({phase_window_active:!win,phase_window_opened_at:!win?ni:null}).eq('id',1);notify(win?'Free window closed':'🔓 72hr free window opened!',S.orange);loadData()}}>{win?'🔒 Close Window':'🔓 Open 72hr Window'}</button>
          <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:S.gold,fontSize:'10px'}} onClick={async()=>{if(!confirm(`Advance to Phase ${ph+1}? This will bank unspent budgets.`))return;for(const p of players)await bankBudget(p.id,ph);await supabase.from('league_config').update({current_phase:ph+1,phase_window_active:false,phase_window_opened_at:null}).eq('id',1);notify(`Phase ${ph+1} started — budgets banked`,S.green);loadData()}}>Next Phase →</button>
        </div>
        <div style={{marginTop:'10px',display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {players.map(p=>(
            <div key={p.id} style={{background:'#12141A',borderRadius:'6px',padding:'5px 10px',fontSize:'10px'}}>
              <span style={{color:p.color||S.gold}}>{p.name}</span>
              <span style={{color:'#4A5168'}}> · {cur}{budgetLeft(p.id)}M left</span>
              {phaseBanked(p.id,ph)>0&&<span style={{color:S.orange}}> +{cur}{phaseBanked(p.id,ph)}M banked</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{...S.card,marginBottom:'12px'}}>
        <div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSpacing:'1px'}}>OSCAR NIGHT</div>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          <select id="oscar-winner-select" style={{...S.inp,flex:1,minWidth:'180px'}}><option value="">Select Best Picture winner...</option>{films.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</select>
          <button style={{...S.btn,background:S.gold,color:'#000',fontSize:'10px'}} onClick={async()=>{const id=document.getElementById('oscar-winner-select').value;if(!id)return notify('Select a film',S.red);await supabase.from('league_config').update({best_picture_winner:id}).eq('id',1);for(const op of oscarPredictions)await supabase.from('oscar_predictions').update({correct:op.best_picture_film_id===id}).eq('player_id',op.player_id);notify(`🏆 ${films.find(f=>f.id===id)?.title}`,S.gold);loadData()}}>Set Winner</button>
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
            <div style={{fontSize:'10px',color:p===ph?S.gold:'#4A5168',letterSpacing:'1px',marginBottom:'6px'}}>PHASE {p} — {PHASE_NAMES[p]} · {cur}{PHASE_BUDGETS[p]}M</div>
            {pf.map(film=>(<div key={film.id} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 0',borderBottom:'1px solid #1E222C',flexWrap:'wrap'}}>
              <div style={{flex:2,minWidth:'100px'}}><div style={{fontSize:'11px'}}>{film.title}</div><div style={{fontSize:'9px',color:'#4A5168'}}>W{film.week} · {film.starActor||'no actor'}</div></div>
              <div style={{display:'flex',gap:'4px',alignItems:'center',flexWrap:'wrap'}}>
                <div><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>IPO</div><input type="number" defaultValue={film.basePrice} id={`ipo-${film.id}`} style={{...S.inp,width:'52px',fontSize:'10px',padding:'3px 5px'}}/></div>
                <div><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>EST</div><input type="number" defaultValue={film.estM} id={`est-${film.id}`} style={{...S.inp,width:'52px',fontSize:'10px',padding:'3px 5px'}}/></div>
                <div><div style={{fontSize:'7px',color:'#4A5168',marginBottom:'2px'}}>RT%</div><input type="number" defaultValue={film.rt||''} id={`rt-${film.id}`} style={{...S.inp,width:'45px',fontSize:'10px',padding:'3px 5px'}}/></div>
                <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:S.gold,fontSize:'8px',marginTop:'10px',padding:'4px 8px'}} onClick={()=>{const ni=parseInt(document.getElementById(`ipo-${film.id}`).value),ne=parseInt(document.getElementById(`est-${film.id}`).value),nr=parseInt(document.getElementById(`rt-${film.id}`).value)||null;setFilms(prev=>prev.map(f=>f.id===film.id?{...f,basePrice:ni,estM:ne,rt:nr}:f));notify(`Updated ${film.title}`,S.green)}}>Update</button>
                <button style={{...S.btn,background:'none',border:`1px solid ${S.red}33`,color:S.red,fontSize:'8px',marginTop:'10px',padding:'4px 8px'}} onClick={()=>{if(!confirm(`Remove ${film.title}?`))return;setFilms(prev=>prev.filter(f=>f.id!==film.id));notify(`Removed ${film.title}`)}}>Remove</button>
              </div>
            </div>))}
          </div>)
        })}
      </div>
      <div style={{...S.card}}>
        <div style={{fontSize:'11px',fontWeight:600,color:S.gold,marginBottom:'12px',letterSpacing:'1px'}}>CHIP OVERRIDES</div>
        {!allChips.length&&<div style={{fontSize:'11px',color:'#4A5168'}}>No chips activated yet.</div>}
        {allChips.map(c=>{const p=players.find(pl=>pl.id===c.player_id);return(<div key={c.id} style={{padding:'8px 0',borderBottom:'1px solid #1E222C'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:p?.color||S.gold,marginBottom:'4px'}}>{p?.name}</div>
          {c.short_film_id&&(<div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'4px',flexWrap:'wrap'}}>
            <span style={{fontSize:'10px',color:S.red}}>📉 {films.find(f=>f.id===c.short_film_id)?.title}</span>
            <span style={{fontSize:'10px',color:'#4A5168'}}>→ {c.short_result||'pending'}</span>
            {!c.short_result&&<><button style={{...S.btn,background:S.green,color:'#000',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({short_result:'win'}).eq('player_id',c.player_id);notify('Short WIN +100pts',S.green);loadData()}}>Win</button><button style={{...S.btn,background:S.red,color:'#fff',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({short_result:'lose'}).eq('player_id',c.player_id);notify('Short LOSE -30pts',S.red);loadData()}}>Lose</button></>}
          </div>)}
          {c.analyst_film_id&&(<div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:'10px',color:S.blue}}>🎯 {films.find(f=>f.id===c.analyst_film_id)?.title} · pred ${c.analyst_prediction}M</span>
            <span style={{fontSize:'10px',color:'#4A5168'}}>→ {c.analyst_result||'pending'}</span>
            {!c.analyst_result&&<><button style={{...S.btn,background:S.green,color:'#000',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({analyst_result:'win'}).eq('player_id',c.player_id);notify('Analyst WIN +60pts',S.green);loadData()}}>Win</button><button style={{...S.btn,background:S.red,color:'#fff',fontSize:'8px',padding:'2px 8px'}} onClick={async()=>{await supabase.from('chips').update({analyst_result:'lose'}).eq('player_id',c.player_id);notify('Analyst LOSE',S.red);loadData()}}>Lose</button></>}
          </div>)}
        </div>)})}
      </div>
    </div>
  )

  return (
    <div style={S.app}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={{fontFamily:'sans-serif',fontSize:'20px',fontWeight:900,color:S.gold,letterSpacing:'-1px'}}>BOXD</div>
        {win&&wMs>0&&<div style={{background:S.orange+'22',border:`1px solid ${S.orange}44`,borderRadius:'6px',padding:'2px 8px',fontSize:'9px',color:S.orange}}>🔓 {wH}h {wM}m {wS}s</div>}
        <div style={{background:'#12141A',border:'1px solid #2A2F3C',borderRadius:'7px',padding:'3px 9px'}}>
          <div style={{fontSize:'7px',color:'#4A5168'}}>Ph{ph} BUDGET</div>
          <div style={{fontSize:'13px',fontWeight:700,color:myBudgetLeft<20?S.red:S.green}}>{cur}{myBudgetLeft}M</div>
        </div>
        {banked>0&&!isMobile&&<div style={{fontSize:'9px',color:S.orange}}>+{cur}{banked}M banked</div>}
        <div style={{fontSize:'9px',color:'#4A5168'}}>W{leagueConfig.current_week}</div>
        <div style={{marginLeft:'auto',display:'flex',gap:'6px',alignItems:'center'}}>
          <div style={{fontSize:'10px',color:'#4A5168'}}>{profile.name}</div>
          <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',fontSize:'8px',padding:'4px 8px'}} onClick={()=>supabase.auth.signOut()}>Out</button>
        </div>
      </div>

      <div style={{display:'flex',minHeight:'calc(100vh - 52px)'}}>
        {/* DESKTOP SIDEBAR */}
        {!isMobile&&(
          <div style={{width:'180px',background:'#0C0E12',borderRight:'1px solid #1E222C',padding:'8px',flexShrink:0}}>
            {desktopNav.map(([id,ic,lb])=>(
              <div key={id} onClick={()=>setPage(id)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'7px',cursor:'pointer',fontSize:'11px',marginBottom:'2px',background:page===id?'#F0B42914':'none',color:page===id?S.gold:'#6B7080'}}>
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
      {isMobile&&<BottomNav page={page} setPage={setPage} isCommissioner={isCommissioner} onMore={()=>setShowMore(true)}/>}
      {isMobile&&showMore&&<MoreDrawer page={page} setPage={setPage} isCommissioner={isCommissioner} onClose={()=>setShowMore(false)}/>}

      {/* NOTIFICATIONS */}
      {notif&&<div style={{position:'fixed',bottom:isMobile?'72px':'20px',right:'16px',background:'#0C0E12',border:`1px solid ${notif.col}`,borderRadius:'9px',padding:'10px 14px',fontSize:'11px',zIndex:600,maxWidth:'280px'}}>{notif.msg}</div>}

      {/* SCORE BREAKDOWN MODAL */}
      {scoreModal&&<ScoreBreakdownModal film={scoreModal.film} holding={scoreModal.holding} results={results} weeklyGrosses={weeklyGrosses} allChips={allChips} auteurDeclarations={auteurDeclarations} weekendWinners={weekendWinners} isEarlyBird={isEarlyBird} onClose={()=>setScoreModal(null)}/>}

      {/* TRAILER MODAL */}
      {trailerFilm&&(
        <div style={{position:'fixed',inset:0,background:'#000000EE',display:'flex',alignItems:'center',justifyContent:'center',zIndex:700,padding:'16px'}} onClick={()=>setTrailerFilm(null)}>
          <div style={{width:'100%',maxWidth:'800px'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
              <div style={{fontSize:'14px',fontWeight:700}}>{trailerFilm.title}</div>
              <button style={{background:'none',border:'1px solid #2A2F3C',color:'#4A5168',borderRadius:'6px',padding:'4px 12px',cursor:'pointer',fontFamily:'DM Mono, monospace',fontSize:'11px'}} onClick={()=>setTrailerFilm(null)}>✕</button>
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
            <div style={{fontSize:'15px',fontWeight:800,marginBottom:'14px',color:S.green}}>+ Add New Film</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
              {[['Title','title','text',''],['Distributor','dist','text',''],['Franchise','franchise','text',''],['Star Actor','starActor','text',''],['IPO $M','basePrice','number','20'],['Est $M','estM','number','35'],['RT%','rt','number',''],['Week','week','number','1'],['Phase','phase','number','1']].map(([label,field,type,ph])=>(
                <div key={field} style={{gridColumn:field==='title'||field==='dist'?'1/-1':'auto'}}>
                  <div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>{label.toUpperCase()}</div>
                  <input type={type} placeholder={ph} value={newFilm[field]||''} style={{...S.inp}} onChange={e=>setNewFilm(prev=>({...prev,[field]:type==='number'?parseFloat(e.target.value)||'':e.target.value}))}/>
                </div>
              ))}
              <div><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>GENRE</div><select value={newFilm.genre} style={{...S.inp}} onChange={e=>setNewFilm(prev=>({...prev,genre:e.target.value}))}>{Object.keys(GENRE_COL).map(g=><option key={g} value={g}>{g}</option>)}</select></div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',paddingTop:'16px'}}><input type="checkbox" checked={newFilm.sleeper} id="sleeper-check" onChange={e=>setNewFilm(prev=>({...prev,sleeper:e.target.checked}))}/><label htmlFor="sleeper-check" style={{fontSize:'11px',color:'#4A5168',cursor:'pointer'}}>Sleeper pick</label></div>
              <div style={{gridColumn:'1/-1'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'4px'}}>TRAILER URL</div><input type="text" placeholder="https://www.youtube.com/embed/..." value={newFilm.trailer} style={{...S.inp}} onChange={e=>setNewFilm(prev=>({...prev,trailer:e.target.value}))}/></div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1}} onClick={()=>setAddFilmModal(false)}>Cancel</button>
              <button style={{...S.btn,background:S.green,color:'#000',flex:1,fontWeight:700}} onClick={()=>{
                if(!newFilm.title||!newFilm.dist)return notify('Title and distributor required',S.red)
                const id='f'+Date.now().toString(36)
                const film={...newFilm,id,basePrice:Number(newFilm.basePrice)||20,estM:Number(newFilm.estM)||30,rt:newFilm.rt!==''?Number(newFilm.rt):null,week:Number(newFilm.week)||1,phase:Number(newFilm.phase)||1,franchise:newFilm.franchise||null,starActor:newFilm.starActor||null}
                setFilms(prev=>[...prev,film])
                setNewFilm({title:'',dist:'',genre:'Action',franchise:'',basePrice:20,estM:30,rt:'',week:1,phase:1,sleeper:false,starActor:'',trailer:''})
                setAddFilmModal(false);notify(`✅ ${film.title} added`,S.green)
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
            {chipModal==='short'&&(
              <div>
                <div style={{fontSize:'16px',fontWeight:800,color:S.red,marginBottom:'6px'}}>📉 The Short</div>
                <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px',lineHeight:1.6}}>Pick a bomb. Under 60% of estimate = +100pts. Hits = −30pts.</div>
                <div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>SELECT FILM</div>
                  <select id="short-film" style={{...S.inp}}>{films.filter(f=>!results[f.id]&&!allChips.find(c=>c.short_film_id===f.id)).map(f=><option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>)}</select></div>
                <div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>YOUR PREDICTION ($M)</div><input type="number" id="short-pred" placeholder="e.g. 18" style={{...S.inp}}/></div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,padding:'12px'}} onClick={()=>setChipModal(null)}>Cancel</button>
                  <button style={{...S.btn,background:S.red,color:'#fff',flex:1,padding:'12px'}} onClick={()=>{const fid=document.getElementById('short-film').value,pred=parseFloat(document.getElementById('short-pred').value);activateShort(fid,pred)}}>Confirm Short</button>
                </div>
              </div>
            )}
            {chipModal==='analyst'&&(
              <div>
                <div style={{fontSize:'16px',fontWeight:800,color:S.blue,marginBottom:'6px'}}>🎯 The Analyst</div>
                <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px',lineHeight:1.6}}>Predict opening within 10%. Correct = +60pts flat bonus. Must own the film.</div>
                <div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>SELECT FILM (owned, unreleased)</div>
                  <select id="analyst-film" style={{...S.inp}}>{myPhaseRoster.filter(r=>!results[r.film_id]&&!allChips.find(c=>c.analyst_film_id===r.film_id)).map(r=>{const f=films.find(fl=>fl.id===r.film_id);return f?<option key={f.id} value={f.id}>{f.title} (Est ${f.estM}M)</option>:null})}</select></div>
                <div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>YOUR PREDICTION ($M)</div><input type="number" id="analyst-pred" placeholder="e.g. 92" style={{...S.inp}}/></div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,padding:'12px'}} onClick={()=>setChipModal(null)}>Cancel</button>
                  <button style={{...S.btn,background:S.blue,color:'#fff',flex:1,padding:'12px'}} onClick={()=>{const fid=document.getElementById('analyst-film').value,pred=parseFloat(document.getElementById('analyst-pred').value);if(isNaN(pred))return notify('Enter a prediction',S.red);activateAnalyst(fid,pred)}}>Confirm</button>
                </div>
              </div>
            )}
            {chipModal==='auteur'&&(
              <div>
                <div style={{fontSize:'16px',fontWeight:800,color:S.orange,marginBottom:'6px'}}>🎭 The Auteur</div>
                <div style={{fontSize:'10px',color:'#4A5168',marginBottom:'16px',lineHeight:1.6}}>Declare 2+ films with the same star actor. Each earns +10% opening points.</div>
                <div style={{marginBottom:'10px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'5px'}}>STAR ACTOR</div><input type="text" id="auteur-actor" placeholder="e.g. Tom Cruise" style={{...S.inp}}/></div>
                <div style={{marginBottom:'16px'}}><div style={{fontSize:'8px',color:'#4A5168',letterSpacing:'1px',marginBottom:'8px'}}>SELECT FILMS (min 2)</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {myPhaseRoster.map(r=>{const f=films.find(fl=>fl.id===r.film_id);if(!f)return null;return(<label key={r.film_id} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',fontSize:'12px',padding:'8px',background:'#12141A',borderRadius:'7px'}}><input type="checkbox" value={f.id} name="auteur-film" style={{cursor:'pointer',width:'16px',height:'16px'}}/>{f.title} {f.starActor?`(${f.starActor})`:''}</label>)})}
                  </div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button style={{...S.btn,background:'#12141A',border:'1px solid #2A2F3C',color:'#4A5168',flex:1,padding:'12px'}} onClick={()=>setChipModal(null)}>Cancel</button>
                  <button style={{...S.btn,background:S.orange,color:'#000',flex:1,fontWeight:700,padding:'12px'}} onClick={()=>{const actor=document.getElementById('auteur-actor').value.trim();if(!actor)return notify('Enter actor name',S.red);const checked=[...document.querySelectorAll('input[name="auteur-film"]:checked')].map(el=>el.value);if(checked.length<2)return notify('Select at least 2 films',S.red);submitAuteur(actor,checked)}}>Declare</button>
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
    const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:'https://boxd-league-v2.vercel.app'}})
    if(error)alert(error.message);else setSent(true)
    setLoading(false)
  }
  if(sent)return(
    <div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',padding:'20px'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'16px'}}>BOXD</div>
        <div style={{color:'#F2EEE8',marginBottom:'8px'}}>Check your email</div>
        <div style={{color:'#4A5168',fontSize:'12px'}}>Magic link sent to {email}</div>
      </div>
    </div>
  )
  return(
    <div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'320px'}}>
        <div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'8px'}}>BOXD</div>
        <div style={{color:'#4A5168',fontSize:'11px',letterSpacing:'3px',marginBottom:'32px'}}>FANTASY BOX OFFICE</div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} required
            style={{width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'white',borderRadius:'8px',padding:'14px',fontSize:'13px',fontFamily:'monospace',marginBottom:'10px',outline:'none',boxSizing:'border-box'}}/>
          <button type="submit" disabled={loading}
            style={{width:'100%',background:'#F0B429',color:'#000',border:'none',borderRadius:'8px',padding:'14px',fontSize:'12px',fontWeight:700,cursor:'pointer',letterSpacing:'1px',fontFamily:'monospace'}}>
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
    const{error}=await supabase.from('profiles').insert({id:session.user.id,name:name.trim(),color})
    if(error){notify(error.message,'#FF4757');setLoading(false);return}
    onCreated()
  }
  return(
    <div style={{minHeight:'100vh',background:'#07080B',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'320px'}}>
        <div style={{fontSize:'48px',fontWeight:900,color:'#F0B429',marginBottom:'8px'}}>BOXD</div>
        <div style={{color:'#F2EEE8',marginBottom:'6px',fontSize:'14px'}}>Create your player profile</div>
        <div style={{color:'#4A5168',fontSize:'11px',marginBottom:'24px'}}>{session.user.email}</div>
        <form onSubmit={handleCreate}>
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required
            style={{width:'100%',background:'#12141A',border:'1px solid #2A2F3C',color:'white',borderRadius:'8px',padding:'14px',fontSize:'13px',fontFamily:'monospace',marginBottom:'14px',outline:'none',boxSizing:'border-box'}}/>
          <div style={{fontSize:'9px',color:'#4A5168',letterSpacing:'1px',marginBottom:'10px'}}>PICK YOUR COLOUR</div>
          <div style={{display:'flex',gap:'10px',marginBottom:'24px'}}>
            {COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:'32px',height:'32px',borderRadius:'50%',background:c,cursor:'pointer',border:color===c?'3px solid white':'3px solid transparent'}}/>)}
          </div>
          <button type="submit" disabled={loading}
            style={{width:'100%',background:'#F0B429',color:'#000',border:'none',borderRadius:'8px',padding:'14px',fontSize:'12px',fontWeight:700,cursor:'pointer',letterSpacing:'1px',fontFamily:'monospace'}}>
            {loading?'CREATING...':'JOIN LEAGUE'}
          </button>
        </form>
      </div>
    </div>
  )
}
