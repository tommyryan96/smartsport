
// Lightweight Google Sheets -> UI loader for GAA pages
// Usage: include this script on GAA pages. It fills county/grade selects and renders a simple table.
// Config comes from /data/gaa_config.json

(function(){
  const CONFIG_URL = '/data/gaa_config.json';

  function gidCsvUrl(basePubId, gid){
    // Convert base pub id to CSV endpoint
    // Example: https://docs.google.com/spreadsheets/d/e/<ID>/pub?gid=<gid>&single=true&output=csv
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
    // precedence: direct URL -> derive from base id + gid -> null
    if (gender==='male' && cfg.men_csv_url) return cfg.men_csv_url;
    if (gender==='female' && cfg.women_csv_url) return cfg.women_csv_url;
    if (cfg.base_pub_id){
      const gid = (gender==='male') ? (cfg.men_gid || '0') : (cfg.women_gid || '0');
      return gidCsvUrl(cfg.base_pub_id, gid);
    }
    return null;
  }

  function parseCSV(text){
    // very small CSV parser; handles quotes and commas
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
    // last field
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

  function fillSelect(sel, options, keepFirst=false){
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

  function filterRows(rows, s){
    return rows.filter(o=>{
      const genderOk = true; // already split per gender file
      const countyOk = (s.county==='All') || ( (o.county||o.County||o.team||o.Team||'').toLowerCase() === s.county.toLowerCase() );
      const gradeOk  = (s.grade==='All') || ( (o.grade||o.Grade||o.level||o.Level||'').toLowerCase() === s.grade.toLowerCase() );
      return genderOk && countyOk && gradeOk;
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

  async function init(){
    const s = (window.SSState && window.SSState.get()) || {sport:'gaa', gender:'male', county:'All', grade:'All'};
    const cfg = await loadConfig();
    const url = await getCSVForGender(s.gender, cfg);
    if(!url){ console.warn('No Google Sheets CSV configured for GAA'); return; }
    const res = await fetch(url, {cache:'no-store'});
    const text = await res.text();
    const rows = parseCSV(text);
    const objects = toObjects(rows);

    // update select options based on data
    const countySel = document.getElementById('countySelect');
    const gradeSel = document.getElementById('gradeSelect');
    if (countySel){
      const counties = dedupe(objects.map(o=> o.county||o.County||o.team||o.Team)).sort();
      fillSelect(countySel, counties);
      countySel.addEventListener('change', ()=> window.SSState.set({ county: countySel.value }));
    }
    if (gradeSel){
      const grades = dedupe(objects.map(o=> o.grade||o.Grade||o.level||o.Level)).sort();
      fillSelect(gradeSel, grades);
      gradeSel.addEventListener('change', ()=> window.SSState.set({ grade: gradeSel.value }));
    }

    const filtered = filterRows(objects, s);
    // render a table into any element with id 'gaaDataTable' or data role
    const container = document.getElementById('gaaDataTable') || document.querySelector('[data-gaa-table]');
    renderTable(container, filtered);

    // Expose for debugging
    window.GAA_SHEETS = { config: cfg, url, all: objects, filtered };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
