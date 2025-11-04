
(function(){
  const KEY = 'smartsport_state_v2';
  const DEFAULTS = { sport:'gaa', gender:'male', grade:'Senior', county:'All' };
  function readURL(){ const p=new URLSearchParams(location.search); const o={}; for(const k of ['sport','gender','grade','county']) if(p.has(k)) o[k]=p.get(k); return o; }
  function readStore(){ try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}} }
  function saveStore(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  function get(){ return Object.assign({}, DEFAULTS, readStore(), readURL()); }
  function set(next){ const merged=Object.assign({}, get(), next); saveStore(merged);
    const u=new URL(location.href); ['sport','gender','grade','county'].forEach(k=>u.searchParams.set(k, merged[k])); history.replaceState(null,'',u.toString());
    patchLinks(merged); applyUI(merged); }
  function setSelectValue(sel, value){
    if(!sel) return;
    // try by value
    if ([...sel.options].some(o=>o.value===value)) { sel.value=value; return; }
    // try by text match
    const match=[...sel.options].find(o=>(o.text||'').toLowerCase()===String(value).toLowerCase());
    if (match) sel.value=match.value; else if (sel.options.length) sel.selectedIndex=0;
  }
  function applyUI(s){
    setSelectValue(document.getElementById('sportSelect'), s.sport);
    setSelectValue(document.getElementById('gradeSelect'), s.grade);
    setSelectValue(document.getElementById('countySelect'), s.county);
    document.querySelectorAll('[data-gender]').forEach(btn=>{
      btn.classList.toggle('bg-slate-700', btn.dataset.gender===s.gender);
      btn.classList.toggle('hover:bg-slate-700', btn.dataset.gender!==s.gender);
    });
  }
  function patchLinks(s){
    document.querySelectorAll('a[href$=".html"]').forEach(a=>{
      try{
        const u=new URL(a.getAttribute('href'), location.href);
        const params=new URLSearchParams(u.search);
        ['sport','gender','grade','county'].forEach(k=>params.set(k, s[k]));
        u.search='?'+params.toString();
        a.setAttribute('href', u.pathname + u.search);
      }catch(_e){}
    });
  }
  function init(){
    const s = get(); // merged
    // Ensure URL always carries state, even on first load
    const u=new URL(location.href);
    let changed=false; ['sport','gender','grade','county'].forEach(k=>{ if(u.searchParams.get(k)!==String(s[k])){ u.searchParams.set(k, s[k]); changed=true; } });
    if (changed){ history.replaceState(null,'',u.toString()); }
    applyUI(s); patchLinks(s);

    const sportSel=document.getElementById('sportSelect'); if(sportSel) sportSel.addEventListener('change', ()=> set({ sport: sportSel.value }));
    const gradeSel=document.getElementById('gradeSelect'); if(gradeSel) gradeSel.addEventListener('change', ()=> set({ grade: gradeSel.value }));
    const countySel=document.getElementById('countySelect'); if(countySel) countySel.addEventListener('change', ()=> set({ county: countySel.value }));
    document.querySelectorAll('[data-gender]').forEach(btn=> btn.addEventListener('click', ()=> set({ gender: btn.dataset.gender })));
  }

  // Intercept clicks on internal page links to force carrying state
  function interceptLinkClicks(){
    document.addEventListener('click', function(e){
      const a = e.target.closest('a');
      if(!a) return;
      const href = a.getAttribute('href') || '';
      // Only handle local html links (relative or same-origin)
      if (!/\.html($|\?)/i.test(href)) return;
      try{
        const u = new URL(href, location.href);
        const s = get();
        ['sport','gender','grade','county'].forEach(k=>u.searchParams.set(k, s[k]));
        a.setAttribute('href', u.pathname + u.search);
      }catch(_e){}
    }, true);
  }

  document.addEventListener('DOMContentLoaded', function(){ init(); interceptLinkClicks(); });
  window.SSState={get,set};
})();
