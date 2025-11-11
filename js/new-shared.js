
window.SmartSport = (function(){

// ---- Smart defaults for Chart.js & loader utilities (Week1 patch) ----
if (window.Chart && Chart.defaults) {
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.responsive = true;
  Chart.defaults.animation = false;
}
function ensureContainerHeight(ctx){
  try {
    const parent = ctx && ctx.canvas ? ctx.canvas.parentElement : (ctx && ctx.parentElement);
    if (parent && !parent.style.height) { parent.style.height = '380px'; }
  } catch(_e){}
}
function showLoader(target){
  try{
    const el = (typeof target==='string') ? document.querySelector(target) : target;
    if(!el) return;
    let overlay = el.querySelector(':scope > .ss-loader');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'ss-loader absolute inset-0 flex items-center justify-center bg-white/60 z-20';
      overlay.innerHTML = '<div class="animate-spin h-8 w-8 rounded-full border-4 border-slate-400 border-t-transparent"></div>';
      el.style.position = el.style.position || 'relative';
      el.appendChild(overlay);
    }
  }catch(_e){}
}
function hideLoader(target){
  try{
    const el = (typeof target==='string') ? document.querySelector(target) : target;
    if(!el) return;
    const overlay = el.querySelector(':scope > .ss-loader');
    if(overlay) overlay.remove();
  }catch(_e){}
}

  const charts = {};
  function lineChart(ctx, label="Season", data=null){
    const points = data || Array.from({length:28}, (_,i)=>({x:i+1, y: Math.round(10 + Math.sin(i/3)*4 + i*0.3 + (Math.random()*1.5))}));
    if (charts[ctx.id]) charts[ctx.id].destroy();
    ensureContainerHeight(ctx && ctx.canvas ? ctx.canvas : ctx);
    charts[ctx.id] = new Chart(ctx, { type:'line', data:{ datasets:[{ label, data:points, fill:false, tension:0.35 }]}, options:{ responsive:true, plugins:{legend:{display:true}}, scales:{x:{display:false}} } });
  }
  function radarChart(ctx, labels=null, values=null){
    labels = labels || ['Attack','Possession','Kickouts','Defending','Transition'];
    values = values || labels.map(()=>Math.round(40 + Math.random()*55));
    if (charts[ctx.id]) charts[ctx.id].destroy();
    ensureContainerHeight(ctx && ctx.canvas ? ctx.canvas : ctx);
    charts[ctx.id] = new Chart(ctx, { type:'radar', data:{ labels, datasets:[{ label:'Team Profile', data:values, fill:true }]}, options:{ responsive:true, plugins:{legend:{display:false}} } });
  }
  function heatmapTable(container){
    const grid = document.createElement('div'); grid.className="grid grid-cols-5 gap-1 h-56";
    const vals = Array.from({length:25},()=>Math.random()); const max = Math.max(...vals);
    vals.forEach(v=>{ const cell=document.createElement('div'); const a=v/max; cell.style.backgroundColor=`rgba(234,88,12,${0.15 + a*0.5})`; cell.className="rounded"; grid.appendChild(cell);});
    container.innerHTML=""; container.appendChild(grid);
  }
  function parseCSV(file, onRows){ const reader=new FileReader(); reader.onload=(e)=>{ const text=e.target.result; const rows=text.split(/\r?\n/).filter(Boolean).map(r=>r.split(',')); onRows(rows); }; reader.readAsText(file); }
  function bindUploads(){
    document.querySelectorAll('[data-upload=\"csv\"]').forEach(card=>{
      const input = card.querySelector('input[type=\"file\"]'); const log = card.querySelector('[data-log]'); const chartId = card.dataset.chartTarget;
      input.addEventListener('change', ()=>{ const f=input.files[0]; if(!f) return; parseCSV(f, rows=>{ const nums=rows.slice(1).map(r=>parseFloat(r[1])).filter(x=>!isNaN(x)); const ctx=document.getElementById(chartId); if(ctx){ if(nums.length){ const points=nums.map((y,i)=>({x:i+1,y})); lineChart(ctx,'From CSV',points); log.textContent=`Loaded ${nums.length} rows.`; } else { log.textContent="No numeric data found in column 2."; }}}); });
    });
  }
  function init(){ document.querySelectorAll('canvas[data-chart=\"line\"]').forEach(c=>lineChart(c)); document.querySelectorAll('canvas[data-chart=\"radar\"]').forEach(c=>radarChart(c)); document.querySelectorAll('[data-heatmap]').forEach(el=>heatmapTable(el)); bindUploads(); }
  return { init, lineChart, radarChart, heatmapTable, showLoader, hideLoader, ensureContainerHeight };
})();
document.addEventListener('DOMContentLoaded', ()=> SmartSport.init());
