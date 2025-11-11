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
    pf(); if(row.length>1 || (row.length===1 && row[0]!==''))
      pr();
    return rows;
  }
  function toObjects(rows){
    if(!rows.length) return [];
    const H = rows[0].map(h=>String(h).trim());
    return rows.slice(1).map(r=>{ const o={}; H.forEach((h,i)=> o[h] = (r[i]??'').toString().trim()); return o; });
  }
  const num = v => { const x=parseFloat(String(v).replace(/[^0-9.\-]/g,'')); return Number.isFinite(x)?x:null; };
  const dedupe = a => Array.from(new Set(a.filter(Boolean).map(s=>s.trim())));

  function ensureChart(id, cfg){
    const el = document.getElementById(id);
    if(!el) return null;
    try{
      const prev = window.GAA_CHARTS[id];
      if(prev && typeof prev.destroy === 'function'){ try{ prev.destroy(); }catch(e){ console.warn('prev destroy',e); } window.GAA_CHARTS[id]=null; }
      try{ const ref = Chart.getChart(id); if(ref) try{ ref.destroy(); }catch(e){} }catch(e){}
    }catch(e){ console.warn('ensureChart cleanup', e); }
    const chart = new Chart(el, cfg);
    window.GAA_CHARTS[id] = chart;
    return chart;
  }

  function filterRows(rows, s){
    return rows.filter(o=>{
      const county=(o.county||o.County||o.team||o.Team||'').toLowerCase();
      const grade =(o.grade ||o.Grade ||o.level||o.Level||'').toLowerCase();
      const okC = (s.county==='All') || (county===s.county.toLowerCase());
      const okG = (s.grade==='All')  || (grade===s.grade.toLowerCase());
      return okC && okG;
    });
  }

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
    const data = labels.map(d=> { const arr=map.get(d)||[]; return arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0; });
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
    const data=labels.map(k=>{ const arr=map.get(k)||[]; return arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0; });
    return {labels,data};
  }

  function updateSeasonLine(rows){
    const {labels,data}=groupAvgByDate(rows);
    ensureChart('seasonLine',{ type:'line', data:{ labels, datasets:[{ label:'Season', data, tension:0.25, fill:false }]}, options:{ responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:true}} } });
  }
  function updateRadar(rows){
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const take = (...keys)=> rows.map(o=>{ for(const k of keys){ const v=num(o[k]); if(v!=null) return v; } return null; }).filter(v=>v!=null);
    const labels = ['Shots','Scores','xPoints','Conv%','KO%','TO Forc'];
    const values = [ avg(take('Shots')), avg(take('Scores')), avg(take('xPoints','xpoints','ExpPts')), avg(take('ConversionRate','Conv')), avg(take('KickoutRetention','KO_Retention')), avg(take('TurnoversForced','Turnovers')) ];
    ensureChart('teamRadar', { type:'radar', data:{ labels, datasets:[{ label:'Team profile', data: values }]}, options:{ responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:true}} } });
  }

  function updateHeatmap(rows){
    const container = document.querySelector('[data-heatmap]');
    if(!container) return;
    const bins = 4;
    const grid = Array.from({length:bins}, ()=> Array(bins).fill(0));
    rows.forEach(r=>{
      const x = num(r.ShotX||r.shotX||r.X) ; const y = num(r.ShotY||r.shotY||r.Y);
      if(x==null || y==null){
        const z = (r.ShotZone||r.Zone||r.zone||'').toString().toUpperCase();
        if(z && z.length>=2){
          const col = z[0]==='L'?0:(z[0]==='C'?1:2);
          const depth = parseInt(z[1]||'2',10)-1;
          const xi = Math.min(3,col); const yi = Math.min(3, depth);
          grid[yi][xi] += 1;
        }
        return;
      }
      const xi = Math.max(0, Math.min(bins-1, Math.floor(x/(100/bins))));
      const yi = Math.max(0, Math.min(bins-1, Math.floor(y/(100/bins))));
      grid[yi][xi] += 1;
    });
    const flat = grid.flat(); const max = Math.max(1, ...flat);
    const div = document.createElement('div'); div.style.display='grid'; div.style.gridTemplateColumns=`repeat(${bins},1fr)`; div.style.gap='6px';
    grid.forEach(row=> row.forEach(v=>{ const cell=document.createElement('div'); cell.style.padding='24% 0'; cell.style.borderRadius='8px'; cell.style.backgroundColor=`rgba(234,88,12, ${0.12 + 0.7*(v/max)})`; div.appendChild(cell); }));
    container.innerHTML=''; container.appendChild(div);
  }

  function updateShotMap(rows){
    const cont = document.getElementById('shotMapContainer'); const canvas = document.getElementById('shotScatter'); try{ SmartSport && SmartSport.ensureContainerHeight && SmartSport.ensureContainerHeight(canvas); }catch(_e){} const overlay = document.querySelector('[data-zone-overlay]');
    if(!cont || !canvas || !overlay) return;
    const ptsMade = [], ptsMiss = [];
    const bins = 4; const A = Array.from({length:bins}, ()=> Array.from({length:bins}, ()=>({att:0, made:0})));
    const binIndex = v => Math.max(0, Math.min(bins-1, Math.floor(v/(100/bins))));
    const zoneToXY = z=>{ z=(z||'').toString().toUpperCase(); const lr = z[0]; const depth = parseInt(z[1]||'2',10); const x = lr==='L'?12.5:(lr==='C'?37.5:(lr==='R'?62.5:50)); const y = (depth-0.5)*(100/bins); return {x,y}; };

    rows.forEach(r=>{
      let x = num(r.ShotX||r.shotX||r.X); let y = num(r.ShotY||r.shotY||r.Y);
      if(x==null||y==null){ const z = r.ShotZone||r.Zone||r.zone; if(z){ const p=zoneToXY(z); x=p.x; y=p.y; } }
      if(x==null||y==null) return;
      const meta = {
        Date: r.Date||r.date||'',
        Result: r.Result||r.Made||r.result||'',
        Zone: r.ShotZone||r.Zone||r.zone||'',
        Opponent: r.Opponent||r.opponent||'',
        Shots: r.Shots||r.shots||'',
        Scores: r.Scores||r.scores||''
      };
      const res=(meta.Result||'').toString().toLowerCase(); const made = (res==='made'||res==='score'||res==='goal'||res==='point'||res==='1');
      // Provide raw object with meta to Chart.js so tooltip can access it
      const pointObj = { x: x, y: y, meta: meta };
      (made?ptsMade:ptsMiss).push(pointObj);
      const xi = binIndex(x), yi = binIndex(y); A[yi][xi].att += 1; if(made) A[yi][xi].made += 1;
    });

    // update overlay
    const maxAtt = Math.max(1, ...A.flat().map(c=>c.att));
    if(overlay.children.length !== bins*bins){ overlay.innerHTML=''; for(let i=0;i<bins*bins;i++){ const cell=document.createElement('div'); cell.className='flex items-center justify-center'; const span=document.createElement('span'); span.className='text-xs font-semibold text-slate-700 bg-white/60 rounded px-1'; span.textContent='—'; cell.appendChild(span); overlay.appendChild(cell); } }
    Array.from(overlay.children).forEach((cell, idx)=>{ const r=Math.floor(idx/bins), c=idx%bins; const {att,made}=A[r][c]; const pct = att? Math.round((made/att)*100) : 0; cell.querySelector('span').textContent = att? `${made}/${att} (${pct}%)` : '—'; cell.style.background = att? `rgba(234,88,12, ${0.06 + 0.25*(att/maxAtt)})` : 'transparent'; });

    // scatter chart with tooltips reading meta
    const cfg = {
      type:'scatter',
      data:{
        datasets:[
          { label:'Made', data: ptsMade, pointRadius:4, backgroundColor:'rgb(34,197,94)' },
          { label:'Miss', data: ptsMiss, pointRadius:3, backgroundColor:'rgb(249,115,22)' }
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false, animation:false,
        scales:{
          x:{ min:0, max:100, ticks:{display:false}, grid:{display:false} },
          y:{ min:0, max:100, reverse:true, ticks:{display:false}, grid:{display:false} }
        },
        plugins:{
          legend:{ display:true },
          tooltip:{
            enabled:true,
            callbacks:{
              title: function(items){ return items && items.length ? (items[0].raw && items[0].raw.meta && items[0].raw.meta.Date ? items[0].raw.meta.Date : '') : ''; },
              label: function(context){
                const raw = context.raw || {};
                const m = raw.meta || {};
                const coords = `X:${raw.x?.toFixed?raw.x.toFixed(1):raw.x}, Y:${raw.y?.toFixed?raw.y.toFixed(1):raw.y}`;
                const parts = [];
                if(m.Result) parts.push(`Result: ${m.Result}`);
                if(m.Zone) parts.push(`Zone: ${m.Zone}`);
                if(m.Opponent) parts.push(`Opp: ${m.Opponent}`);
                parts.push(coords);
                return parts;
              },
              afterBody: function(items){
                // optional extra small text
                return ['(Hover dot for details)'];
              }
            }
          }
        }
      }
    };
    ensureChart('shotScatter', cfg);
  }

  function updateExpectedPoints(rows){
    const el = document.getElementById('xPointsBar'); if(!el) return;
    const map=new Map();
    rows.forEach(o=>{ const opp=o.Opponent||o.opponent||''; const v=num(o.xPoints)||num(o.xpoints)||num(o.ExpPts)||num(o.Scores); if(!opp||v==null) return; if(!map.has(opp)) map.set(opp,[]); map.get(opp).push(v); });
    const labels=[...map.keys()].sort(); const data=labels.map(k=>{ const arr=map.get(k)||[]; return arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0; });
    ensureChart('xPointsBar',{ type:'bar', data:{ labels, datasets:[{ label:'Expected Points', data }]}, options:{ responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:false}} } });
  }

  function refresh(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male', county:'All', grade:'All'};
    let rows = ALL_ROWS;
    const countySel=document.getElementById('countySelect'); const gradeSel=document.getElementById('gradeSelect');
    if(countySel && gradeSel && (countySel.options.length<=1 || gradeSel.options.length<=1)){
      const counties = dedupe(rows.map(o=> o.county||o.County||o.team||o.Team)).sort();
      const grades = dedupe(rows.map(o=> o.grade ||o.Grade ||o.level||o.Level)).sort();
      fillSelect(countySel, counties); fillSelect(gradeSel, grades);
    }
    const filtered = filterRows(rows, s);
    renderTable(document.getElementById('gaaDataTable') || document.querySelector('[data-gaa-table]'), filtered);
    updateCards(filtered); updateSeasonLine(filtered); updateRadar(filtered); updateHeatmap(filtered); updateShotMap(filtered); updateExpectedPoints(filtered);
  }

  function fillSelect(sel, options){
    if(!sel) return;
    const current = sel.value;
    sel.innerHTML = '';
    const first = document.createElement('option'); first.value='All'; first.textContent='All'; sel.appendChild(first);
    options.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); });
    if(options.includes(current)) sel.value=current;
  }

  async function initialLoad(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male'};
    const cfg = await loadConfig();
    const url = await getCSVForGender(s.gender, cfg);
    if(!url){ console.warn('No Google Sheets CSV configured for GAA'); document.getElementById('gaaDataTable').innerHTML = '<div class=\"text-red-600\">No GAA CSV configured in data/gaa_config.json</div>'; return; }
    LAST_GENDER = s.gender;
    try{
      try{ SmartSport && SmartSport.showLoader && SmartSport.showLoader('#shotMapContainer'); SmartSport.showLoader && SmartSport.showLoader('#gaaDataTableWrap'); }catch(_e){}
      const res = await fetch(url, {cache:'no-store'});
      if(!res.ok){ console.error('Sheet fetch failed', res.status); document.getElementById('gaaDataTable').innerHTML = `<div class="text-red-600">Failed to load sheet (status ${res.status}).</div>`; return; }
      const text = await res.text();
      ALL_ROWS = toObjects(parseCSV(text));
      refresh();
      try{ SmartSport && SmartSport.hideLoader && SmartSport.hideLoader('#shotMapContainer'); SmartSport.hideLoader && SmartSport.hideLoader('#gaaDataTableWrap'); }catch(_e){}
    }catch(e){
      console.error('sheet fetch error', e);
      document.getElementById('gaaDataTable').innerHTML = `<div class="text-red-600">Error loading sheet: ${e.message}</div>`;
    }
  }

  async function handleStateChange(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male'};
    if(s.gender !== LAST_GENDER){ await initialLoad(); } else { refresh(); }
  }

  document.addEventListener('DOMContentLoaded', initialLoad);
  document.addEventListener('ssstate:changed', handleStateChange);
})();
