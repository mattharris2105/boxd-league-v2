<!--
  BOXD — Embeddable Audience Intent Widget
  ============================================================
  Distributors/cinemas paste ONE line into their site to show live
  audience anticipation for a film, powered by BOXD player data.

  USAGE (what you give a distributor):
    <div id="boxd-widget" data-film="FILM_ID"></div>
    <script src="https://boxd-league-v2.vercel.app/boxd-widget.js"></script>

  This file IS that script. Host it at /boxd-widget.js in your public folder.
  It reads only public, aggregated counts — no personal data leaves BOXD.
  ============================================================
-->
<script>
(function(){
  var SUPABASE_URL = 'https://yxluqkfanhzktinayvex.supabase.co';
  // Public anon key — safe to expose, same key the app ships with.
  // Replace with your anon key from Supabase → Settings → API.
  var ANON =eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bHVxa2Zhbmh6a3RpbmF5dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzcwMjYsImV4cCI6MjA4OTc1MzAyNn0.P7I1JeM8OuBFe4d08uirm1ZiUTSGjz-U_TzTUqdoqpQ;

  var GOLD='#E8A020', BG='#0D0A08', SURF='#161210', TEXT='#F2EAE0', SUB='#8A7A6E', GREEN='#3DD68C';

  function el(tag, style, text){
    var e=document.createElement(tag);
    if(style)e.style.cssText=style;
    if(text!=null)e.textContent=text;
    return e;
  }

  async function sb(path){
    var res = await fetch(SUPABASE_URL+'/rest/v1/'+path, {
      headers:{ apikey:ANON, Authorization:'Bearer '+ANON }
    });
    if(!res.ok) throw new Error('fetch failed');
    return res.json();
  }

  async function render(container){
    var filmId = container.getAttribute('data-film');
    if(!filmId){ container.textContent='BOXD widget: missing data-film'; return; }

    container.style.cssText='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:340px;background:'+SURF+';border:1px solid #2A2420;border-radius:16px;padding:18px;color:'+TEXT+';';
    container.innerHTML='';
    var loading = el('div', 'color:'+SUB+';font-size:13px;text-align:center;padding:20px;', 'Loading audience data…');
    container.appendChild(loading);

    try{
      var films = await sb('films?id=eq.'+encodeURIComponent(filmId)+'&select=title,dist,genre,week,est_m,rt');
      if(!films.length){ container.innerHTML=''; container.appendChild(el('div','color:'+SUB+';font-size:13px;','Film not found.')); return; }
      var film = films[0];

      var picks = await sb('picks?film_id=eq.'+encodeURIComponent(filmId)+'&select=id');
      var watchers = picks.length;

      // Recent watchlist velocity — last 7 days vs prior 7
      var allPicks = await sb('picks?film_id=eq.'+encodeURIComponent(filmId)+'&select=picked_at');
      var now=Date.now(), wk=7*86400000;
      var last7=allPicks.filter(function(p){var t=new Date(p.picked_at).getTime();return t>=now-wk;}).length;
      var prev7=allPicks.filter(function(p){var t=new Date(p.picked_at).getTime();return t>=now-2*wk&&t<now-wk;}).length;
      var trend = prev7>0 ? Math.round((last7-prev7)/prev7*100) : (last7>0?100:0);

      container.innerHTML='';

      // Header
      var head=el('div','display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;');
      var brand=el('div','font-size:18px;font-weight:900;color:'+GOLD+';letter-spacing:-1px;','BOXD');
      var label=el('div','font-size:9px;color:'+SUB+';letter-spacing:1px;','AUDIENCE INTENT');
      var brandWrap=el('div'); brandWrap.appendChild(brand); brandWrap.appendChild(label);
      head.appendChild(brandWrap);
      container.appendChild(head);

      // Film title
      container.appendChild(el('div','font-size:15px;font-weight:700;margin-bottom:4px;', film.title));
      container.appendChild(el('div','font-size:11px;color:'+SUB+';margin-bottom:16px;', (film.dist||'')+' · '+(film.genre||'')));

      // Big number — watchers
      var statRow=el('div','display:flex;gap:12px;margin-bottom:14px;');
      var s1=el('div','flex:1;background:'+BG+';border-radius:10px;padding:12px;text-align:center;');
      s1.appendChild(el('div','font-size:24px;font-weight:800;color:'+GOLD+';', String(watchers)));
      s1.appendChild(el('div','font-size:9px;color:'+SUB+';margin-top:2px;', 'WATCHING'));
      statRow.appendChild(s1);
      var s2=el('div','flex:1;background:'+BG+';border-radius:10px;padding:12px;text-align:center;');
      var trendColor = trend>=0?GREEN:'#F04F5A';
      s2.appendChild(el('div','font-size:24px;font-weight:800;color:'+trendColor+';', (trend>=0?'+':'')+trend+'%'));
      s2.appendChild(el('div','font-size:9px;color:'+SUB+';margin-top:2px;', '7-DAY TREND'));
      statRow.appendChild(s2);
      container.appendChild(statRow);

      // CTA
      var cta=el('a','display:block;background:'+GOLD+';color:'+BG+';text-decoration:none;text-align:center;font-size:13px;font-weight:700;padding:11px;border-radius:10px;', 'See full forecast on BOXD →');
      cta.href='https://boxd-league-v2.vercel.app';
      cta.target='_blank';
      container.appendChild(cta);

      container.appendChild(el('div','font-size:9px;color:#46392E;text-align:center;margin-top:8px;', 'Live data from BOXD fantasy players'));

    }catch(e){
      container.innerHTML='';
      container.appendChild(el('div','color:'+SUB+';font-size:12px;text-align:center;padding:16px;','Audience data unavailable right now.'));
    }
  }

  function init(){
    var nodes=document.querySelectorAll('#boxd-widget,[data-boxd-film]');
    nodes.forEach(function(n){
      if(!n.getAttribute('data-film') && n.getAttribute('data-boxd-film'))
        n.setAttribute('data-film', n.getAttribute('data-boxd-film'));
      render(n);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
