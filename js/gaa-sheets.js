
(function(){
  const CONFIG_URL = '/data/gaa_config.json';
  let ALL_ROWS = [];
  let LAST_GENDER = null;
  window.GAA_CHARTS = window.GAA_CHARTS || {};

  function gidCsvUrl(basePubId, gid){
    return `https://docs.google.com/spreadsheets/d/e/${basePubId}/pub?gid=${gid||0}&single=true&output=csv`;
  }
  async function loadConfig(){
    try{ const r=await fetch(CONFIG_URL,{cache:'no-store'}); if(!r.ok) throw 0; return r.json(); }
    catch{ return {}; }
  }
  async function getCSVForGender(g,cfg){
    if(g==='male'&&cfg.men_csv_url) return cfg.men_csv_url;
    if(g==='female'&&cfg.women_csv_url) return cfg.women_csv_url;
    if(cfg.base_pub_id){ const gid=(g==='male')?(cfg.men_gid||'0'):(cfg.women_gid||'0'); return gidCsvUrl(cfg.base_pub_id,gid); }
    return null;
  }

  // ---- CSV helpers
  function parseCSV(t){
    const rows=[]; let i=0,f='',row=[],q=false;
    const pf=()=>{row.push(f);f='';}, pr=()=>{rows.push(row);row=[];};
    while(i<t.length){
      const c=t[i];
      if(q){
        if(c=='\"' && t[i+1]=='\"'){ f+='\"'; i+=2; continue; }
        if(c=='\"'){ q=false; i++; continue; }
        f+=c; i++; continue;
      }else{
        if(c=='\"'){ q=true; i++; continue; }
        if(c==','){ pf(); i++; continue; }
        if(c=='\r'){ i++; continue; }
        if(c=='\n'){ pf(); pr(); i++; continue; }
        f+=c; i++; continue;
      }
    }
    pf(); if(row.length>1 || (row.length===1 && row[0]!=='')) pr();
    return rows;
  }
  function toObjects(rows){
    if(!rows.length) return [];
    const H = rows[0].map(h=>String(h).trim());
    return rows.slice(1).map(r=>{
      const o={}; H.forEach((h,i)=> o[h] = (r[i]??'').toString().trim()); return o;
    });
  }
  const num = v => { const x=parseFloat(String(v).replace(/[^0-9.\-]/g,'')); return Number.isFinite(x)?x:null; };
  const dedupe = a => Array.from(new Set(a.filter(Boolean).map(s=>s.trim())));

  // ---- Filtering
  function filterRows(rows, s){
    return rows.filter(o=>{
      const county=(o.county||o.County||o.team||o.Team||'').toLowerCase();
      const grade =(o.grade ||o.Grade ||o.level||o.Level||'').toLowerCase();
      const okC = (s.county==='All') || (county===s.county.toLowerCase());
      const okG = (s.grade==='All')  || (grade===s.grade.toLowerCase());
      return okC && okG;
    });
  }

  // ---- Table render
  function renderTable(el, rows){
    if(!el) return;
    if(!rows.length){ el.innerHTML='<div class=\"text-slate-500\">No data matches your filters yet.</div>'; return; }
    const keys = Object.keys(rows[0]);
    const th = keys.map(h=>`<th class=\"text-left px-2 py-1 border-b\">${h}</th>`).join('');
    const tb = rows.slice(0,200).map(o=>{
      return `<tr>${keys.map(h=>`<td class=\"px-2 py-1 border-b align-top\">${o[h]??''}</td>`).join('')}</tr>`;
    }).join('');
    el.innerHTML = `<table class=\"min-w-full text-sm\"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`;
  }

  // ---- KPI cards
  function setText(id, val, pct=false){
    const el=document.getElementById(id); if(!el) return;
    if(val==null || Number.isNaN(val)){ el.textContent='-'; return; }
    el.textContent = pct ? Math.round(val*100)+'%' : Math.round(val*10)/10;
  }
  function updateCards(rows){
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const take = (...keys)=> rows.map(o=>{ for(const k of keys){ const v=num(o[k]); if(v!=null) return v; } return null; }).filter(v=>v!=null);
    setText('stat-xpoints', avg(take('xPoints','xpoints','ExpPts')));
    setText('stat-conv',   avg(take('ConversionRate','Conv','conversion')), true);
    setText('stat-ko',     avg(take('KickoutRetention','KO_Retention','Kickout%')), true);
    setText('stat-tof',    avg(take('TurnoversForced','TO_Forced','Turnovers')));
  }

  // ---- Charts
  function ensureChart(id, cfg){
    const el=document.getElementById(id); if(!el) return null;
    if(window.GAA_CHARTS[id]){ window.GAA_CHARTS[id].destroy(); }
    return (window.GAA_CHARTS[id] = new Chart(el, cfg));
  }
  function groupAvgByDate(rows){
    const map=new Map();
    rows.forEach(o=>{
      const d=(o.Date||o.date||'').slice(0,10);
      const v = num(o.xPoints)||num(o.xpoints)||num(o.ExpPts)||num(o.Scores);
      if(!d||v==null) return;
      if(!map.has(d)) map.set(d, []);
      map.get(d).push(v);
    });
    const labels = [...map.keys()].sort();
    const data = labels.map(d=> {
      const arr=map.get(d)||[]; return arr.reduce((a,b)=>a+b,0)/arr.length;
    });
    return {labels, data};
  }
  function groupAvgByOpponent(rows){
    const map=new Map();
    rows.forEach(o=>{
      const opp=o.Opponent||o.opponent||'';
      const v = num(o.xPoints)||num(o.xpoints)||num(o.ExpPts)||num(o.Scores);
      if(!opp||v==null) return;
      if(!map.has(opp)) map.set(opp, []);
      map.get(opp).push(v);
    });
    const labels=[...map.keys()].sort();
    const data=labels.map(k=>{ const arr=map.get(k)||[]; return arr.reduce((a,b)=>a+b,0)/arr.length; });
    return {labels,data};
  }
  function updateSeasonLine(rows){
    const {labels,data}=groupAvgByDate(rows);
    ensureChart('seasonLine',{
      type:'line',
      data:{ labels, datasets:[{ label:'Season', data, tension:0.25, fill:false }]},
      options:{ responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:true}} }
    });
  }
  function updateRadar(rows){
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const take = (...keys)=> rows.map(o=>{ for(const k of keys){ const v=num(o[k]); if(v!=null) return v; } return null; }).filter(v=>v!=null);
    const labels = ['Shots','Scores','xPoints','Conv%','KO%','TO Forc'];
    const values = [
      avg(take('Shots')),
      avg(take('Scores')),
      avg(take('xPoints','xpoints','ExpPts')),
      avg(take('ConversionRate','Conv')),
      avg(take('KickoutRetention','KO_Retention')),
      avg(take('TurnoversForced','Turnovers'))
    ];
    ensureChart('teamRadar', {
      type:'radar',
      data:{ labels, datasets:[{ label:'Team profile', data: values }]},
      options:{ responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:true}} }
    });
  }

  // ---- Heatmap overlay + Scatter
  function updateShotMap(rows){
    const cont = document.getElementById('shotMapContainer');
    const canvas = document.getElementById('shotScatter');
    const overlay = document.querySelector('[data-zone-overlay]');
    if(!canvas || !cont || !overlay) return;

    // Build scatter datasets from ShotX/ShotY with Result (Made/Miss)
    const ptsMade=[], ptsMiss=[];
    // 4x4 bins conversion
    const bins=4;
    const A = Array.from({length:bins}, ()=> Array.from({length:bins}, ()=>({att:0, made:0})));
    function binIndex(v){ return Math.max(0, Math.min(bins-1, Math.floor(v/ (100/bins)))); }
    // Fallback mapping from ShotZone -> (x,y) approx
    const zoneToXY = (z)=>{
      z = String(z||'').toUpperCase().trim();
      const lr = z[0]; const depth = parseInt(z[1]||'2',10);
      const x = lr==='L'? 12.5 : lr==='C'? 50 : 87.5; // centers of 4 bins horizontally
      const y = depth>=1 && depth<=4 ? (depth-0.5)*(100/bins) : 50;
      return {x,y};
    };

    rows.forEach(r=>{
      let x = num(r.ShotX||r.shotX||r.X), y = num(r.ShotY||r.shotY||r.Y);
      if(x==null || y==null){
        const z = r.ShotZone||r.Zone||r.zone;
        if(z){ const p=zoneToXY(z); x=p.x; y=p.y; }
      }
      if(x==null || y==null) return;
      const res=(r.Result||r.Made||r.result||'').toString().toLowerCase();
      const made = (res==='made' || res==='score' || res==='goal' || res==='point' || res==='1' );
      (made?ptsMade:ptsMiss).push({x, y});
      const xi=binIndex(x), yi=binIndex(y);
      A[yi][xi].att += 1; if(made) A[yi][xi].made += 1;
    });

    // Update overlay conversion % labels
    const maxAtt = Math.max(1, ...A.flat().map(c=>c.att));
    // Ensure overlay has 16 cells
    if(overlay.children.length !== bins*bins){
      overlay.innerHTML='';
      for(let i=0;i<bins*bins;i++){
        const cell=document.createElement('div'); cell.className='flex items-center justify-center';
        const span=document.createElement('span'); span.className='text-xs font-semibold text-slate-700 bg-white/60 rounded px-1'; span.textContent='—';
        cell.appendChild(span); overlay.appendChild(cell);
      }
    }
    Array.from(overlay.children).forEach((cell, idx)=>{
      const r=Math.floor(idx/bins), c=idx%bins;
      const {att, made} = A[r][c];
      const pct = att? Math.round((made/att)*100) : 0;
      cell.querySelector('span').textContent = att? `${pct}%` : '—';
      // Optional subtle bg tint by attempts
      cell.style.background = att? `rgba(234,88,12, ${0.10 + 0.25*(att/maxAtt)})` : 'transparent';
    });

    // Draw scatter (0..100)
    const cfg = {
      type:'scatter',
      data:{
        datasets:[
          { label:'Made', data: ptsMade, pointRadius:4 },
          { label:'Miss', data: ptsMiss, pointRadius:3 }
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false, animation:false,
        scales:{
          x:{ suggestedMin:0, suggestedMax:100, ticks:{display:false}, grid:{display:false} },
          y:{ suggestedMin:0, suggestedMax:100, reverse:true, ticks:{display:false}, grid:{display:false} }
        },
        plugins:{ legend:{display:true} }
      }
    };
    ensureChart('shotScatter', cfg);
  }

  // ---- Expected Points bar (by Opponent)
  function updateExpectedPoints(rows){
    const el = document.getElementById('xPointsBar');
    if(!el) return;
    const map=new Map();
    rows.forEach(o=>{
      const opp=o.Opponent||o.opponent||'';
      const v = num(o.xPoints)||num(o.xpoints)||num(o.ExpPts)||num(o.Scores);
      if(!opp||v==null) return;
      if(!map.has(opp)) map.set(opp, []);
      map.get(opp).push(v);
    });
    const labels=[...map.keys()].sort();
    const data=labels.map(k=>{ const arr=map.get(k)||[]; return arr.reduce((a,b)=>a+b,0)/arr.length; });
    ensureChart('xPointsBar', {
      type:'bar',
      data:{ labels, datasets:[{ label:'Expected Points', data }]},
      options:{ responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:false}} }
    });
  }

  function refresh(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male', county:'All', grade:'All'};
    let rows = ALL_ROWS;

    // first-time fill for selects
    const countySel=document.getElementById('countySelect');
    const gradeSel =document.getElementById('gradeSelect');
    if(countySel && gradeSel && (countySel.options.length<=1 || gradeSel.options.length<=1)){
      const counties = dedupe(rows.map(o=> o.county||o.County||o.team||o.Team)).sort();
      const grades   = dedupe(rows.map(o=> o.grade ||o.Grade ||o.level||o.Level)).sort();
      countySel.innerHTML = ''; gradeSel.innerHTML='';
      [countySel, gradeSel].forEach(sel=>{
        const opt=document.createElement('option'); opt.value='All'; opt.textContent='All'; sel.appendChild(opt);
      });
      counties.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; countySel.appendChild(o); });
      grades.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; gradeSel.appendChild(o); });
    }

    const filtered = filterRows(rows, s);
    renderTable(document.getElementById('gaaDataTable') || document.querySelector('[data-gaa-table]'), filtered);
    updateCards(filtered);
    updateSeasonLine(filtered);
    updateRadar(filtered);
    updateShotMap(filtered);
    updateExpectedPoints(filtered);
  }

  async function initialLoad(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male'};
    const cfg = await loadConfig();
    const url = await getCSVForGender(s.gender, cfg);
    if(!url){ console.warn('No Google Sheets CSV configured for GAA'); return; }
    LAST_GENDER = s.gender;
    const res = await fetch(url, {cache:'no-store'});
    const text = await res.text();
    ALL_ROWS = toObjects(parseCSV(text));
    refresh();
  }
  async function handleStateChange(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male'};
    if(s.gender!==LAST_GENDER){ await initialLoad(); } else { refresh(); }
  }

  document.addEventListener('DOMContentLoaded', initialLoad);
  document.addEventListener('ssstate:changed', handleStateChange);
})();
