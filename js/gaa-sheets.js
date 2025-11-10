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
        if(c=='"' && t[i+1]=='"'){ f+='"'; i+=2; continue; }
        if(c=='"'){ q=false; i++; continue; }
        f+=c; i++; continue;
      }else{
        if(c=='"'){ q=true; i++; continue; }
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

  // ---- Filtering + UI fill
  function filterRows(rows, s){
    return rows.filter(o=>{
      const county=(o.county||o.County||o.team||o.Team||'').toLowerCase();
      const grade =(o.grade ||o.Grade ||o.level||o.Level||'').toLowerCase();
      const okC = (s.county==='All') || (county===s.county.toLowerCase());
      const okG = (s.grade==='All')  || (grade===s.grade.toLowerCase());
      return okC && okG;
    });
  }
  function fillSelect(sel, options){
    if(!sel) return;
    const current = sel.value;
    sel.innerHTML='';
    const first=document.createElement('option');
    first.value='All'; first.textContent='All';
    sel.appendChild(first);
    options.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); });
    if(options.includes(current)) sel.value=current;
  }

  // ---- Table render
  function renderTable(el, rows){
    if(!el) return;
    if(!rows.length){ el.innerHTML='<div class="text-slate-500">No data matches your filters yet.</div>'; return; }
    const keys = Object.keys(rows[0]);
    const th = keys.map(h=>`<th class="text-left px-2 py-1 border-b">${h}</th>`).join('');
    const tb = rows.slice(0,200).map(o=>{
      return `<tr>${keys.map(h=>`<td class="px-2 py-1 border-b align-top">${o[h]??''}</td>`).join('')}</tr>`;
    }).join('');
    el.innerHTML = `<table class="min-w-full text-sm"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`;
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

  // ---- Heatmap (Shooting by Zone)
  function updateHeatmap(rows){
    const box = document.querySelector('[data-heatmap]');
    if(!box) return;

    // prefer explicit zone bucket, else bin ShotX/ShotY into 4x4
    const hasZone = rows.some(r => r.ShotZone || r.Zone || r.zone);
    let grid;
    if(hasZone){
      const labels=['L1','L2','L3','L4','C1','C2','C3','C4','R1','R2','R3','R4']; // any labels allowed; we count occurrences
      const map=new Map();
      rows.forEach(r=>{
        const z=(r.ShotZone||r.Zone||r.zone||'').toString().trim();
        if(!z) return;
        map.set(z, (map.get(z)||0)+1);
      });
      // Render as 4x3 (L/C/R x 1..4) if those zones exist; otherwise fallback to normalized bins
      const left = labels.filter(z=>z.startsWith('L'));
      const center = labels.filter(z=>z.startsWith('C'));
      const right = labels.filter(z=>z.startsWith('R'));
      const columns=[left,center,right].filter(col=>col.length);
      const colCounts = columns.map(col => col.map(z=> map.get(z)||0));
      grid = colCounts[0] ? transpose(colCounts) : null; // rows (depth) x cols (L/C/R)
    }
    if(!grid){
      // 4x4 bins on ShotX/ShotY in [0,100]
      const bins=4;
      grid = Array.from({length:bins}, ()=> Array(bins).fill(0));
      rows.forEach(r=>{
        const x = num(r.ShotX||r.shotX||r.x)||num(r.ShotLon)||num(r.X);
        const y = num(r.ShotY||r.shotY||r.y)||num(r.ShotLat)||num(r.Y);
        if(x==null||y==null) return;
        const xi = Math.max(0, Math.min(bins-1, Math.floor(x/ (100/bins))));
        const yi = Math.max(0, Math.min(bins-1, Math.floor(y/ (100/bins))));
        grid[yi][xi] += 1;
      });
    }
    const flat = grid.flat();
    const max = Math.max(1, ...flat);
    // build grid
    const rowsDiv = document.createElement('div');
    rowsDiv.style.display='grid';
    rowsDiv.style.gridTemplateColumns = `repeat(${grid[0].length}, minmax(0,1fr))`;
    rowsDiv.style.gap='6px';
    grid.forEach(r=>{
      r.forEach(v=>{
        const cell = document.createElement('div');
        cell.style.width='100%';
        cell.style.paddingTop='65%';
        cell.style.borderRadius='8px';
        cell.style.backgroundColor=`rgba(234,88,12, ${0.2 + 0.8*(v/max)})`; // orange-ish scale
        rowsDiv.appendChild(cell);
      });
    });
    box.innerHTML=''; box.appendChild(rowsDiv);

    function transpose(a){ return a[0].map((_,c)=>a.map(r=>r[c])); }
  }

  // ---- Expected Points chart (by Opponent if canvas exists, else by Date)
  function updateExpectedPoints(rows){
    const byOppEl = document.getElementById('xPointsBar');
    if(byOppEl){
      const {labels,data}=groupAvgByOpponent(rows);
      ensureChart('xPointsBar', {
        type:'bar',
        data:{ labels, datasets:[{ label:'Expected Points', data }]},
        options:{ responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:false}} }
      });
      return;
    }
    // Fallback: line by date if only seasonLine exists
    updateSeasonLine(rows);
  }

  // ---- Orchestration
  function refresh(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male', county:'All', grade:'All'};
    let rows = ALL_ROWS;

    // first-time fill for selects
    const countySel=document.getElementById('countySelect');
    const gradeSel =document.getElementById('gradeSelect');
    if(countySel && gradeSel && (countySel.options.length<=1 || gradeSel.options.length<=1)){
      const counties = dedupe(rows.map(o=> o.county||o.County||o.team||o.Team)).sort();
      const grades   = dedupe(rows.map(o=> o.grade ||o.Grade ||o.level||o.Level)).sort();
      fillSelect(countySel, counties);
      fillSelect(gradeSel, grades);
    }

    const filtered = filterRows(rows, s);
    renderTable(document.getElementById('gaaDataTable') || document.querySelector('[data-gaa-table]'), filtered);
    updateCards(filtered);
    updateSeasonLine(filtered);
    updateRadar(filtered);
    updateHeatmap(filtered);
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
