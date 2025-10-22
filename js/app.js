
function setActive(link){
  document.querySelectorAll('.nav a').forEach(a=>a.classList.remove('active'));
  if(link) link.classList.add('active');
}
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>setActive(a)));

function updateCompare(){
  const a = document.getElementById('playerA').value;
  const b = document.getElementById('playerB').value;
  const metrics = ['carries','metres','tackles','turnovers'];
  const data = {
    "Caelan Doris": { carries: 18, metres: 123, tackles: 14, turnovers: 2 },
    "Josh van der Flier": { carries: 14, metres: 95, tackles: 20, turnovers: 3 },
    "Tadhg Beirne": { carries: 10, metres: 85, tackles: 17, turnovers: 1 },
    "Garry Ringrose": { carries: 8, metres: 76, tackles: 9, turnovers: 1 },
    "Dan Sheehan": { carries: 11, metres: 68, tackles: 12, turnovers: 2 },
  };
  metrics.forEach(m=>{
    const av = data[a][m], bv = data[b][m];
    const maxv = Math.max(av,bv,1);
    document.getElementById('barA-'+m).style.width = (av/maxv*100)+'%';
    document.getElementById('barB-'+m).style.width = (bv/maxv*100)+'%';
    document.getElementById('val-'+m).textContent = av+' vs '+bv;
  });
}
window.updateCompare = updateCompare;
