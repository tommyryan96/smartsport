"""Builds the sample report pages (demo data only) that are screenshotted for the website."""
from pitch import pitch, legend, TEAM, PLAYER

HEAD = '''<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/site.css"></head>
<body class="bg-white text-slate-900 antialiased" style="margin:0">'''

def stat(value, label, accent=False):
    bg = "bg-accent-50" if accent else "bg-emerald-50"
    tc = "text-accent-700" if accent else "text-emerald-700"
    return f'<div class="rounded-2xl {bg} px-4 py-4 text-center"><p class="text-3xl font-extrabold {tc}">{value}</p><p class="text-sm text-slate-500 mt-1">{label}</p></div>'

def bar(label, ours, theirs):
    total = ours + theirs
    return f'''<div><div class="flex justify-between text-sm mb-1"><span class="font-semibold text-emerald-700">{ours}</span><span class="text-slate-500">{label}</span><span class="font-semibold text-slate-400">{theirs}</span></div>
<div class="flex h-2.5 rounded-full overflow-hidden bg-slate-200"><div class="bg-emerald-600" style="width:{ours/total*100:.0f}%"></div><div class="bg-slate-300" style="width:{theirs/total*100:.0f}%"></div></div></div>'''

LEGEND = legend()

def header(kicker, title, right):
    return f'''<div class="bg-emerald-700 text-white px-10 py-7 flex items-center justify-between">
<div class="flex items-center gap-4"><img src="../../assets/logo-192.png" class="h-14 w-auto bg-white rounded-xl p-1.5" alt="">
<div><p class="text-accent-300 text-sm font-semibold uppercase tracking-wider">{kicker}</p><p class="text-3xl font-extrabold">{title}</p></div></div>
<div class="text-right text-emerald-100 text-sm">{right}</div></div>'''

match = HEAD + '<main id="sheet" style="width:1200px">' + header("ÉireMetrics match report", "Senior League · Round 4", "Sample report<br>Demo data") + f'''
<div class="px-10 py-8 grid grid-cols-5 gap-8">
  <div class="col-span-3">
    <div class="flex items-end justify-between mb-6">
      <div><p class="text-slate-500">Your team</p><p class="text-5xl font-extrabold text-emerald-700">1-16</p></div>
      <p class="text-slate-400 font-semibold pb-2">Full time</p>
      <div class="text-right"><p class="text-slate-500">Opposition</p><p class="text-5xl font-extrabold text-slate-400">0-12</p></div>
    </div>
    <p class="font-bold mb-3">Shot map: your team</p>
    {pitch(700, 380, TEAM)}
    {LEGEND}
  </div>
  <div class="col-span-2 space-y-6">
    <div class="grid grid-cols-2 gap-3">
      {stat("71%", "Shot conversion")}
      {stat("21", "Shots")}
      {stat("18/24", "Own kickouts won")}
      {stat("2", "2-pointers", True)}
    </div>
    <div class="space-y-4">
      <p class="font-bold">Head to head</p>
      {bar("Scores", 15, 12)}
      {bar("Wides", 6, 9)}
      {bar("Turnovers won", 22, 17)}
      {bar("Kickouts won", 26, 19)}
    </div>
    <div class="rounded-2xl border border-slate-200 p-5">
      <p class="font-bold mb-3">Three takeaways for training</p>
      <ol class="space-y-2 text-slate-700 list-decimal list-inside">
        <li>Short kickouts worked: 14 of 15 won.</li>
        <li>4 wides came from outside 40 m. Work the ball closer.</li>
        <li>Turnovers in their half led to 0-6. Keep the press high.</li>
      </ol>
    </div>
  </div>
</div></main></body></html>'''

player = HEAD + '<main id="sheet" style="width:1200px">' + header("ÉireMetrics player report", "No. 8 · Midfield", "Senior League · Round 4<br>Sample report, demo data") + f'''
<div class="px-10 py-8 grid grid-cols-5 gap-8">
  <div class="col-span-2 space-y-6">
    <div class="grid grid-cols-2 gap-3">
      {stat("0-05", "Scored")}
      {stat("67%", "Shot conversion")}
      {stat("6", "Possessions won")}
      {stat("2", "Turnovers lost", True)}
    </div>
    <div class="rounded-2xl border border-slate-200 p-5 space-y-4">
      <div><p class="font-bold text-emerald-700 mb-1">Strengths</p><p class="text-slate-700">Won 4 of her 6 possessions in the middle third, and scored from both sides.</p></div>
      <div><p class="font-bold text-accent-700 mb-1">One thing to work on</p><p class="text-slate-700">Both wides came under pressure from range. Look for the pass inside first.</p></div>
    </div>
  </div>
  <div class="col-span-3">
    <p class="font-bold mb-3">Her shots</p>
    {pitch(700, 380, PLAYER)}
    {LEGEND}
    <div class="grid grid-cols-4 gap-3 mt-6 text-center">
      <div class="rounded-xl bg-slate-50 py-3"><p class="text-xl font-bold">6</p><p class="text-xs text-slate-500">Shots</p></div>
      <div class="rounded-xl bg-slate-50 py-3"><p class="text-xl font-bold">3</p><p class="text-xs text-slate-500">Points</p></div>
      <div class="rounded-xl bg-slate-50 py-3"><p class="text-xl font-bold">1</p><p class="text-xs text-slate-500">2-pointers</p></div>
      <div class="rounded-xl bg-slate-50 py-3"><p class="text-xl font-bold">2</p><p class="text-xs text-slate-500">Wides</p></div>
    </div>
  </div>
</div></main></body></html>'''

open("match.html", "w", encoding="utf-8").write(match)
open("player.html", "w", encoding="utf-8").write(player)
print("built")
