
(function(){
  const CONFIG_URL = '/data/gaa_config.json';
  let ALL_ROWS = [];
  let LAST_GENDER = null;
  window.GAA_CHARTS = window.GAA_CHARTS || {};

  function gidCsvUrl(basePubId, gid){
    return `https://docs.google.com/spreadsheets/d/e/${basePubId}/pub?gid=${gid||0}&single=true&output=csv`;
  }

  async function loadConfig(){
    try{
      const res = await fetch(CONFIG_URL, {cache:'no-store'});
      if(!res.ok) throw new Error('config fetch failed');
      return await res.json();
    }catch(e){
      console.warn('Using built-in config fallback', e);
      return {};
    }
  }

  async function getCSVForGender(gender, cfg){
    if (gender==='male' && cfg.men_csv_url) return cfg.men_csv_url;
    if (gender==='female' && cfg.women_csv_url) return cfg.women_csv_url;
    if (cfg.base_pub_id){
      const gid = (gender==='male') ? (cfg.men_gid || '0') : (cfg.women_gid || '0');
      return gidCsvUrl(cfg.base_pub_id, gid);
    }
    return null;
  }

  function parseCSV(text){
    const rows = [];
    let i=0, field='', row=[], inQuotes=false;
    function pushField(){ row.push(field); field=''; }
    function pushRow(){ rows.push(row); row=[]; }
    while(i<text.length){
      const c=text[i];
      if(inQuotes){
        if(c==='\"' && text[i+1]==='\"'){ field+='\"'; i+=2; continue; }
        if(c==='\"'){ inQuotes=false; i++; continue; }
        field+=c; i++; continue;
      }else{
        if(c==='\"'){ inQuotes=true; i++; continue; }
        if(c===','){ pushField(); i++; continue; }
        if(c==='\r'){ i++; continue; }
        if(c==='\n'){ pushField(); pushRow(); i++; continue; }
        field+=c; i++; continue;
      }
    }
    pushField(); if(row.length>1 || (row.length===1 && row[0]!=='')){ pushRow(); }
    return rows;
  }

  function toObjects(rows){
    if(!rows || rows.length<1) return [];
    const headers = rows[0].map(h=>h.trim());
    return rows.slice(1).map(r=>{
      const o={};
      headers.forEach((h,idx)=> o[h]= (r[idx]??'').trim());
      return o;
    });
  }

  function dedupe(values){
    return Array.from(new Set(values.filter(v=>v && v!=='').map(v=>v.trim())));
  }

  function fillSelect(sel, options){
    if(!sel) return;
    const current = sel.value;
    sel.innerHTML = '';
    const first = document.createElement('option');
    first.value = 'All'; first.textContent = 'All';
    sel.appendChild(first);
    options.forEach(v=>{
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      sel.appendChild(opt);
    });
    if (options.includes(current)) sel.value=current;
  }

  function toNum(v){ const x = parseFloat(String(v).replace(/[^0-9.\-]/g,'')); return isNaN(x)? null : x; }

  function filterRows(rows, s){
    return rows.filter(o=>{
      const county = (o.county||o.County||o.team||o.Team||'').toLowerCase();
      const grade  = (o.grade||o.Grade||o.level||o.Level||'').toLowerCase();
      const countyOk = (s.county==='All') || (county === s.county.toLowerCase());
      const gradeOk  = (s.grade==='All')  || (grade === s.grade.toLowerCase());
      return countyOk && gradeOk;
    });
  }

  function renderTable(el, objects){
    if(!el) return;
    if(!objects || objects.length===0){ el.innerHTML = '<div class="text-slate-500">No data matches your filters yet.</div>'; return; }
    const headers = Object.keys(objects[0]);
    const table = document.createElement('table');
    table.className = 'min-w-full text-sm';
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    headers.forEach(h=>{
      const th=document.createElement('th');
      th.className='text-left px-2 py-1 border-b'; th.textContent=h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    objects.slice(0,200).forEach(o=>{
      const tr=document.createElement('tr');
      headers.forEach(h=>{
        const td=document.createElement('td');
        td.className='px-2 py-1 border-b align-top';
        td.textContent = o[h];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    el.innerHTML='';
    el.appendChild(table);
  }

  function updateCards(rows){
    const nums = (keyList) => rows.map(o=>{
      for (const k of keyList){
        const v = toNum(o[k]); if(v!=null) return v;
      }
      return null;
    }).filter(v=>v!=null);

    function avg(arr){ return arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
    const xpts = avg(nums(['xPoints','xpoints','x_pts','ExpPts']));
    const conv = avg(nums(['ConversionRate','Conv','conversion']));
    const ko   = avg(nums(['KickoutRetention','KO_Retention','Kickout%']));
    const toF  = avg(nums(['TurnoversForced','TO_Forced','Turnovers']));

    const setText = (id, val, suffix='')=>{
      const el = document.getElementById(id);
      if(el){ el.textContent = (val && !isNaN(val)) ? (suffix==='%'? Math.round(val*100)+'%' : (typeof val==='number'? (Math.round(val*10)/10) : val)) : '-'; }
    };
    setText('stat-xpoints', xpts||0, '');
    setText('stat-conv', conv||0, '%');
    setText('stat-ko', ko||0, '%');
    setText('stat-tof', toF||0, '');
  }

  function groupByDate(rows){
    const map = new Map();
    rows.forEach(o=>{
      const d = (o.Date||o.date||'').slice(0,10);
      const x = toNum(o.xPoints||o.xpoints||o.ExpPts||o.Scores);
      if(!d || x==null) return;
      if(!map.has(d)) map.set(d, []);
      map.get(d).push(x);
    });
    const labels = Array.from(map.keys()).sort();
    const data = labels.map(l=>{
      const arr = map.get(l)||[];
      return arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    });
    return {labels, data};
  }

  function ensureChart(canvasId, cfg){
    const ctx = document.getElementById(canvasId);
    if(!ctx) return null;
    const prev = window.GAA_CHARTS[canvasId];
    if(prev){ prev.destroy(); }
    const chart = new Chart(ctx, cfg);
    window.GAA_CHARTS[canvasId] = chart;
    return chart;
  }

  function updateCharts(rows){
    // Line: average xPoints (or Scores) by Date
    const {labels, data} = groupByDate(rows);
    ensureChart('seasonLine', {
      type: 'line',
      data: { labels, datasets:[{ label:'Season', data, fill:false, tension:0.25 }]},
      options: { responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:true}} }
    });

    // Radar: averages of key metrics
    function avgOf(keys){
      const vals = rows.map(o=>{
        for (const k of keys){ const v = toNum(o[k]); if(v!=null) return v; } return null;
      }).filter(v=>v!=null);
      if(!vals.length) return 0;
      return vals.reduce((a,b)=>a+b,0)/vals.length;
    }
    const metrics = [
      ['Shots', ['Shots']],
      ['Scores', ['Scores']],
      ['xPoints',['xPoints','xpoints','ExpPts']],
      ['Conv%',['ConversionRate','Conv']],
      ['KO%',['KickoutRetention','KO_Retention']],
      ['TO Forc',['TurnoversForced','Turnovers']],
    ];
    const rLabels = metrics.map(m=>m[0]);
    const rValues = metrics.map(m=>avgOf(m[1]));
    ensureChart('teamRadar', {
      type:'radar',
      data: { labels: rLabels, datasets:[{ label:'Team profile', data: rValues }]},
      options: { responsive:true, maintainAspectRatio:false, animation:false, plugins:{legend:{display:true}} }
    });
  }

  function refresh(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male', county:'All', grade:'All'};
    let rows = ALL_ROWS;
    const countySel = document.getElementById('countySelect');
    const gradeSel = document.getElementById('gradeSelect');
    if (countySel && gradeSel && (countySel.options.length<=1 || gradeSel.options.length<=1)){
      // Initial fill from data
      const counties = dedupe(rows.map(o=> o.county||o.County||o.team||o.Team)).sort();
      const grades   = dedupe(rows.map(o=> o.grade||o.Grade||o.level||o.Level)).sort();
      fillSelect(countySel, counties);
      fillSelect(gradeSel, grades);
    }
    const filtered = filterRows(rows, s);
    const container = document.getElementById('gaaDataTable') || document.querySelector('[data-gaa-table]');
    renderTable(container, filtered);
    updateCards(filtered);
    updateCharts(filtered);
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

  // If gender changes, refetch correct sheet; otherwise just filter+render
  async function handleStateChange(e){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male'};
    if (s.gender !== LAST_GENDER){
      LAST_GENDER = s.gender;
      await initialLoad();
    }else{
      refresh();
    }
  }

  document.addEventListener('DOMContentLoaded', initialLoad);
  document.addEventListener('ssstate:changed', handleStateChange);
})();
