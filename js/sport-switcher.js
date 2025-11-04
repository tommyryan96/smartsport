
(function(){
  const KNOWN=['gaa','rugby','loi'];
  function pageSlug(){ const f=(location.pathname.split('/').pop()||'index.html'); const s=f.replace('.html',''); return s===''?'index':s; }
  function detectSport(){
    const parts=location.pathname.split('/').filter(Boolean);
    const idx=parts.findIndex(p=>KNOWN.includes(p));
    return idx>=0?{sport:parts[idx], idx, parts}:null;
  }
  function buildHref(newSport, slug){
    const found=detectSport(); const file=(slug==='index'?'index.html':slug+'.html');
    if(found){ const parts=found.parts.slice(); parts[found.idx]=newSport; parts[parts.length-1]=file;
      const base=(location.pathname.startsWith('/')?'/':''); const u=new URL(location.origin + base + parts.join('/'));
      // carry state params
      try{ const s=(window.SSState && window.SSState.get && window.SSState.get()) || {}; ['sport','gender','grade','county'].forEach(k=>u.searchParams.set(k, s[k]||'')); }catch(_e){}
      return u.pathname + u.search;
    } else {
      const base = new URL('.', location.href);
      const u = new URL(`./${newSport}/${file}`, base);
      try{ const s=(window.SSState && window.SSState.get && window.SSState.get()) || {}; ['sport','gender','grade','county'].forEach(k=>u.searchParams.set(k, s[k]||'')); }catch(_e){}
      return u.href;
    }
  }
  function init(){
    const sel=document.getElementById('sportSelect'); if(!sel) return;
    // set current value from state if present
    try{ const s=(window.SSState && window.SSState.get && window.SSState.get()) || {}; if (s.sport) sel.value=s.sport; }catch(_e){}
    sel.addEventListener('change', ()=>{
      // save to state first
      try{ window.SSState && window.SSState.set && window.SSState.set({ sport: sel.value }); }catch(_e){}
      const href=buildHref(sel.value, pageSlug());
      window.location.href = href;
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
