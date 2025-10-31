
(function(){
  const key = 'smartsport-gender';
  const defaultGender = localStorage.getItem(key) || 'male';
  function apply(g){
    document.querySelectorAll('[data-gender-src]').forEach(img=>{
      const map = JSON.parse(img.getAttribute('data-gender-src'));
      img.src = map[g];
    });
    document.querySelectorAll('[data-gender-text]').forEach(el=>{
      const map = JSON.parse(el.getAttribute('data-gender-text'));
      el.textContent = map[g];
    });
    document.querySelectorAll('[data-gender-class]').forEach(el=>{
      const map = JSON.parse(el.getAttribute('data-gender-class'));
      el.className = map[g];
    });
    const btn = document.getElementById('genderToggle');
    if(btn){ btn.textContent = g === 'male' ? 'Male' : 'Female'; }
    localStorage.setItem(key, g);
  }
  window.setGender = function(g){ apply(g); };
  document.addEventListener('DOMContentLoaded', ()=>apply(defaultGender));
})();
