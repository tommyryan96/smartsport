// /scripts/fetch-data.js
import fs from 'fs/promises';
import https from 'https';

const sources = {
  rugby_men:    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5TMxRHmuw9L1P5IxBVaT8ybXMhVS0V8l3SVN1IwxAPH_j_BFgsL7GuPCKUFORI-CDdZQ_pEvB5TOp/pub?gid=0&single=true&output=csv',
  rugby_women:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5TMxRHmuw9L1P5IxBVaT8ybXMhVS0V8l3SVN1IwxAPH_j_BFgsL7GuPCKUFORI-CDdZQ_pEvB5TOp/pub?gid=597838010&single=true&output=csv',
  loi_men:      'https://docs.google.com/.../export?format=csv&id=...&gid=...',
  loi_women:    'https://docs.google.com/.../export?format=csv&id=...&gid=...',
  gaa_men:      'https://docs.google.com/.../export?format=csv&id=...&gid=...',
  gaa_women:    'https://docs.google.com/.../export?format=csv&id=...&gid=...'
};

function get(url){ return new Promise((res, rej)=>{
  https.get(url, r => {
    let d=''; r.on('data', c=>d+=c); r.on('end', ()=>res(d));
  }).on('error', rej);
});}

await fs.mkdir('data', { recursive: true });
for (const [name, url] of Object.entries(sources)) {
  const csv = await get(url);
  await fs.writeFile(`data/${name}.csv`, csv, 'utf8');
  console.log('Saved', name);
}
