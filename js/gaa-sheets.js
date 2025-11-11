(function(){
  const CONFIG_URL = '/data/gaa_config.json';
  let ALL_ROWS = [];
  let LAST_GENDER = null;
  window.GAA_CHARTS = window.GAA_CHARTS || {};

  /* ---------------------------- helpers ---------------------------- */

  async function loadConfig(){
    try {
      const res = await fetch(CONFIG_URL, {cache:'no-store'});
      if(!res.ok) throw new Error(res.status);
      return await res.json();
    } catch {
      console.warn('Missing or invalid gaa_config.json');
      return {};
    }
  }

  async function getCSVForGender(g, cfg){
    if(g==='male' && cfg.men_csv_url) return cfg.men_csv_url;
    if(g==='female' && cfg.women_csv_url) return cfg.women_csv_url;
    return null;
  }

  function parseCSV(text){
    const rows=[], row=[], pushField=()=>{row.push(field); field='';}, pushRow=()=>{rows.push([...row]); row.length=0;};
    let field='', i=0, q=false;
    while(i<text.length){
      const c=text[i];
      if(q){
        if(c=='"' && text[i+1]=='"'){ field+='"'; i+=2; continue; }
        if(c=='"'){ q=false; i++; continue; }
        field+=c; i++; continue;
      }
      if(c=='"'){ q=true; i++; continue; }
      if(c==','){ pushField(); i++; continue; }
      if(c=='\r'){ i++; continue; }
      if(c=='\n'){ pushField(); pushRow(); i++; continue; }
      field+=c; i++;
    }
    pushField(); if(row.length) pushRow();
    return rows;
  }

  function toObjects(rows){
    if(!rows.length) return [];
    const headers = rows[0].map(h=>String(h).trim());
    return rows.slice(1).map(r=>{
      const o={};
      headers.forEach((h,i)=> o[h] = (r[i]||'').trim());
      return o;
    });
  }

  const num = v => {
    if(v===undefined || v===null) return null;
    const x=parseFloat(String(v).replace(/[^0-9.\-]/g,''));
    return Number.isFinite(x)?x:null;
  };
  const dedupe = a => Array.from(new Set(a.filter(Boolean).map(s=>s.trim())));

  /* ------------------------- chart lifecycle ------------------------ */

  function ensureChart(id, cfg){
    const el=document.getElementById(id);
    if(!el) return null;
    try{
      const prev=window.GAA_CHARTS[id];
      if(prev && prev.destroy) prev.destroy();
      const inst=Chart.getChart(id);
      if(inst) inst.destroy();
    }catch(e){}
    const chart=new Chart(el,cfg);
    window.GAA_CHARTS[id]=chart;
    return chart;
  }

  /* ----------------------------- helpers ---------------------------- */

  function setText(id,val,pct=false){
    const el=document.getElementById(id);
    if(!el) return;
    if(val==null){ el.textContent='—'; return; }
    el.textContent=pct ? Math.round(val*100)+'%' : (Math.round(val*10)/10);
  }

  function updateCards(rows){
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const take = (...keys)=> rows.map(o=>{
      for(const k of keys){
        const v=num(o[k]);
        if(v!=null) return v;
      }
      return null;
    }).filter(v=>v!=null);

    setText('stat-xpoints', avg(take('xPoints','xpoints','ExpPts')));
    setText('stat-conv', avg(take('ConversionRate','Conv','conversion')), true);
    setText('stat-ko', avg(take('KickoutRetention','KO_Retention','Kickout%')), true);
    setText('stat-tof', avg(take('TurnoversForced','TO_Forced','Turnovers')));
  }

  function renderTable(el, rows){
    if(!el) return;
    if(!rows.length){ el.innerHTML='<div class="text-slate-500">No data found.</div>'; return; }
    const keys=Object.keys(rows[0]);
    const th=keys.map(h=>`<th class="text-left px-2 py-1 border-b">${h}</th>`).join('');
    const tb=rows.slice(0,200).map(o=>`<tr>${keys.map(h=>`<td class="px-2 py-1 border-b">${o[h]??''}</td>`).join('')}</tr>`).join('');
    el.innerHTML=`<table class="min-w-full text-sm"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`;
  }

  /* --------------------------- small charts -------------------------- */

  function groupAvg(rows, key, metric){
    const map=new Map();
    rows.forEach(o=>{
      const k=o[key];
      const v=num(o[metric]) ?? num(o.xPoints) ?? num(o.Scores);
      if(!k || v==null) return;
      if(!map.has(k)) map.set(k, []);
      map.get(k).push(v);
    });
    const labels=[...map.keys()].sort();
    const data=labels.map(k=>{
      const arr=map.get(k)||[];
      return arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    });
    return {labels,data};
  }

  function updateExpectedPoints(rows){
    const {labels,data}=groupAvg(rows,'Opponent','xPoints');
    ensureChart('xPointsBar',{
      type:'bar',
      data:{labels, datasets:[{label:'Expected Points',data,backgroundColor:'#93c5fd'}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}
    });
  }

  function updateSeasonLine(rows){
    const {labels,data}=groupAvg(rows,'Date','xPoints');
    ensureChart('seasonLine',{
      type:'line',
      data:{labels,datasets:[{label:'Form',data,tension:0.25,borderColor:'#38bdf8'}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}
    });
  }

  function updateRadar(rows){
    const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
    const take=(...keys)=>rows.map(o=>{for(const k of keys){const v=num(o[k]);if(v!=null)return v;}return null;}).filter(Boolean);
    const vals=[
      avg(take('Shots')),avg(take('Scores')),avg(take('xPoints')),avg(take('ConversionRate')),
      avg(take('KickoutRetention')),avg(take('TurnoversForced'))
    ];
    const labels=['Shots','Scores','xPoints','Conv%','KO%','TO forced'];
    ensureChart('teamRadar',{
      type:'radar',
      data:{labels,datasets:[{label:'Profile',data:vals,borderColor:'#3b82f6',fill:true,backgroundColor:'rgba(59,130,246,0.2)'}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}
    });
  }

  function updateHeatmap(rows){
    const container=document.querySelector('[data-heatmap]');
    if(!container) return;
    const bins=4, grid=Array.from({length:bins},()=>Array(bins).fill(0));
    rows.forEach(r=>{
      const x=num(r.ShotX), y=num(r.ShotY);
      if(x==null||y==null) return;
      const xi=Math.max(0,Math.min(bins-1,Math.floor(x/(100/bins))));
      const yi=Math.max(0,Math.min(bins-1,Math.floor(y/(100/bins))));
      grid[yi][xi]+=1;
    });
    const max=Math.max(...grid.flat(),1);
    const div=document.createElement('div');
    div.style.display='grid';
    div.style.gridTemplateColumns=`repeat(${bins},1fr)`;
    div.style.gap='6px';
    grid.forEach(row=>row.forEach(v=>{
      const cell=document.createElement('div');
      cell.style.padding='24% 0';
      cell.style.borderRadius='8px';
      cell.style.backgroundColor=`rgba(234,88,12,${0.15+0.7*(v/max)})`;
      div.appendChild(cell);
    }));
    container.innerHTML='';
    container.appendChild(div);
  }

  /* ---------------------------- shot map ---------------------------- */

  function updateShotMap(rows){
    const canvas=document.getElementById('shotScatter');
    const overlay=document.querySelector('[data-zone-overlay]');
    if(!canvas||!overlay) return;

    const ptsMade=[], ptsMiss=[];
    const bins=4, A=Array.from({length:bins},()=>Array.from({length:bins},()=>({att:0,made:0})));
    const binIndex=v=>Math.max(0,Math.min(bins-1,Math.floor(v/(100/bins))));

    rows.forEach(r=>{
      const x=num(r.ShotX), y=num(r.ShotY);
      if(x==null||y==null) return;
      const res=(r.Result||r.Made||'').toLowerCase();
      const made=(res==='made'||res==='score'||res==='goal'||res==='point'||res==='1');
      const meta={Date:r.Date||'',Result:r.Result||'',Zone:r.ShotZone||'',Opponent:r.Opponent||''};
      const obj={x,y,meta};
      (made?ptsMade:ptsMiss).push(obj);
      const xi=binIndex(x), yi=binIndex(y);
      A[yi][xi].att+=1; if(made) A[yi][xi].made+=1;
    });

    // zone overlay update
    const maxAtt=Math.max(...A.flat().map(c=>c.att),1);
    const cells=overlay.children;
    if(cells.length<16){
      overlay.innerHTML='';
      for(let i=0;i<16;i++){const d=document.createElement('div');const s=document.createElement('span');s.textContent='—';d.appendChild(s);overlay.appendChild(d);}
    }
    Array.from(overlay.children).forEach((cell,idx)=>{
      const r=Math.floor(idx/bins), c=idx%bins;
      const {att,made}=A[r][c];
      const pct=att?Math.round((made/att)*100):0;
      const span=cell.querySelector('span');
      span.textContent=att?`${made}/${att} (${pct}%)`:'—';
      cell.style.background=att?`rgba(234,88,12,${0.08+0.25*(att/maxAtt)})`:'transparent';
    });

    // Scatter chart (coordinates 0-100, goal = top, so reverse Y)
    const cfg={
      type:'scatter',
      data:{
        datasets:[
          {label:'Made',data:ptsMade,pointRadius:4,backgroundColor:'#22c55e'},
          {label:'Miss',data:ptsMiss,pointRadius:3,backgroundColor:'#f97316'}
        ]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        animation:false,
        scales:{
          x:{min:0,max:100,ticks:{display:false},grid:{display:false}},
          y:{min:0,max:100,reverse:true,ticks:{display:false},grid:{display:false}} // <– goal at top
        },
        plugins:{
          legend:{display:false},
          tooltip:{
            callbacks:{
              title:items=>items?.[0]?.raw?.meta?.Date||'',
              label:ctx=>{
                const m=ctx.raw?.meta||{};
                const coords=`X:${ctx.raw.x.toFixed(1)} Y:${ctx.raw.y.toFixed(1)}`;
                return [`Result: ${m.Result||'—'}`,`Zone: ${m.Zone||'—'}`,`Opp: ${m.Opponent||'—'}`,coords];
              }
            }
          }
        }
      }
    };
    ensureChart('shotScatter',cfg);
  }

  /* ------------------------------ main ------------------------------ */

  function filterRows(rows,s){
    return rows.filter(o=>{
      const c=(o.County||o.Team||'').toLowerCase();
      const g=(o.Grade||o.Level||'').toLowerCase();
      const okC=s.county==='All'||c===s.county.toLowerCase();
      const okG=s.grade==='All'||g===s.grade.toLowerCase();
      return okC&&okG;
    });
  }

  function fillSelect(sel,opts){
    if(!sel) return;
    const cur=sel.value;
    sel.innerHTML='';
    const def=document.createElement('option');
    def.textContent='All'; def.value='All'; sel.appendChild(def);
    opts.forEach(o=>{const opt=document.createElement('option');opt.value=o;opt.textContent=o;sel.appendChild(opt);});
    if(opts.includes(cur)) sel.value=cur;
  }

  function refresh(){
    const s=(window.SSState&&window.SSState.get())||{county:'All',grade:'All'};
    const rows=filterRows(ALL_ROWS,s);
    updateCards(rows);
    updateExpectedPoints(rows);
    updateSeasonLine(rows);
    updateRadar(rows);
    updateHeatmap(rows);
    updateShotMap(rows);
    renderTable(document.getElementById('gaaDataTable'),rows);
  }

  async function initialLoad(){
    const s=(window.SSState&&window.SSState.get())||{gender:'male'};
    const cfg=await loadConfig();
    const url=await getCSVForGender(s.gender,cfg);
    if(!url){ console.error('No CSV configured'); return; }
    try{
      const res=await fetch(url,{cache:'no-store'});
      if(!res.ok) throw new Error(res.status);
      const txt=await res.text();
      ALL_ROWS=toObjects(parseCSV(txt));
      LAST_GENDER=s.gender;
      refresh();
    }catch(e){
      console.error('Load error',e);
    }
  }

  async function handleStateChange(){
    const s=(window.SSState&&window.SSState.get())||{gender:'male'};
    if(s.gender!==LAST_GENDER) await initialLoad(); else refresh();
  }

  document.addEventListener('DOMContentLoaded',initialLoad);
  document.addEventListener('ssstate:changed',handleStateChange);
})();
